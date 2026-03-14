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

process.on("uncaughtException", (err) => console.error("?? UncaughtException:", err));
process.on("unhandledRejection", (err) => console.error("?? UnhandledRejection:", err));

const historyRouter = require("./routes/history");
const { appendUplinkHistory } = require("./lib/historyStore");
const app = express();

// =====================================
// CALLMEBOT_WHATSAPP_HELPER_START
// =====================================
const CALLMEBOT_PHONE = "96176126213";
const CALLMEBOT_APIKEY = "2110442";

async function sendWhatsAppAlert(message) {
  try {
    const url =
      "https://api.callmebot.com/whatsapp.php" +
      "?phone=" + encodeURIComponent(CALLMEBOT_PHONE) +
      "&text=" + encodeURIComponent(message) +
      "&apikey=" + encodeURIComponent(CALLMEBOT_APIKEY);

    const res = await fetch(url, { method: "GET" });
    const body = await res.text().catch(() => "");

    console.log("[WA] status=", res.status, "body=", body.slice(0, 200));
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("[WA] send failed:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}
// =====================================
// CALLMEBOT_WHATSAPP_HELPER_END
// =====================================

let __lastHistoryWriteAt = 0;
function toFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickFirstFinite(candidates) {
  for (const v of candidates) {
    const n = toFiniteNumber(v);
    if (n !== null) return n;
  }
  return null;
}

function recordUplinkHistorySample(payload) {
  try {
    if (!payload || typeof payload !== "object") return;

    const now = Date.now();

    // anti-spam: at most one write every 10s
    if (now - __lastHistoryWriteAt < 10000) return;

    const rxMbps = pickFirstFinite([
      payload.rxMbps,
      payload.downloadMbps,
      payload.rx_mbps,
      payload.download_mbps,
      payload.rx,
      payload.download
    ]);

    const txMbps = pickFirstFinite([
      payload.txMbps,
      payload.uploadMbps,
      payload.tx_mbps,
      payload.upload_mbps,
      payload.tx,
      payload.upload
    ]);

    if (rxMbps === null && txMbps === null) return;

    appendUplinkHistory({
      ts: new Date(now).toISOString(),
      rxMbps: rxMbps ?? 0,
      txMbps: txMbps ?? 0,
      source: "live-monitor"
    });

    __lastHistoryWriteAt = now;
  } catch (_) {
    // never break live flow because of history write
  }
}


app.use("/api/history", historyRouter);
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

/* LIVEPING-API-START */
function pingOnceWindows(ip){
  return new Promise((resolve) => {
    // Windows ping: -n 1 (one echo), -w 1000 (timeout ms)
    execFile("ping", ["-n","1","-w","1000", ip], { windowsHide: true }, (err, stdout, stderr) => {
      const out = String(stdout || "") + "\n" + String(stderr || "");
      // alive if we see TTL= or time=
      const alive = /TTL=|time[=<]\s*\d+/i.test(out);
      let timeMs = null;
      const m = out.match(/time[=<]\s*([0-9]+)\s*ms/i);
      if(m) timeMs = Number(m[1]);
      resolve({ ok:true, ip, alive, timeMs, raw: out });
    });
  });
}

// GET /api/ping/once?ip=1.2.3.4
app.get("/api/ping/once", async (req, res) => {
  const ip = String(req.query?.ip || "").trim();
  if(!ip) return res.status(400).json({ ok:false, error:"ip required" });

  try{
    const r = await pingOnceWindows(ip);
    // don't return raw by default (too big); keep for debugging only if needed
    return res.json({ ok:true, ip:r.ip, alive:r.alive, timeMs:r.timeMs });
  } catch(e){
    return res.status(502).json({ ok:false, error:String(e?.message || e) });
  }
});
/* LIVEPING-API-END */



/* ETH-API-START */
const fs = require("fs");
const path = require("path");
const ETH_CFG_PATH = path.join(__dirname, "ethTargets.json");

// In-memory rate cache: key = ip#ifIndex, value = { rx, tx, t }
const _ethRate = new Map();

function snmpGetRaw(ip, community, oid){
  return new Promise((resolve, reject) => {
    execFile("snmpget.exe", ["-v2c","-c", community, "-Oqv", ip, oid], { windowsHide:true }, (err, stdout, stderr) => {
      const out = String(stdout || "").trim();
      const errOut = String(stderr || "").trim();
      if(err || !out){
        return reject(new Error(errOut || "snmpget failed"));
      }
      // strip type prefixes like "Counter64: "
      resolve(out.replace(/^[A-Z\-]+:\s*/,"").trim());
    });
  });
}

function toNum(x){
  if(x == null) return null;
  const m = String(x).match(/-?\d+(\.\d+)?/);
  if(!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
/* SNAPSHOT-THROUGHPUT-HELPER-START */
async function measureIfThroughput(ip, community, ifIndex, ms=900){
  ms = Math.max(200, Math.min(5000, Number(ms)||900));
  const session = makeSession(ip, community);

  const OID_ifInOctets    = `1.3.6.1.2.1.2.2.1.10.${ifIndex}`;
  const OID_ifOutOctets   = `1.3.6.1.2.1.2.2.1.16.${ifIndex}`;
  const OID_ifHCInOctets  = `1.3.6.1.2.1.31.1.1.1.6.${ifIndex}`;
  const OID_ifHCOutOctets = `1.3.6.1.2.1.31.1.1.1.10.${ifIndex}`;

  const sleep = (n)=>new Promise(r=>setTimeout(r,n));
  const vbOk = (vb)=>vb && vb.oid && !snmp.isVarbindError(vb);

  const vbToBigInt = (vb)=>{
    if(!vbOk(vb)) return null;
    const v = vb.value;
    try{
      if(typeof v === "bigint") return v;
      if(typeof v === "number") return BigInt(Math.trunc(v));
      if(Buffer.isBuffer(v)){
        const hex = v.toString("hex") || "0";
        return BigInt("0x" + hex);
      }
      if(v && typeof v.toString === "function"){
        const s = v.toString();
        if(/^\d+$/.test(s)) return BigInt(s);
        const n = Number(s);
        if(Number.isFinite(n)) return BigInt(Math.trunc(n));
      }
      return null;
    } catch { return null; }
  };

  const read = async ()=>{
    const vbs = await snmpGet(session, [
      OID_ifHCInOctets, OID_ifHCOutOctets,
      OID_ifInOctets, OID_ifOutOctets
    ]);
    const byOid = {};
    for(const vb of (vbs||[])){ if(vb && vb.oid) byOid[vb.oid]=vb; }

    const hcIn  = vbToBigInt(byOid[OID_ifHCInOctets]);
    const hcOut = vbToBigInt(byOid[OID_ifHCOutOctets]);

    let used = "32";
    let inB  = vbToBigInt(byOid[OID_ifInOctets]);
    let outB = vbToBigInt(byOid[OID_ifOutOctets]);

    if(hcIn != null && hcOut != null){
      used = "hc";
      inB = hcIn; outB = hcOut;
    }
    return { used, inB, outB };
  };

  const deltaWrap = (newV, oldV, mod)=>{
    if(newV==null || oldV==null) return null;
    let d = newV - oldV;
    if(d < 0n) d = d + mod;
    return d;
  };

  try{
    const a = await read();
    const t0 = Date.now();
    await sleep(ms);
    const b = await read();
    const t1 = Date.now();
    const deltaMs = Math.max(1, t1 - t0);

    const mod = (a.used === "hc") ? (1n<<64n) : (1n<<32n);

    const dIn  = deltaWrap(b.inB,  a.inB,  mod);
    const dOut = deltaWrap(b.outB, a.outB, mod);
    if(dIn==null || dOut==null) return { ok:false, used:a.used, deltaMs };
    let rxMbps = (Number(dIn)  * 8 * 1000 / deltaMs) / 1_000_000;
    let txMbps = (Number(dOut) * 8 * 1000 / deltaMs) / 1_000_000;

    return { ok:true, used:a.used, deltaMs, rxMbps, txMbps };
  } catch(e){
    return { ok:false, error:String(e?.message||e) };
  } finally {
    try{ session.close(); }catch{}
  }
}
/* SNAPSHOT-THROUGHPUT-HELPER-END */

async function ethSnapshotOne(t){
  const name = t.name || t.id;
  const ip = String(t.ip || "").trim();
  const comm = String(t.community || "public").trim();
  const idx = Number(t.uplinkIfIndex || t.ifIndex || 0);

  if(!ip || !idx){
    return { id:t.id, name, ok:false, error:"CONFIG_MISSING", ip, ifIndex:idx };
  }

  const rxOid = `1.3.6.1.2.1.31.1.1.1.6.${idx}`;   // ifHCInOctets
  const txOid = `1.3.6.1.2.1.31.1.1.1.10.${idx}`;  // ifHCOutOctets
  const spOid = `1.3.6.1.2.1.31.1.1.1.15.${idx}`;  // ifHighSpeed (Mbps)
  const opOid = `1.3.6.1.2.1.2.2.1.8.${idx}`;       // ifOperStatus
  const adOid = `1.3.6.1.2.1.2.2.1.7.${idx}`;       // ifAdminStatus

  const key = `${ip}#${idx}`;

  try{
    const [rxS, txS, spS, opS, adS] = await Promise.all([
      snmpGetRaw(ip, comm, rxOid),
      snmpGetRaw(ip, comm, txOid),
      snmpGetRaw(ip, comm, spOid),
      snmpGetRaw(ip, comm, opOid),
      snmpGetRaw(ip, comm, adOid),
    ]);

    const rx = toNum(rxS);
    const tx = toNum(txS);
    const speedMb = toNum(spS);
const oper = String(opS).trim();
    const admin = String(adS).trim();

    // rate calc: Mbps from byte delta
    const now = Date.now();
    const prev = _ethRate.get(key);
    let rxMbps = null, txMbps = null;

    
    /* SNAPSHOT-THROUGHPUT-INJECT-V2 */
    // Faster path:
    // only sample on first pass when we have no previous counters yet
    if(!prev){
      try{
        const th = await measureIfThroughput(ip, comm, idx, 250);
        if(th && th.ok){
          rxMbps = Math.round(th.rxMbps * 100) / 100;
          txMbps = Math.round(th.txMbps * 100) / 100;
        }
      } catch {}
    }
    /* SNAPSHOT-THROUGHPUT-INJECT-V2-END */
if(prev && rx != null && tx != null){
      const dt = Math.max(0.25, (now - prev.t) / 1000); // seconds
      const dRx = Math.max(0, rx - prev.rx);
      const dTx = Math.max(0, tx - prev.tx);
      rxMbps = Math.round(((dRx * 8) / 1e6) / dt * 100) / 100;
      txMbps = Math.round(((dTx * 8) / 1e6) / dt * 100) / 100;
    }

    if(rx != null && tx != null){
      _ethRate.set(key, { rx, tx, t: now });
    }

    const status = (oper === "1" || /^up$/i.test(oper)) ? "up"
                : (oper === "2" || /^down$/i.test(oper)) ? "down"
                : "unk";

    const adminS = (admin === "1" || /^up$/i.test(admin)) ? "up"
                 : (admin === "2" || /^down$/i.test(admin)) ? "down"
                 : "unk";

    return {
      id: t.id,
      name,
      ip,
      ifIndex: idx,
      ifName: (t.ifName || t.uplinkIfName || ""),
      ok: true,
      status,
      admin: adminS,
      speedMb,
      rxMbps,
      txMbps,
      ts: now
    };
  } catch(e){
    return { id:t.id, name, ip, ifIndex:idx, ifName: (t.ifName || t.uplinkIfName || ""), ok:false, error:String(e?.message||e) };
  }
}

// GET /api/eth/snapshot  -> returns all 6

function appendSnapshotHistoryFromEthData(rows) {
  try {
    const UPLINK_IDS = new Set([
      "uplink_dragon_club",
      "uplink_c5c_jabal",
      "uplink_to_office",
      "uplink_pharmacy",
      "uplink_abou_taher",
      "uplink_fast_web",
      "uplink_daraj_arid",
      "uplink_rawda"
    ]);

    const list = Array.isArray(rows) ? rows : [];
    const uplinks = list.filter(x => x && x.ok && UPLINK_IDS.has(String(x.id || "")));

    if (!uplinks.length) return;

    const now = Date.now();
    if (now - __lastHistoryWriteAt < 10000) return;

    for (const item of uplinks) {
      appendUplinkHistory({
        ts: new Date(now).toISOString(),
        rxMbps: Math.round((Number(item.rxMbps) || 0) * 1000) / 1000,
        txMbps: Math.round((Number(item.txMbps) || 0) * 1000) / 1000,
        source: "eth-snapshot-uplink",
        uplink: item.id || null,
        ip: item.ip || null,
        name: item.name || null
      });
    }

    __lastHistoryWriteAt = now;
  } catch (_) {
    // never break snapshot API because of history write
  }
}
app.get("/api/eth/snapshot", async (req, res) => {
  try{
    const raw = fs.readFileSync(ETH_CFG_PATH, "utf8");
    const targets = JSON.parse(raw);

    const out = [];
    // sequential to avoid SNMP flood
    for(const t of targets){
      out.push(await ethSnapshotOne(t));
    }
    appendSnapshotHistoryFromEthData(out);
    res.json({ ok:true, data: out });
  } catch(e){
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
});
/* ETH-API-END */
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
async function handleInterfaces(req, res){
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

  }

app.post("/api/interfaces", handleInterfaces);

app.get("/api/interfaces", async (req, res) => {
  req.body = { ip: req.query.ip, community: req.query.community };
  return handleInterfaces(req, res);
});



/* ETH-TRAFFIC-API-START */
// GET /api/eth/traffic?ip=...&community=...&ifIndex=...
// Returns raw counters + status for a single interface index (with debug fields)
app.get("/api/eth/traffic", async (req, res) => {
  const ip = String(req.query.ip || "").trim();
  const community = String(req.query.community || "").trim();
  const ifIndex = parseInt(String(req.query.ifIndex || ""), 10);

  if (!ip || !community || !Number.isFinite(ifIndex)) {
    return res.status(400).json({ ok:false, error:"ip+community+ifIndex required" });
  }

  const session = makeSession(ip, community);

  const OID_ifInOctets    = `1.3.6.1.2.1.2.2.1.10.${ifIndex}`;
  const OID_ifOutOctets   = `1.3.6.1.2.1.2.2.1.16.${ifIndex}`;
  const OID_ifInErrors    = `1.3.6.1.2.1.2.2.1.14.${ifIndex}`;
  const OID_ifOutErrors   = `1.3.6.1.2.1.2.2.1.20.${ifIndex}`;
  const OID_ifOperStatus  = `1.3.6.1.2.1.2.2.1.8.${ifIndex}`;
  const OID_ifAdminStatus = `1.3.6.1.2.1.2.2.1.7.${ifIndex}`;
  const OID_ifSpeed       = `1.3.6.1.2.1.2.2.1.5.${ifIndex}`;

  const OID_ifHCInOctets  = `1.3.6.1.2.1.31.1.1.1.6.${ifIndex}`;
  const OID_ifHCOutOctets = `1.3.6.1.2.1.31.1.1.1.10.${ifIndex}`;

  try {
    const oids = [
      OID_ifHCInOctets, OID_ifHCOutOctets,
      OID_ifInOctets, OID_ifOutOctets,
      OID_ifInErrors, OID_ifOutErrors,
      OID_ifOperStatus, OID_ifAdminStatus,
      OID_ifSpeed
    ];

    const vbs = await snmpGet(session, oids);

    const byOid = {};
    for(const vb of (vbs||[])){
      if(vb && vb.oid) byOid[vb.oid] = vb;
    }

    const vbInfo = (oid) => {
      const vb = byOid[oid];
      if(!vb) return { oid, ok:false, err:"missing-varbind" };
      if(snmp.isVarbindError(vb)){
        return { oid, ok:false, err:String(snmp.varbindError(vb) || "varbind-error") };
      }
      const v = vb.value;
      if(typeof v === "bigint") return { oid, ok:true, type:"bigint", value:Number(v) };
      if(typeof v === "number") return { oid, ok:true, type:"number", value:v };
      if(Buffer.isBuffer(v)) return { oid, ok:true, type:"buffer", value:v.toString("hex") };
      if(v && typeof v.toString === "function"){
        const s = v.toString();
        const n = Number(s);
        return { oid, ok:true, type: typeof v, value: (Number.isFinite(n) ? n : s) };
      }
      return { oid, ok:true, type: typeof v, value: v };
    };

    const toNum = (oid) => {
      const vb = byOid[oid];
      if(!vb || snmp.isVarbindError(vb)) return null;
      const v = vb.value;
      if(typeof v === "bigint") return Number(v);
if(Buffer.isBuffer(v)){
  try{
    // SNMP libs sometimes return Counter64 as Buffer (big-endian)
    const hex = v.toString("hex") || "0";
    const bi = BigInt("0x" + hex);
    return Number(bi);
  } catch {
    return null;
  }
}
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const hcIn  = toNum(OID_ifHCInOctets);
    const hcOut = toNum(OID_ifHCOutOctets);
    const in32  = toNum(OID_ifInOctets);
    const out32 = toNum(OID_ifOutOctets);

    const inOctets  = (hcIn  != null ? hcIn  : in32);
    const outOctets = (hcOut != null ? hcOut : out32);

    return res.json({
      ok:true,
      ip,
      ifIndex,
      ts: Date.now(),
      inOctets,
      outOctets,
      inOctets32: in32,
      outOctets32: out32,
      hcInOctets: hcIn,
      hcOutOctets: hcOut,
      inErrors: toNum(OID_ifInErrors),
      outErrors: toNum(OID_ifOutErrors),
      operStatus: toNum(OID_ifOperStatus),
      adminStatus: toNum(OID_ifAdminStatus),
      speed: toNum(OID_ifSpeed),
      debug: {
        ifHCInOctets: vbInfo(OID_ifHCInOctets),
        ifHCOutOctets: vbInfo(OID_ifHCOutOctets),
        ifInOctets: vbInfo(OID_ifInOctets),
        ifOutOctets: vbInfo(OID_ifOutOctets)
      }
    });

  } catch (e) {
    return res.status(502).json({ ok:false, error:String(e?.message||e) });
  } finally {
    try { session.close(); } catch {}
  }
});
/* ETH-TRAFFIC-API-END */


/* ETH-THROUGHPUT-API-START */
// GET /api/eth/throughput?ip=...&community=...&ifIndex=...&ms=1000
// Measures throughput by sampling counters twice with delay.
// Returns { rxMbps, txMbps, used:"hc"|"32", deltaMs, counters... }
app.get("/api/eth/throughput", async (req, res) => {
  const ip = String(req.query.ip || "").trim();
  const community = String(req.query.community || "").trim();
  const ifIndex = parseInt(String(req.query.ifIndex || ""), 10);

  let ms = parseInt(String(req.query.ms || "1000"), 10);
  if(!Number.isFinite(ms)) ms = 1000;
  ms = Math.max(200, Math.min(5000, ms));

  if (!ip || !community || !Number.isFinite(ifIndex)) {
    return res.status(400).json({ ok:false, error:"ip+community+ifIndex required" });
  }

  const session = makeSession(ip, community);

  const OID_ifInOctets    = `1.3.6.1.2.1.2.2.1.10.${ifIndex}`;
  const OID_ifOutOctets   = `1.3.6.1.2.1.2.2.1.16.${ifIndex}`;
  const OID_ifHCInOctets  = `1.3.6.1.2.1.31.1.1.1.6.${ifIndex}`;
  const OID_ifHCOutOctets = `1.3.6.1.2.1.31.1.1.1.10.${ifIndex}`;
  const OID_ifOperStatus  = `1.3.6.1.2.1.2.2.1.8.${ifIndex}`;
  const OID_ifAdminStatus = `1.3.6.1.2.1.2.2.1.7.${ifIndex}`;
  const OID_ifSpeed       = `1.3.6.1.2.1.2.2.1.5.${ifIndex}`;

  const sleep = (n) => new Promise(r => setTimeout(r, n));

  const vbOk = (vb) => vb && vb.oid && !snmp.isVarbindError(vb);

  const vbToBigInt = (vb) => {
    if(!vbOk(vb)) return null;
    const v = vb.value;
    try{
      if(typeof v === "bigint") return v;
      if(typeof v === "number") return BigInt(Math.trunc(v));
      if(Buffer.isBuffer(v)){
        const hex = v.toString("hex") || "0";
        return BigInt("0x" + hex);
      }
      if(v && typeof v.toString === "function"){
        const s = v.toString();
        // If it's numeric string, BigInt can parse if integer
        if(/^\d+$/.test(s)) return BigInt(s);
        const n = Number(s);
        if(Number.isFinite(n)) return BigInt(Math.trunc(n));
      }
      return null;
    } catch {
      return null;
    }
  };

  const vbToNum = (vb) => {
    if(!vbOk(vb)) return null;
    const v = vb.value;
    if(typeof v === "bigint") return Number(v);
    if(typeof v === "number") return Number.isFinite(v) ? v : null;
    if(Buffer.isBuffer(v)){
      try{
        const hex = v.toString("hex") || "0";
        const bi = BigInt("0x" + hex);
        return Number(bi);
      } catch { return null; }
    }
    if(v && typeof v.toString === "function"){
      const n = Number(v.toString());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const readCounters = async () => {
    const oids = [
      OID_ifHCInOctets, OID_ifHCOutOctets,
      OID_ifInOctets, OID_ifOutOctets,
      OID_ifOperStatus, OID_ifAdminStatus, OID_ifSpeed
    ];

    const vbs = await snmpGet(session, oids);
    const byOid = {};
    for(const vb of (vbs||[])){
      if(vb && vb.oid) byOid[vb.oid] = vb;
    }

    const hcIn  = vbToBigInt(byOid[OID_ifHCInOctets]);
    const hcOut = vbToBigInt(byOid[OID_ifHCOutOctets]);

    let used = "32";
    let inB  = vbToBigInt(byOid[OID_ifInOctets]);
    let outB = vbToBigInt(byOid[OID_ifOutOctets]);

    if(hcIn != null && hcOut != null){
      used = "hc";
      inB  = hcIn;
      outB = hcOut;
    }

    return {
      used,
      inB, outB,
      in32: vbToBigInt(byOid[OID_ifInOctets]),
      out32: vbToBigInt(byOid[OID_ifOutOctets]),
      hcIn, hcOut,
      operStatus: vbToNum(byOid[OID_ifOperStatus]),
      adminStatus: vbToNum(byOid[OID_ifAdminStatus]),
      speed: vbToNum(byOid[OID_ifSpeed])
    };
  };

  const deltaWithWrap = (newV, oldV, mod) => {
    if(newV == null || oldV == null) return null;
    let d = newV - oldV;
    if(d < 0n) d = d + mod;
    return d;
  };

  try {
    const a = await readCounters();
    const t0 = Date.now();
    await sleep(ms);
    const b = await readCounters();
    const t1 = Date.now();
    const deltaMs = Math.max(1, (t1 - t0));

    const mod = (a.used === "hc") ? (1n << 64n) : (1n << 32n);

    const dIn  = deltaWithWrap(b.inB,  a.inB,  mod);
    const dOut = deltaWithWrap(b.outB, a.outB, mod);

    if(dIn == null || dOut == null){
      return res.status(502).json({
        ok:false,
        error:"Could not read octet counters (SNMP blocked or missing OIDs).",
        used: a.used,
        a, b
      });
    }

    // Throughput: bytes -> bits, per second
    // Use Number safely: deltas over 0.2-5s are usually small enough to be safe.
    let rxMbps = (Number(dIn)  * 8 * 1000 / deltaMs) / 1_000_000;
    let txMbps = (Number(dOut) * 8 * 1000 / deltaMs) / 1_000_000;

    return res.json({
      ok:true,
      ip,
      ifIndex,
      used: a.used,
      deltaMs,
      rxMbps,
      txMbps,
      operStatus: b.operStatus ?? a.operStatus ?? null,
      adminStatus: b.adminStatus ?? a.adminStatus ?? null,
      speed: b.speed ?? a.speed ?? null,
      // Counters (string) to avoid precision issues when large:
      counters: {
        aIn:  a.inB  != null ? a.inB.toString()  : null,
        aOut: a.outB != null ? a.outB.toString() : null,
        bIn:  b.inB  != null ? b.inB.toString()  : null,
        bOut: b.outB != null ? b.outB.toString() : null,
        dIn:  dIn.toString(),
        dOut: dOut.toString(),
        aIn32:  a.in32  != null ? a.in32.toString()  : null,
        aOut32: a.out32 != null ? a.out32.toString() : null,
        bIn32:  b.in32  != null ? b.in32.toString()  : null,
        bOut32: b.out32 != null ? b.out32.toString() : null,
        aHcIn:  a.hcIn  != null ? a.hcIn.toString()  : null,
        aHcOut: a.hcOut != null ? a.hcOut.toString() : null,
        bHcIn:  b.hcIn  != null ? b.hcIn.toString()  : null,
        bHcOut: b.hcOut != null ? b.hcOut.toString() : null
      }
    });

  } catch (e) {
    return res.status(502).json({ ok:false, error:String(e?.message||e) });
  } finally {
    try { session.close(); } catch {}
  }
});
/* ETH-THROUGHPUT-API-END */
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

        recordUplinkHistorySample({
          ts: now,
          down_mbps: Math.max(0, Number(downMbps.toFixed(3))),
          up_mbps: Math.max(0, Number(upMbps.toFixed(3))),
          id: state.id,
          ip: state.ip,
          label: state.label,
          ifIndex: state.ifIndex,
          ok: true
        });

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
/* ===== ALIASES for EthernetTrafficPage (GET -> POST body) ===== */
app.post("/api/interfaces", (req,res)=> handleInterfaces(req,res));
app.get("/api/et/interfaces", (req,res)=>{
  req.body = { ip: req.query.ip, community: req.query.community };
  return handleInterfaces(req,res);
});
app.get("/api/eth/interfaces", (req,res)=>{
  req.body = { ip: req.query.ip, community: req.query.community };
  return handleInterfaces(req,res);
});
/* ===== ALIASES END ===== */
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

          recordUplinkHistorySample({
            ts: now,
            down_mbps: Math.max(0, Number(downMbps.toFixed(3))),
            up_mbps: Math.max(0, Number(upMbps.toFixed(3))),
            id: state.id,
            ip: state.ip,
            label: state.label,
            ifIndex: state.ifIndex,
            ok: true,
            mode: state.mode
          });

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
    execFileNeighbors("powershell.exe", { windowsHide:true }, args, { windowsHide:true, timeout: timeoutMs, maxBuffer: 25*1024*1024 }, (err, stdout, stderr) => {
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
server.listen(PORT, "0.0.0.0", () => console.log("? tools-isp backend listening on", PORT));









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

  // ????? ????? ?? injection (???? ???? IP/hostname ???)
  if(!ip.match(/^[a-zA-Z0-9\.\-:]+$/)) {
    return res.status(400).json({ ok:false, error:"Invalid ip" });
  }

  // ping ??? Windows: -n 1
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










































/* ===== COMBINED TRAFFIC API ===== */

const _combinedTrafficCache = new Map();

function ctToBig(v){
  try{
    if (v === null || v === undefined) return null;

    if (typeof v === "bigint") return v;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return null;
      return BigInt(Math.trunc(v));
    }

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;
      if (/^\d+$/.test(s)) return BigInt(s);
      return null;
    }

    if (Buffer.isBuffer(v)) {
      let n = 0n;
      for (const b of v.values()) {
        n = (n << 8n) + BigInt(b);
      }
      return n;
    }

    if (typeof v === "object" && v && typeof v.toString === "function") {
      const s = String(v).trim();
      if (/^\d+$/.test(s)) return BigInt(s);
    }

    return null;
  } catch {
    return null;
  }
}

function ctRound2(n){
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0;
}

app.get("/api/combined-traffic/live", async (req, res) => {
  const targets = [
    { key: "sw1", ip: "10.88.88.254", community: "public", ifIndex: 49162 },
    { key: "sw2", ip: "88.88.88.254", community: "public", ifIndex: 49179 }
  ];

  async function readCounters(t){
    const session = makeSession(t.ip, t.community);

    const OID_IN  = `1.3.6.1.2.1.31.1.1.1.6.${t.ifIndex}`;
    const OID_OUT = `1.3.6.1.2.1.31.1.1.1.10.${t.ifIndex}`;

    try{
      const vbs = await snmpGet(session, [OID_IN, OID_OUT]);

      const inV  = vbs?.[0] && !snmp.isVarbindError(vbs[0]) ? vbs[0].value : null;
      const outV = vbs?.[1] && !snmp.isVarbindError(vbs[1]) ? vbs[1].value : null;

      return {
        ok: true,
        inOctets: ctToBig(inV),
        outOctets: ctToBig(outV)
      };
    } catch (e) {
      return {
        ok: false,
        error: String(e?.message || e || "SNMP read failed"),
        inOctets: null,
        outOctets: null
      };
    } finally {
      try { session.close(); } catch {}
    }
  }

  try{
    const now = Date.now();
    const parts = [];

    for (const t of targets) {
      const cur = await readCounters(t);
      const prev = _combinedTrafficCache.get(t.key);

      let rxMbps = 0;
      let txMbps = 0;

      if (
        cur.ok &&
        prev &&
        cur.inOctets !== null &&
        cur.outOctets !== null &&
        prev.inOctets !== null &&
        prev.outOctets !== null
      ) {
        const dtMs = Math.max(250, now - prev.t);
        const dIn  = cur.inOctets  >= prev.inOctets  ? (cur.inOctets  - prev.inOctets)  : 0n;
        const dOut = cur.outOctets >= prev.outOctets ? (cur.outOctets - prev.outOctets) : 0n;

        rxMbps = Number(dIn)  * 8 / dtMs / 1000;
        txMbps = Number(dOut) * 8 / dtMs / 1000;

        if (!Number.isFinite(rxMbps)) rxMbps = 0;
        if (!Number.isFinite(txMbps)) txMbps = 0;
      }

      if (cur.ok) {
        _combinedTrafficCache.set(t.key, {
          t: now,
          inOctets: cur.inOctets,
          outOctets: cur.outOctets
        });
      }

      parts.push({
        key: t.key,
        ip: t.ip,
        ifIndex: t.ifIndex,
        ok: cur.ok,
        rxMbps: ctRound2(rxMbps),
        txMbps: ctRound2(txMbps),
        error: cur.ok ? null : cur.error
      });
    }

    const totalRx = parts.reduce((s, p) => s + (Number.isFinite(p.rxMbps) ? p.rxMbps : 0), 0);
    const totalTx = parts.reduce((s, p) => s + (Number.isFinite(p.txMbps) ? p.txMbps : 0), 0);

    return res.json({
      ok: true,
      rxMbps: ctRound2(totalRx),
      txMbps: ctRound2(totalTx),
      parts,
      ts: now
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e || "combined traffic failed")
    });
  }
});

/* ===== END COMBINED TRAFFIC ===== */




/* ===== COMBINED TRAFFIC HISTORY ENGINE ===== */
const CT_HISTORY_DIR  = path.join(__dirname, "..", "data");
const CT_HISTORY_FILE = path.join(CT_HISTORY_DIR, "combined-traffic-history.json");
const CT_HISTORY_MAX  = 30 * 24 * 60 * 6 + 1000; // 30 days @ 10s + buffer

function ctEnsureDir(){
  try { fs.mkdirSync(CT_HISTORY_DIR, { recursive: true }); } catch {}
}

function ctReadHistoryFile(){
  try{
    ctEnsureDir();
    if(!fs.existsSync(CT_HISTORY_FILE)) return [];
    const raw = fs.readFileSync(CT_HISTORY_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function ctWriteHistoryFile(arr){
  try{
    ctEnsureDir();
    fs.writeFileSync(CT_HISTORY_FILE, JSON.stringify(arr), "utf8");
  } catch {}
}

function ctAddHistoryPoint(point){
  const arr = ctReadHistoryFile();
  arr.push(point);

  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const kept = arr.filter(x => x && Number.isFinite(Number(x.ts)) && Number(x.ts) >= cutoff);

  while(kept.length > CT_HISTORY_MAX){
    kept.shift();
  }

  ctWriteHistoryFile(kept);
}

function ctBucketMsForRange(range){
  switch(String(range || "").trim()){
    case "5m":  return 10 * 1000;
    case "30m": return 30 * 1000;
    case "1h":  return 60 * 1000;
    case "1d":  return 10 * 60 * 1000;
    case "30d": return 6 * 60 * 60 * 1000;
    default:    return 10 * 1000;
  }
}

function ctRangeWindowMs(range){
  switch(String(range || "").trim()){
    case "5m":  return 5  * 60 * 1000;
    case "30m": return 30 * 60 * 1000;
    case "1h":  return 60 * 60 * 1000;
    case "1d":  return 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    default:    return 5 * 60 * 1000;
  }
}

function ctAggregate(points, range){
  const bucketMs = ctBucketMsForRange(range);
  const now = Date.now();
  const cutoff = now - ctRangeWindowMs(range);

  const src = (Array.isArray(points) ? points : [])
    .filter(p => p && Number.isFinite(Number(p.ts)) && Number(p.ts) >= cutoff)
    .sort((a,b) => Number(a.ts) - Number(b.ts));

  const buckets = new Map();

  for(const p of src){
    const ts = Number(p.ts);
    const key = Math.floor(ts / bucketMs) * bucketMs;

    if(!buckets.has(key)){
      buckets.set(key, { ts: key, rxSum: 0, txSum: 0, totalSum: 0, count: 0 });
    }

    const b = buckets.get(key);
    const rx = Number.isFinite(Number(p.rxMbps)) ? Number(p.rxMbps) : 0;
    const tx = Number.isFinite(Number(p.txMbps)) ? Number(p.txMbps) : 0;
    const total = Number.isFinite(Number(p.totalMbps)) ? Number(p.totalMbps) : (rx + tx);

    b.rxSum += rx;
    b.txSum += tx;
    b.totalSum += total;
    b.count += 1;
  }

  return Array.from(buckets.values())
    .sort((a,b) => a.ts - b.ts)
    .map(b => ({
      ts: b.ts,
      rxMbps: Math.round((b.rxSum / Math.max(1, b.count)) * 100) / 100,
      txMbps: Math.round((b.txSum / Math.max(1, b.count)) * 100) / 100,
      totalMbps: Math.round((b.totalSum / Math.max(1, b.count)) * 100) / 100
    }));
}

let _combinedRecorderStarted = false;
function startCombinedTrafficRecorder(){
  if(_combinedRecorderStarted) return;
  _combinedRecorderStarted = true;

  ctEnsureDir();

  setInterval(async () => {
    try{
      const targets = [
        { key: "sw1", ip: "10.88.88.254", community: "public", ifIndex: 49162 },
        { key: "sw2", ip: "88.88.88.254", community: "public", ifIndex: 49179 }
      ];

      const now = Date.now();
      const parts = [];

      async function readCounters(t){
        const session = makeSession(t.ip, t.community);

        const OID_IN  = `1.3.6.1.2.1.31.1.1.1.6.${t.ifIndex}`;
        const OID_OUT = `1.3.6.1.2.1.31.1.1.1.10.${t.ifIndex}`;

        try{
          const vbs = await snmpGet(session, [OID_IN, OID_OUT]);

          const inV  = vbs?.[0] && !snmp.isVarbindError(vbs[0]) ? vbs[0].value : null;
          const outV = vbs?.[1] && !snmp.isVarbindError(vbs[1]) ? vbs[1].value : null;

          return {
            ok: true,
            inOctets: ctToBig(inV),
            outOctets: ctToBig(outV)
          };
        } catch {
          return { ok:false, inOctets:null, outOctets:null };
        } finally {
          try { session.close(); } catch {}
        }
      }

      for (const t of targets) {
        const cur = await readCounters(t);
        const prev = _combinedTrafficCache.get(t.key);

        let rxMbps = 0;
        let txMbps = 0;

        if (
          cur.ok &&
          prev &&
          cur.inOctets !== null &&
          cur.outOctets !== null &&
          prev.inOctets !== null &&
          prev.outOctets !== null
        ) {
          const dtMs = Math.max(250, now - prev.t);
          const dIn  = cur.inOctets  >= prev.inOctets  ? (cur.inOctets  - prev.inOctets)  : 0n;
          const dOut = cur.outOctets >= prev.outOctets ? (cur.outOctets - prev.outOctets) : 0n;

          rxMbps = Number(dIn)  * 8 / dtMs / 1000;
          txMbps = Number(dOut) * 8 / dtMs / 1000;

          if (!Number.isFinite(rxMbps)) rxMbps = 0;
          if (!Number.isFinite(txMbps)) txMbps = 0;
        }

        if (cur.ok) {
          _combinedTrafficCache.set(t.key, {
            t: now,
            inOctets: cur.inOctets,
            outOctets: cur.outOctets
          });
        }

        parts.push({
          key: t.key,
          rxMbps: ctRound2(rxMbps),
          txMbps: ctRound2(txMbps)
        });
      }

      const totalRx = parts.reduce((s, p) => s + (Number.isFinite(p.rxMbps) ? p.rxMbps : 0), 0);
      const totalTx = parts.reduce((s, p) => s + (Number.isFinite(p.txMbps) ? p.txMbps : 0), 0);

      ctAddHistoryPoint({
        ts: now,
        rxMbps: ctRound2(totalRx),
        txMbps: ctRound2(totalTx),
        totalMbps: ctRound2(totalRx + totalTx)
      });
    } catch {}
  }, 10000);
}

app.get("/api/combined-traffic/history", async (req, res) => {
  try{
    const range = String(req.query.range || "5m").trim();
    const raw = ctReadHistoryFile();
    const data = ctAggregate(raw, range);
    return res.json({ ok:true, range, data });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e?.message || e || "history failed") });
  }
});

startCombinedTrafficRecorder();
/* ===== END COMBINED TRAFFIC HISTORY ENGINE ===== */




/* ===== AVIAT WTM4200 LIVE API ===== */
const _aviatWtm4200Cache = new Map();

app.get("/api/aviatwtm4200/live", async (req, res) => {
  const targets = [
    { key: "swA", name: "Switch A", ip: "10.88.88.254", community: "public", ifIndex: 49162 },
    { key: "swB", name: "Switch B", ip: "88.88.88.254", community: "public", ifIndex: 49179 }
  ];

  async function readCounters(t){
    const session = makeSession(t.ip, t.community);

    const OID_IN  = `1.3.6.1.2.1.31.1.1.1.6.${t.ifIndex}`;
    const OID_OUT = `1.3.6.1.2.1.31.1.1.1.10.${t.ifIndex}`;

    try{
      const vbs = await snmpGet(session, [OID_IN, OID_OUT]);

      const inV  = vbs?.[0] && !snmp.isVarbindError(vbs[0]) ? vbs[0].value : null;
      const outV = vbs?.[1] && !snmp.isVarbindError(vbs[1]) ? vbs[1].value : null;

      return {
        ok: true,
        inOctets: ctToBig(inV),
        outOctets: ctToBig(outV)
      };
    } catch (e) {
      return {
        ok: false,
        error: String(e?.message || e || "SNMP read failed"),
        inOctets: null,
        outOctets: null
      };
    } finally {
      try { session.close(); } catch {}
    }
  }

  try{
    const now = Date.now();
    const parts = [];

    for (const t of targets) {
      const cur = await readCounters(t);
      const prev = _aviatWtm4200Cache.get(t.key);

      let rxMbps = 0;
      let txMbps = 0;

      if (
        cur.ok &&
        prev &&
        cur.inOctets !== null &&
        cur.outOctets !== null &&
        prev.inOctets !== null &&
        prev.outOctets !== null
      ) {
        const dtMs = Math.max(250, now - prev.t);
        const dIn  = cur.inOctets  >= prev.inOctets  ? (cur.inOctets  - prev.inOctets)  : 0n;
        const dOut = cur.outOctets >= prev.outOctets ? (cur.outOctets - prev.outOctets) : 0n;

        rxMbps = Number(dIn)  * 8 / dtMs / 1000;
        txMbps = Number(dOut) * 8 / dtMs / 1000;

        if (!Number.isFinite(rxMbps)) rxMbps = 0;
        if (!Number.isFinite(txMbps)) txMbps = 0;
      }

      if (cur.ok) {
        _aviatWtm4200Cache.set(t.key, {
          t: now,
          inOctets: cur.inOctets,
          outOctets: cur.outOctets
        });
      }

      parts.push({
        key: t.key,
        name: t.name,
        ip: t.ip,
        ifIndex: t.ifIndex,
        ok: cur.ok,
        rxMbps: ctRound2(rxMbps),
        txMbps: ctRound2(txMbps),
        totalMbps: ctRound2(rxMbps + txMbps),
        error: cur.ok ? null : cur.error
      });
    }

    const partA = parts.find(p => p.key === "swA") || { rxMbps:0, txMbps:0, totalMbps:0 };
    const partB = parts.find(p => p.key === "swB") || { rxMbps:0, txMbps:0, totalMbps:0 };

    const combinedRx = ctRound2((partA.rxMbps || 0) + (partB.rxMbps || 0));
    const combinedTx = ctRound2((partA.txMbps || 0) + (partB.txMbps || 0));
    const combinedTotal = ctRound2(combinedRx + combinedTx);

    return res.json({
      ok: true,
      ts: now,
      combined: {
        rxMbps: combinedRx,
        txMbps: combinedTx,
        totalMbps: combinedTotal
      },
      switchA: partA,
      switchB: partB
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e || "aviat live failed")
    });
  }
});

/* ===== END AVIAT WTM4200 LIVE API ===== */


// =====================================
// CALLMEBOT_WHATSAPP_TEST_ROUTE_START
// =====================================
app.get("/api/test/whatsapp-alert", async (req, res) => {
  const msg =
    req.query.msg ||
    ("?? tools-isp test alert`nTime: " + new Date().toLocaleString());

  const out = await sendWhatsAppAlert(String(msg));
  res.json(out);
});
// =====================================
// CALLMEBOT_WHATSAPP_TEST_ROUTE_END
// =====================================


