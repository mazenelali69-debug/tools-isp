require("dotenv").config();
const netNeighbors = require("net");
const { spawn } = require("child_process");
const { execFile } = require("child_process");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const snmp = require("net-snmp");
const { v4: uuidv4 } = require("uuid");

process.on("uncaughtException", (err) => console.error("🔥 UncaughtException:", err));
process.on("unhandledRejection", (err) => console.error("🔥 UnhandledRejection:", err));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

// In-memory monitor registry
const monitors = new Map();

function snmpGet(session, oids) {
  return new Promise((resolve, reject) => {
    session.get(oids, (err, varbinds) => {
      if (err) return reject(err);
      resolve(varbinds);
    });
  });
}

function makeSession(ip, community) {
  const session = snmp.createSession(ip, community, {
    timeout: 2000,
    retries: 1,
    version: snmp.Version2c,
  });
  session.on("error", (err) => console.error("SNMP session error:", ip, err?.message || err));
  return session;
}

// Traffic OIDs (HC counters)
const OID_ifHCIn  = "1.3.6.1.2.1.31.1.1.1.6";
const OID_ifIn    = "1.3.6.1.2.1.2.2.1.10";
const OID_ifHCOut = "1.3.6.1.2.1.31.1.1.1.10";
const OID_ifOut   = "1.3.6.1.2.1.2.2.1.16";

// ---------- Routes ----------
app.get("/health", (req, res) => res.json({ ok: true, service: "tools-isp-backend" }));

// SNMP basic test (sysDescr.0)
app.post("/api/snmp/test", async (req, res) => {
  const { ip, community } = req.body || {};
  if (!ip || !community) return res.status(400).json({ ok: false, error: "ip+community required" });

  const session = makeSession(ip, community);
  try {
    const vb = (await snmpGet(session, ["1.3.6.1.2.1.1.1.0"]))[0];
    if (!vb) return res.status(502).json({ ok: false, error: "No varbind returned" });
    if (snmp.isVarbindError(vb)) return res.status(502).json({ ok: false, error: String(snmp.varbindError(vb)) });
    return res.json({ ok: true, sysDescr: String(vb.value) });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  } finally {
    try { session.close(); } catch {}
  }
});

