require("dotenv").config();
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

const PORT = process.env.PORT || 9090;
server.listen(PORT, "0.0.0.0", () => console.log("✅ tools-isp backend listening on", PORT));









// =========================
// Ping any IP/host (Windows-safe)
// GET /api/ping?ip=8.8.8.8
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




// =========================
// SSE Ping stream (for frontend EventSource)
// GET /api/ping/stream?ip=8.8.8.8
// =========================
// SSE sanity test (no ping) - should emit data every 1s
app.get("/api/sse-test", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();

  
  res.write(": ping-stream-start\\n\\n");
// immediate output so clients see something right away
  res.write(": sse-test-start\\n\\n");

  let n = 0;
  const t = setInterval(() => {
    n++;
    res.write("data: " + JSON.stringify({ ok:true, n, ts: Date.now() }) + "\\n\\n");
  }, 1000);

  req.on("close", () => {
    clearInterval(t);
    try { res.end(); } catch {}
  });
});




// =========================
// SSE Ping stream (stable)
// GET /api/ping/stream?ip=8.8.8.8
app.get("/api/ping/stream", (req, res) => {
  const ip = (req.query.ip || "").toString().trim();
  if (!ip) return res.status(400).end("Missing ip");
  if (!ip.match(/^[a-zA-Z0-9.\-:]+$/)) return res.status(400).end("Invalid ip");

  // IMPORTANT: write headers ONCE (no setHeader after this)
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  res.write(": ping-stream-start\\n\\n");

  let closed = false;
  req.on("close", () => { closed = true; });

  const send = (obj) => {
    if (closed) return;
    try {
      res.write("data: " + JSON.stringify(obj) + "\\n\\n");
    } catch (e) {
      closed = true;
      try { res.end(); } catch {}
    }
  };

  const oncePing = () => {
    const args = ["-n", "1", "-w", "1000", ip];
    execFile("ping", args, { windowsHide: true }, (err, stdout, stderr) => {
      const out = ((stdout || "") + (stderr || "")).trim();
      const m = out.match(/time[=<]\\s*([0-9]+)\\s*ms/i);
      const timeMs = m ? Number(m[1]) : null;
      const alive = !err && /TTL=/i.test(out);
      send({ ok: true, ip, alive, timeMs, raw: out });
    });
  };

  // send immediately + every 1s
  oncePing();
  const timer = setInterval(() => {
    if (closed) { clearInterval(timer); return; }
    oncePing();
  }, 1000);

  // keep-alive comment every 15s
  const ka = setInterval(() => {
    if (closed) { clearInterval(ka); return; }
    try { res.write(": keep-alive\\n\\n"); } catch {}
  }, 15000);

  req.on("close", () => {
    clearInterval(timer);
    clearInterval(ka);
    try { res.end(); } catch {}
  });
});