// Interfaces (robust):
// 1) Try tableColumns (fast)
// 2) If 0 rows, fallback to by-index using ifNumber + GET per index (works when walk/table blocked)
app.post("/api/interfaces", async (req, res) => {
  const { ip, community } = req.body || {};
  if (!ip || !community) return res.status(400).json({ ok: false, error: "ip+community required" });

  const session = makeSession(ip, community);

  const IFENTRY_BASE  = "1.3.6.1.2.1.2.2.1";      // 2=ifDescr, 5=ifSpeed
  const IFXENTRY_BASE = "1.3.6.1.2.1.31.1.1.1";   // 1=ifName

  const OID_ifNumber = "1.3.6.1.2.1.2.1.0";
  const OID_ifDescr  = "1.3.6.1.2.1.2.2.1.2";
  const OID_ifSpeed  = "1.3.6.1.2.1.2.2.1.5";
  const OID_ifName   = "1.3.6.1.2.1.31.1.1.1.1";

  function tableColumns(baseOid, columns) {
    return new Promise((resolve, reject) => {
      session.tableColumns(baseOid, columns, (err, table) => {
        if (err) return reject(err);
        resolve(table || {});
      });
    });
  }

  async function tryTable() {
    let ifTable = {};
    let ifXTable = {};
    try { ifTable = await tableColumns(IFENTRY_BASE, [2, 5]); } catch { ifTable = {}; }
    try { ifXTable = await tableColumns(IFXENTRY_BASE, [1]); } catch { ifXTable = {}; }

    const idxSet = new Set([...Object.keys(ifTable || {}), ...Object.keys(ifXTable || {})]);
    const rows = [];

    for (const k of idxSet) {
      const ifIndex = parseInt(k, 10);
      if (!Number.isFinite(ifIndex)) continue;

      const ifDescrV = ifTable?.[k]?.[2];
      const ifSpeedV = ifTable?.[k]?.[5];
      const ifNameV  = ifXTable?.[k]?.[1];

      const ifDescr = ifDescrV != null ? String(ifDescrV) : null;
      const ifSpeed = ifSpeedV != null ? Number(ifSpeedV) : null;
      const ifName  = ifNameV  != null ? String(ifNameV)  : (ifDescr || null);

      if (ifName || ifDescr) rows.push({ ifIndex, ifName, ifDescr, ifSpeed: Number.isFinite(ifSpeed) ? ifSpeed : null });
    }

    rows.sort((a,b)=>a.ifIndex-b.ifIndex);
    return rows;
  }

  async function tryByIndex() {
    const vbN = (await snmpGet(session, [OID_ifNumber]))[0];
    if (!vbN) throw new Error("No response for ifNumber.0");
    if (snmp.isVarbindError(vbN)) throw new Error(String(snmp.varbindError(vbN)));

    const n = Number(vbN.value);
    if (!Number.isFinite(n) || n <= 0 || n > 2048) throw new Error(`Invalid ifNumber value: ${vbN.value}`);

    const rows = [];
    for (let i = 1; i <= n; i++) {
      try {
        const oids = [`${OID_ifName}.${i}`, `${OID_ifDescr}.${i}`, `${OID_ifSpeed}.${i}`];
        const vbs = await snmpGet(session, oids);

        const vbName  = vbs[0];
        const vbDescr = vbs[1];
        const vbSpeed = vbs[2];

        const ifName  = (vbName  && !snmp.isVarbindError(vbName))  ? String(vbName.value)  : null;
        const ifDescr = (vbDescr && !snmp.isVarbindError(vbDescr)) ? String(vbDescr.value) : null;
        const ifSpeed = (vbSpeed && !snmp.isVarbindError(vbSpeed)) ? Number(vbSpeed.value) : null;

        if (ifName || ifDescr) {
          rows.push({
            ifIndex: i,
            ifName: ifName || ifDescr,
            ifDescr: ifDescr || ifName,
            ifSpeed: Number.isFinite(ifSpeed) ? ifSpeed : null
          });
        }
      } catch {
        // ignore missing indices
      }
    }

    rows.sort((a,b)=>a.ifIndex-b.ifIndex);
    return rows;
  }

  try {
    let rows = await tryTable();
    if (rows.length === 0) rows = await tryByIndex();

    if (rows.length === 0) {
      return res.status(502).json({
        ok: false,
        error: "SNMP reachable (sysDescr works) but interfaces not accessible. RouterOS SNMP view/permissions likely block IF-MIB."
      });
    }

    return res.json({ ok: true, interfaces: rows });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  } finally {
    try { session.close(); } catch {}
  }
});


function parseCounter(vb) {
  if (!vb || snmp.isVarbindError(vb)) return null;

  const val = vb.value;

  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);

  if (Buffer.isBuffer(val)) {
    try {
      return parseInt(val.toString("hex"), 16);
    } catch {
      return null;
    }
  }

  if (typeof val?.toString === "function") {
    const n = Number(val.toString());
    if (Number.isFinite(n)) return n;
  }

  return null;
}
// Start monitor (SNMP traffic) - pushes updates over Socket.IO
app.post("/api/monitors", (req, res) => {
  const { ip, community, ifIndex, label, intervalMs } = req.body || {};
  if (!ip || !community || !ifIndex) return res.status(400).json({ ok: false, error: "ip+community+ifIndex required" });

  const id = uuidv4();
  const poll = Math.max(1000, Math.min(5000, Number(intervalMs || 1000)));
  const session = makeSession(ip, community);

  const state = { id, ip, label: label || ip, ifIndex: Number(ifIndex), poll, session, last: null, timer: null };

  state.timer = setInterval(async () => {
    const now = Date.now();
    try {
      const oids = [`${OID_ifHCIn}.${state.ifIndex}`, `${OID_ifHCOut}.${state.ifIndex}`];
      const vbs = await snmpGet(session, oids);

      const inOct = parseCounter(vbs[0]);
      const outOct = parseCounter(vbs[1]);
      if (!Number.isFinite(inOct) || !Number.isFinite(outOct)) throw new Error("Invalid counter values (non-numeric).");

      if (state.last) {
        const dt = (now - state.last.t) / 1000;
        const din = inOct - state.last.in;
        const dout = outOct - state.last.out;

        const downMbps = (din * 8) / dt / 1_000_000;
        const upMbps   = (dout * 8) / dt / 1_000_000;

        io.emit("monitor:update", {
          id: state.id, ip: state.ip, label: state.label, ifIndex: state.ifIndex, ts: now,
          down_mbps: Math.max(0, Number(downMbps.toFixed(3))),
          up_mbps: Math.max(0, Number(upMbps.toFixed(3))),
          ok: true
        });
      }

      state.last = { t: now, in: inOct, out: outOct };
    } catch (e) {
      io.emit("monitor:update", {
        id: state.id, ip: state.ip, label: state.label, ifIndex: state.ifIndex, ts: now,
        ok: false, error: String(e.message || e)
      });
    }
  }, poll);

  monitors.set(id, state);
  res.json({ ok: true, id });
});

// Stop monitor
app.delete("/api/monitors/:id", (req, res) => {
  const id = req.params.id;
  const m = monitors.get(id);
  if (!m) return res.json({ ok: true });

  clearInterval(m.timer);
  try { m.session.close(); } catch {}
  monitors.delete(id);

  io.emit("monitor:stopped", { id });
  res.json({ ok: true });
});

// List monitors
app.get("/api/monitors", (req, res) => {
  const list = [...monitors.values()].map(m => ({ id: m.id, ip: m.ip, label: m.label, ifIndex: m.ifIndex, poll: m.poll }));
  res.json({ ok: true, monitors: list });
});


app.post("/api/debug/walk-ifdescr", async (req, res) => {
  const { ip, community } = req.body || {};
  if (!ip || !community) return res.status(400).json({ ok:false });

  const session = makeSession(ip, community);
  const OID = "1.3.6.1.2.1.2.2.1.2";

  const rows = [];

  try {
    await new Promise((resolve, reject) => {
      session.subtree(OID, (vb) => {
        if (!snmp.isVarbindError(vb)) {
          rows.push({
            oid: vb.oid,
            value: vb.value.toString()
          });
        }
      }, (err)=> err?reject(err):resolve());
    });

    res.json({ ok:true, rows });

  } catch(e) {
    res.status(500).json({ ok:false, error:String(e) });
  } finally {
    try { session.close(); } catch {}
  }
});

//
// API: Universal interfaces via SNMP CLI (snmpwalk) — works across vendors
// POST /api/interfaces-cli  { ip, community }
// returns: { ok:true, count, interfaces:[{ifIndex, ifName}] }
//
app.post("/api/interfaces-cli",(req,res)=>{
  const { ip, community } = req.body || {};
  if(!ip || !community) return res.status(400).json({ ok:false, error:"ip+community required" });

  // walk ifDescr table (IF-MIB::ifDescr)
  const oid = "1.3.6.1.2.1.2.2.1.2";

  const args = ["-v2c","-c", String(community), String(ip), oid];

  // hard timeout: 10s
  let done = false;
  const killer = setTimeout(()=>{
    if(done) return;
    done = true;
    return res.status(504).json({ ok:false, error:"snmpwalk timed out" });
  }, 10000);

  execFile("snmpwalk", args, { timeout: 9500, windowsHide: true }, (err, stdout, stderr) => {
    if(done) return;
    clearTimeout(killer);
    done = true;

    if(err){
      const msg = (stderr && String(stderr).trim()) ? String(stderr).trim() : String(err.message || err);
      return res.status(502).json({ ok:false, error: msg });
    }

    const out = String(stdout || "");
    const lines = out.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

    const rows = [];
    for(const line of lines){
      // Example: IF-MIB::ifDescr.49153 = STRING: gigabitEthernet 1/0/1
      const m = line.match(/ifDescr\.(\d+)\s*=\s*STRING:\s*(.*)$/i);
      if(!m) continue;
      const ifIndex = parseInt(m[1],10);
      const ifName = (m[2] || "").trim();
      if(Number.isFinite(ifIndex) && ifName) rows.push({ ifIndex, ifName });
    }

    rows.sort((a,b)=>a.ifIndex-b.ifIndex);
    return res.json({ ok:true, count: rows.length, interfaces: rows });
  });
});


//
// API: Start monitor (Universal counters: try HC64 then fallback to 32-bit)
// POST /api/monitors-universal { ip, community, ifIndex, label, intervalMs }
// emits: monitor:update
//
app.post("/api/monitors-universal",(req,res)=>{
  const { ip, community, ifIndex, label, intervalMs } = req.body || {};
  if(!ip || !community || !ifIndex) return res.status(400).json({ ok:false, error:"ip+community+ifIndex required" });

  const id = uuidv4();
  const poll = Math.max(1000, Math.min(5000, Number(intervalMs || 1000)));
  const session = makeSession(ip, community);

  const idx = Number(ifIndex);

  // OIDs
  const HC_IN  = "1.3.6.1.2.1.31.1.1.1.6";   // ifHCInOctets
  const HC_OUT = "1.3.6.1.2.1.31.1.1.1.10";  // ifHCOutOctets
  const C32_IN  = "1.3.6.1.2.1.2.2.1.10";    // ifInOctets
  const C32_OUT = "1.3.6.1.2.1.2.2.1.16";    // ifOutOctets

  const state = {
    id, ip, label: label || ip, ifIndex: idx, poll,
    session, last: null, timer: null,
    mode: "unknown" // "hc" | "c32"
  };

  function vbOk(vb){
    return vb && !snmp.isVarbindError(vb) && vb.value !== null && vb.value !== undefined;
  }
  function asU64(v){
    try{
      // net-snmp may give Buffer / string / number / bigint
      if (typeof v === "bigint") return v;
      if (Buffer.isBuffer(v)) return BigInt("0x" + v.toString("hex"));
      if (typeof v === "number") return BigInt(Math.max(0, Math.floor(v)));
      if (typeof v === "string") return BigInt(v.trim());
      return BigInt(String(v));
    } catch {
      return null;
    }
  }

  async function readCounters(){
    // try HC first unless we already decided c32
    if(state.mode !== "c32"){
      try{
        const vbs = await snmpGet(session, [`${HC_IN}.${idx}`, `${HC_OUT}.${idx}`]);
        const a=vbs && vbs[0], b=vbs && vbs[1];
        if(vbOk(a) && vbOk(b)){
          const ain=asU64(a.value), bout=asU64(b.value);
          if(ain !== null && bout !== null){
            state.mode = "hc";
            return { in: ain, out: bout, mode:"hc" };
          }
        }
      } catch {}
    }

    // fallback to 32-bit
    const vbs = await snmpGet(session, [`${C32_IN}.${idx}`, `${C32_OUT}.${idx}`]);
    const a=vbs && vbs[0], b=vbs && vbs[1];
    if(!vbOk(a) || !vbOk(b)) throw new Error("No valid counters returned");

    const ain=asU64(a.value), bout=asU64(b.value);
    if(ain === null || bout === null) throw new Error("Counter parse failed");
    state.mode = "c32";
    return { in: ain, out: bout, mode:"c32" };
  }

  state.timer = setInterval(async ()=>{
    const now = Date.now();
    try{
      const cur = await readCounters();

      if(state.last){
        const dt = (now - state.last.t) / 1000;
        if(dt > 0){
          // handle wrap for 32-bit
          let din = cur.in - state.last.in;
          let dout = cur.out - state.last.out;

          if(state.mode === "c32"){
            const MOD = 2n ** 32n;
            if(din < 0) din += MOD;
            if(dout < 0) dout += MOD;
          }

          const downMbps = Number((Number(din) * 8) / dt / 1_000_000);
          const upMbps   = Number((Number(dout) * 8) / dt / 1_000_000);

          io.emit("monitor:update",{
            id: state.id,
            ip: state.ip,
            label: state.label,
            ifIndex: state.ifIndex,
            ts: now,
            down_mbps: Math.max(0, Number(downMbps.toFixed(3))),
            up_mbps: Math.max(0, Number(upMbps.toFixed(3))),
            ok: true,
            mode: state.mode
          });
        }
      }

      state.last = { t: now, in: cur.in, out: cur.out };
    } catch(e){
      io.emit("monitor:update",{
        id: state.id,
        ip: state.ip,
        label: state.label,
        ifIndex: state.ifIndex,
        ts: now,
        ok:false,
        error: String(e.message || e),
        mode: state.mode
      });
    }
  }, poll);

  monitors.set(id, state);
  res.json({ ok:true, id, poll, mode: state.mode });
});
/* NEIGHBORS-API-START */
// Windows neighbor discovery (multi-range): list local IPv4 subnets + current ARP/neighbor table.
// No extra npm deps.
const { execFile: execFileNeighbors } = require("child_process");

function runPwshJson(psCommand, timeoutMs = 30000){
  return new Promise((resolve, reject) => {
    const args = ["-NoProfile","-ExecutionPolicy","Bypass","-Command", psCommand];
    execFileNeighbors("powershell.exe", args, { windowsHide:true, timeout: timeoutMs, maxBuffer: 25*1024*1024 }, (err, stdout, stderr) => {
      if(err){
        const msg = (stderr && stderr.trim()) ? stderr.trim() : err.message;
        return reject(new Error(msg));
      }
      const out = (stdout || "").trim();
      try { resolve(out ? JSON.parse(out) : []); }
      catch(e){ reject(new Error("Neighbors JSON parse failed: " + out.slice(0, 500))); }
    });
  });
}

async function getNeighborsWindows(){
  const subnets = await runPwshJson(`
$rows = Get-NetIPConfiguration | ForEach-Object {
  $ifIndex = $_.InterfaceIndex
  foreach($a in $_.IPv4Address){
    if(-not $a -or -not $a.IPAddress){ continue }
    $ip = $a.IPAddress
    if($ip -like "127.*" -or $ip -like "169.254.*"){ continue }

    $p = (Get-NetIPAddress -InterfaceIndex $ifIndex -AddressFamily IPv4 -IPAddress $ip -ErrorAction SilentlyContinue |
          Select-Object -First 1).PrefixLength
    if(-not $p -or $p -lt 8 -or $p -gt 30){ continue }

    function ToUInt32([string]$ipStr){
      $b = [System.Net.IPAddress]::Parse($ipStr).GetAddressBytes()
      [Array]::Reverse($b)
      [BitConverter]::ToUInt32($b,0)
    }
    function FromUInt32([UInt32]$u){
      $b = [BitConverter]::GetBytes($u)
      [Array]::Reverse($b)
      ([System.Net.IPAddress]::new($b)).ToString()
    }

    $uip = ToUInt32 $ip
    $mask = [UInt32]0
    for($i=0; $i -lt $p; $i++){ $mask = $mask -bor (1 -shl (31-$i)) }
    $net = $uip -band $mask
    $network = FromUInt32 $net

    [pscustomobject]@{
      ifIndex = $ifIndex
      ip = $ip
      prefix = $p
      network = $network
      cidr = "$network/$p"
    }
  }
} | Where-Object { $_ } | Sort-Object cidr -Unique
$rows | ConvertTo-Json -Depth 6 -Compress
`, 25000);

  const neighbors = await runPwshJson(`
$rows = Get-NetNeighbor -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_ -and $_.IPAddress -and ($_.IPAddress -notlike "127.*") -and ($_.IPAddress -notlike "169.254.*") } |
  Select-Object IPAddress, LinkLayerAddress, State, InterfaceIndex |
  ForEach-Object {
    [pscustomobject]@{
      ip = $_.IPAddress
      mac = $_.LinkLayerAddress
      state = $_.State.ToString()
      ifIndex = $_.InterfaceIndex
    }
  }
$rows | ConvertTo-Json -Depth 4 -Compress
`, 20000);

  const subsArr = Array.isArray(subnets) ? subnets : (subnets ? [subnets] : []);
  const nbArr   = Array.isArray(neighbors) ? neighbors : (neighbors ? [neighbors] : []);
  return { subnets: subsArr, neighbors: nbArr };
}
/* NEIGHBORS-DISCOVER-START */
// Optional discovery sweep to warm ARP like WinBox.
// Reads extra CIDRs from: C:\apps\tools-isp\neighbors-ranges.txt (one CIDR per line, # comments allowed)
const fsNeighbors = require("fs");

function readExtraCidrs(){
  const p = "C:\\apps\\tools-isp\\neighbors-ranges.txt";
  try{
    if(!fsNeighbors.existsSync(p)) return [];
    const raw = fsNeighbors.readFileSync(p, "utf8");
    return raw.split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith("#"))
      .map(s => s.replace(/\s+/g,""))
      .filter(Boolean);
  }catch{
    return [];
  }
}

function ipToInt(ip){
  const p = String(ip).split(".").map(n => parseInt(n,10));
  if(p.length!==4 || p.some(n=>Number.isNaN(n))) return null;
  return ((p[0]<<24)>>>0)+((p[1]<<16)>>>0)+((p[2]<<8)>>>0)+(p[3]>>>0);
}
function intToIp(u){
  return [(u>>>24)&255,(u>>>16)&255,(u>>>8)&255,u&255].join(".");
}

function ipsFromCidr(cidr, hardCap=4096){
  // Correct CIDR expansion with caps.
  const m = String(cidr).match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if(!m) return [];
  const baseIp = m[1];
  const pre = parseInt(m[2],10);
  const base = ipToInt(baseIp);
  if(base===null || !(pre>=0 && pre<=32)) return [];
  if(pre===32) return [baseIp];

  // mask (handle pre=0 safely)
  const mask = pre === 0 ? 0 : ((0xFFFFFFFF << (32-pre)) >>> 0);
  const net = (base & mask) >>> 0;
  const size = pre===32 ? 1 : (pre===0 ? 0x100000000 : (1 << (32-pre)) >>> 0);

  // enumerate fully for <= /24 (<=256 addrs) and for /25..../30 too
  const enumerateAll = (pre >= 24 && pre <= 30);

  let out = [];
  if(enumerateAll){
    const start = net + 1;               // skip network
    const end   = net + size - 2;        // skip broadcast
    for(let u=start; u<=end; u++){
      out.push(intToIp(u>>>0));
      if(out.length>=hardCap) break;
    }
    return out;
  }

  // For bigger nets (< /24): sample evenly, but always within same network
  const start = net + 1;
  const end   = net + size - 2;
  const span  = Math.max(1, (end - start + 1));
  const step  = Math.max(1, Math.floor(span / Math.min(hardCap, 2048)));

  for(let u=start; u<=end; u += step){
    out.push(intToIp(u>>>0));
    if(out.length>=hardCap) break;
  }
  return out;
}

function pingTouch(host, timeoutMs=250){
  return new Promise((resolve) => {
    try{
      // ping.exe warms ARP very effectively even when host doesn't reply.
      execFileNeighbors("ping.exe", ["-n","1","-w", String(timeoutMs), String(host)], { windowsHide:true }, () => resolve());
    }catch{
      resolve();
    }
  });
}
function tcpTouch(host, port, timeoutMs=180){
  return new Promise((resolve) => {
    const s = new netNeighbors.Socket();
    let done=false;
    const finish = () => { if(done) return; done=true; try{s.destroy();}catch{} resolve(); };
    s.setTimeout(timeoutMs);
    s.once("connect", finish);
    s.once("timeout", finish);
    s.once("error", finish);
    try{ s.connect(port, host); }catch{ finish(); }
  });
}

async function icmpPing(host, timeoutMs=350){
  return new Promise((resolve) => {
    const { exec } = require("child_process");
    // Windows ping: -n 1 (one echo), -w timeoutMs (ms)
    exec(`ping -n 1 -w ${timeoutMs} ${host}`, { windowsHide:true }, (err, stdout) => {
      if(err) return resolve(false);
      try{
        const s = String(stdout || "");
        resolve(s.includes("TTL=") || s.includes("ttl="));
      } catch {
        resolve(false);
      }
    });
  });
}

async function warmDiscover(cidrs){
  // ICMP discovery: returns IPs that respond to ping (works even if no TCP ports open)
  const uniq = Array.from(new Set((cidrs||[]).filter(Boolean)));

  let ips = [];
  for(const c of uniq) ips = ips.concat(ipsFromCidr(c));
  ips = Array.from(new Set(ips));

  const hits = [];
  const CONC = 120; // concurrency
  let i = 0;

  async function worker(){
    while(i < ips.length){
      const idx = i++;
      const ip = ips[idx];

      const alive = await icmpPing(ip, 350);
      if(alive){
        hits.push({ ip, ports: [] });
      }
    }
  }

  const workers = [];
  for(let k=0;k<Math.min(CONC, ips.length);k++) workers.push(worker());
  await Promise.all(workers);

  return hits;
}
/* NEIGHBORS-DISCOVER-END */
/* NEIGHBORS-API-END */

/* NEIGHBORS-ROUTE-START */
app.get("/api/neighbors", async (req, res) => {
  try {
      /* NEIGHBORS-ROUTE-DISCOVER-RESULTS-START */
let discovered = [];
/* NEIGHBORS-ROUTE-DISCOVER-RESULTS-END */
          // discover=1 warms ARP like WinBox (fast TCP sweep) for configured CIDRs + detected subnets
      if(String(req.query && req.query.discover) === "1"){
        try{
          const base = await getNeighborsWindows();
          const detectedCidrs = (base.subnets||[]).map(s => s && s.cidr).filter(Boolean);
          const extraCidrs = readExtraCidrs();
          const allCidrs = Array.from(new Set([].concat(detectedCidrs, extraCidrs)));
          discovered = (await warmDiscover(allCidrs)) || [];
        }catch(e){}
      }
      const data = await getNeighborsWindows();
    res.json({ ok: true, ...data, discovered });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
});

/* PING-SCAN-API-START */
// CIDR ICMP scan (returns IPs that reply to ping). Safe-capped by ipsFromCidr hardCap.
app.get("/api/ping-scan", async (req, res) => {
  try {
    const cidr = String(req.query.cidr || "").trim();
    if(!cidr) return res.status(400).json({ ok:false, error:"cidr is required, e.g. 88.88.88.0/24" });

    // optional tuning
    const timeoutMs = Math.max(80, Math.min(2000, parseInt(req.query.timeoutMs || "350", 10) || 350));
    const conc      = Math.max(1,  Math.min(300,  parseInt(req.query.conc || "120", 10) || 120));

    // Expand (ipsFromCidr already exists in file). hardCap keeps it safe.
    const ips = ipsFromCidr(cidr, 4096);
    if(!ips.length) return res.json({ ok:true, cidr, count:0, alive:[] });

    const alive = [];
    let i = 0;

    async function worker(){
      while(i < ips.length){
        const idx = i++;
        const ip = ips[idx];
        const ok = await icmpPing(ip, timeoutMs);
        if(ok) alive.push(ip);
      }
    }

    const workers = [];
    for(let k=0;k<Math.min(conc, ips.length);k++) workers.push(worker());
    await Promise.all(workers);

    alive.sort((a,b)=>{
      const pa=a.split(".").map(x=>parseInt(x,10));
      const pb=b.split(".").map(x=>parseInt(x,10));
      for(let j=0;j<4;j++){
        const da=isNaN(pa[j])?0:pa[j];
        const db=isNaN(pb[j])?0:pb[j];
        if(da!==db) return da-db;
      }
      return 0;
    });

    return res.json({ ok:true, cidr, count: ips.length, aliveCount: alive.length, alive });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e && e.message ? e.message : e) });
  }
});
/* PING-SCAN-API-END */
/* NEIGHBORS-ROUTE-END */


const PORT = process.env.PORT || 9090;
server.listen(PORT, "0.0.0.0", () => console.log("✅ tools-isp backend listening on", PORT));









// =========================
// Ping any IP/host (Windows-safe)
// GET /api/ping?ip=8.8.8.8

/**
 * Live ping over SSE
 * GET /api/ping-sse?ip=1.1.1.1
 * events: line/end
 */
app.get("/api/ping-sse", (req, res) => {
  try {
    const ip = String(req.query.ip || "").trim();
    if (!ip) return res.status(400).json({ ok:false, error:"Missing ip" });

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write("\n");

    const child = spawn("ping", ["-t", ip], { windowsHide: true });

    let closed = false;
    const send = (evt, obj) => {
      if (closed) return;
      res.write("event: " + evt + "\n");
      res.write("data: " + JSON.stringify(obj) + "\n\n");
    };

    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d.toString("utf8");
      const parts = buf.split(/\r?\n/);
      buf = parts.pop() ?? "";
      for (const line of parts) {
        const s = String(line);
        if (s.trim() !== "") send("line", { line: s });
      }
    });

    child.stderr.on("data", (d) => {
      const s = d.toString("utf8").trim();
      if (s) send("line", { line: "[err] " + s });
    });

    const cleanup = () => {
      if (closed) return;
      closed = true;
      try { child.kill(); } catch {}
      try { send("end", {}); } catch {}
      try { res.end(); } catch {}
    };

    child.on("close", cleanup);
    req.on("close", cleanup);
  } catch (e) {
    try { res.status(500).json({ ok:false, error:String(e) }); } catch {}
  }
});
app.get("/api/ping", (req, res) => {
  const ip = (req.query.ip || "").toString().trim();
  if(!ip) return res.status(400).json({ ok:false, error:"Missing ip" });

  // حماية بسيطة ضد injection (بدنا نسمح IP/hostname فقط)
  if(!ip.match(/^[a-zA-Z0-9\.\-:]+$/)) {
    return res.status(400).json({ ok:false, error:"Invalid ip" });
  }

  // ping على Windows: -n 1
  const args = ["-n","1","-w","1000", ip]; // 1 ping, timeout 1000ms
  execFile("ping", args, { windowsHide:true }, (err, stdout, stderr) => {
    const out = ((stdout||"") + (stderr||"")).trim();
    const m = out.match(/time[=<]\s*([0-9]+)\s*ms/i);
    const timeMs = m ? Number(m[1]) : null;
    const alive = !err && /TTL=/i.test(out);

    return res.json({ ok:true, ip, alive, timeMs, raw: out });
  });
});




/**
 * Live TCP ping over SSE (NO ping.exe)
 * GET /api/tcp-ping-sse?host=8.8.8.8&port=443&interval=1000&timeout=1200
 * events: line/end
 */
app.get("/api/tcp-ping-sse", (req, res) => {
  const host = String(req.query.host || req.query.ip || "").trim();
  const port = Math.max(1, Math.min(65535, parseInt(req.query.port || "443", 10)));
  const interval = Math.max(250, Math.min(10000, parseInt(req.query.interval || "1000", 10)));
  const timeout = Math.max(200, Math.min(10000, parseInt(req.query.timeout || "1200", 10)));

  if (!host) return res.status(400).json({ ok:false, error:"Missing host" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write("\n");

  let closed = false;
  const send = (evt, obj) => {
    if (closed) return;
    res.write("event: " + evt + "\n");
    res.write("data: " + JSON.stringify(obj) + "\n\n");
  };

  const tick = () => {
    if (closed) return;
    const t0 = Date.now();
    const sock = net.connect({ host, port });

    let done = false;
    const finish = (ok, err) => {
      if (done) return;
      done = true;
      try { sock.destroy(); } catch {}
      const ms = Date.now() - t0;
      if (ok) send("line", { line: `TCP ${host}:${port}  time=${ms}ms` });
      else send("line", { line: `TCP ${host}:${port}  timeout (${ms}ms)${err ? " err=" + err : ""}` });
    };

    sock.setTimeout(timeout);
    sock.on("connect", () => finish(true, ""));
    sock.on("timeout", () => finish(false, "timeout"));
    sock.on("error", (e) => finish(false, (e && e.code) ? e.code : String(e)));
  };

  const timer = setInterval(tick, interval);
  tick();

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try { clearInterval(timer); } catch {}
    try { send("end", {}); } catch {}
    try { res.end(); } catch {}
  };

  req.on("close", cleanup);
});

















