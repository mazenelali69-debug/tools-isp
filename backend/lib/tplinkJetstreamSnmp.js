const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const TARGETS = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "data", "tplink-jetstream-targets.json"),
    "utf8"
  ).replace(/^\uFEFF/, "")
);

const COMMUNITY = process.env.TPLINK_SNMP_COMMUNITY || "public";
const SNMP_TIMEOUT_MS = Number(process.env.TPLINK_SNMP_TIMEOUT_MS || 8000);
const SAMPLE_DELAY_MS = Number(process.env.TPLINK_SNMP_SAMPLE_DELAY_MS || 2000);
const SNMP_BIN = "C:\\usr\\bin\\snmpwalk.exe";

const OIDS = {
  sysUpTime: "1.3.6.1.2.1.1.3.0",
  ifDescr: "1.3.6.1.2.1.2.2.1.2",
  ifAlias: "1.3.6.1.2.1.31.1.1.1.18",
  ifOperStatus: "1.3.6.1.2.1.2.2.1.8",
  ifHighSpeed: "1.3.6.1.2.1.31.1.1.1.15",
  ifSpeed: "1.3.6.1.2.1.2.2.1.5",
  ifHCInOctets: "1.3.6.1.2.1.31.1.1.1.6",
  ifHCOutOctets: "1.3.6.1.2.1.31.1.1.1.10",
  ifInOctets: "1.3.6.1.2.1.2.2.1.10",
  ifOutOctets: "1.3.6.1.2.1.2.2.1.16"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function snmpwalk(ip, oid) {
  return new Promise((resolve, reject) => {
    execFile(
      SNMP_BIN,
      ["-v2c", "-c", COMMUNITY, "-On", ip, oid],
      { timeout: SNMP_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 * 8 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || stdout || error.message || "").trim()));
          return;
        }
        resolve(String(stdout || ""));
      }
    );
  });
}

function parseWalkMap(raw) {
  const out = {};
  const lines = String(raw || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^\.?([\d.]+)\.(\d+)\s*=\s*([A-Za-z0-9\-]+):\s*(.+)$/);
    if (!m) continue;

    const idx = Number(m[2]);
    const type = String(m[3] || "").trim();
    const value = String(m[4] || "").trim();

    if (/^".*"$/.test(value)) {
      out[idx] = value.slice(1, -1);
      continue;
    }

    const paren = value.match(/\((\-?\d+)\)/);
    if (paren) {
      out[idx] = Number(paren[1]);
      continue;
    }

    const leadNum = value.match(/^-?\d+(?:\.\d+)?/);
    if (leadNum) {
      out[idx] = Number(leadNum[0]);
      continue;
    }

    if (/INTEGER|Gauge32|Counter32|Counter64|Timeticks|Unsigned32/i.test(type)) {
      const anyNum = value.match(/-?\d+(?:\.\d+)?/);
      if (anyNum) {
        out[idx] = Number(anyNum[0]);
        continue;
      }
    }

    out[idx] = value;
  }

  return out;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function diffCounter(a, b) {
  const x = safeNum(a, 0);
  const y = safeNum(b, 0);
  return y >= x ? (y - x) : 0;
}

function calcMbps(deltaBytes, seconds) {
  if (!seconds || seconds <= 0) return 0;
  return Number((((deltaBytes * 8) / seconds) / 1000000).toFixed(2));
}

function isIgnoredInterface(name) {
  const n = String(name || "").toLowerCase();
  return (
    !n ||
    n.includes("vlan") ||
    n.includes("loopback") ||
    n.includes("null") ||
    n.includes("cpu")
  );
}

function interfaceScore(row) {
  let score = 0;

  if (row.oper === 1) score += 1000;
  if (row.speedMb >= 1000) score += 300;
  else if (row.speedMb >= 100) score += 120;
  else if (row.speedMb > 0) score += 40;

  score += Math.min(row.totalMbps, 1000);

  const txt = `${row.name} ${row.alias}`.toLowerCase();
  if (/(uplink|to |back|trunk|core|home|office|rb|c5c|thgv|gr)/i.test(txt)) score += 80;

  if (isIgnoredInterface(row.name)) score -= 10000;

  return score;
}

async function collectDevice(target) {
  const ip = target.ip;
  const name = target.name || ip;

  const [
    sysUpTimeRaw,
    ifDescrRaw,
    ifAliasRaw,
    ifOperRaw,
    ifHighSpeedRaw,
    ifSpeedRaw,
    in1Raw,
    out1Raw
  ] = await Promise.all([
    snmpwalk(ip, OIDS.sysUpTime),
    snmpwalk(ip, OIDS.ifDescr),
    snmpwalk(ip, OIDS.ifAlias).catch(() => ""),
    snmpwalk(ip, OIDS.ifOperStatus),
    snmpwalk(ip, OIDS.ifHighSpeed).catch(() => ""),
    snmpwalk(ip, OIDS.ifSpeed).catch(() => ""),
    snmpwalk(ip, OIDS.ifHCInOctets).catch(() => snmpwalk(ip, OIDS.ifInOctets)),
    snmpwalk(ip, OIDS.ifHCOutOctets).catch(() => snmpwalk(ip, OIDS.ifOutOctets))
  ]);

  await sleep(SAMPLE_DELAY_MS);

  const [in2Raw, out2Raw] = await Promise.all([
    snmpwalk(ip, OIDS.ifHCInOctets).catch(() => snmpwalk(ip, OIDS.ifInOctets)),
    snmpwalk(ip, OIDS.ifHCOutOctets).catch(() => snmpwalk(ip, OIDS.ifOutOctets))
  ]);

  const uptimeMap = parseWalkMap(sysUpTimeRaw);
  const ifDescr = parseWalkMap(ifDescrRaw);
  const ifAlias = parseWalkMap(ifAliasRaw);
  const ifOper = parseWalkMap(ifOperRaw);
  const ifHighSpeed = parseWalkMap(ifHighSpeedRaw);
  const ifSpeed = parseWalkMap(ifSpeedRaw);
  const in1 = parseWalkMap(in1Raw);
  const out1 = parseWalkMap(out1Raw);
  const in2 = parseWalkMap(in2Raw);
  const out2 = parseWalkMap(out2Raw);

  const uptimeTicks = safeNum(uptimeMap[0], 0);
  const uptimeSeconds = Math.floor(uptimeTicks / 100);
  const seconds = SAMPLE_DELAY_MS / 1000;

  const rows = [];

  for (const key of Object.keys(ifDescr)) {
    const idx = Number(key);
    const descr = String(ifDescr[idx] || "").trim();
    const alias = String(ifAlias[idx] || "").trim();
    const oper = safeNum(ifOper[idx], 0);

    let speedMb = safeNum(ifHighSpeed[idx], 0);
    if (!speedMb) {
      const speedBits = safeNum(ifSpeed[idx], 0);
      if (speedBits > 0) speedMb = Math.round(speedBits / 1000000);
    }

    const deltaIn = diffCounter(in1[idx], in2[idx]);
    const deltaOut = diffCounter(out1[idx], out2[idx]);

    const rxMbps = calcMbps(deltaIn, seconds);
    const txMbps = calcMbps(deltaOut, seconds);
    const totalMbps = Number((rxMbps + txMbps).toFixed(2));

    const rxUsage = speedMb > 0 ? Number(Math.min((rxMbps / speedMb) * 100, 100).toFixed(1)) : 0;
    const txUsage = speedMb > 0 ? Number(Math.min((txMbps / speedMb) * 100, 100).toFixed(1)) : 0;

    const row = {
      index: idx,
      name: descr,
      alias,
      oper,
      speedMb,
      rxMbps,
      txMbps,
      totalMbps,
      rxUsage,
      txUsage
    };

    row.score = interfaceScore(row);
    rows.push(row);
  }

  rows.sort((a, b) => b.score - a.score);

  const best = rows[0] || {
    index: null,
    name: "Unavailable",
    alias: "",
    oper: 2,
    speedMb: 0,
    rxMbps: 0,
    txMbps: 0,
    totalMbps: 0,
    rxUsage: 0,
    txUsage: 0
  };

  return {
    name,
    ip,
    ok: true,
    status: best.oper === 1 ? "UP" : "DOWN",
    uptimeSeconds,
    uptimeTicks,
    uplinkInterface: best.name,
    uplinkIndex: best.index,
    uplinkAlias: best.alias,
    rxMbps: best.rxMbps,
    txMbps: best.txMbps,
    totalMbps: best.totalMbps,
    rxUsage: best.rxUsage,
    txUsage: best.txUsage,
    speedMb: best.speedMb,
    interfaces: rows.slice(0, 12)
  };
}

async function collectAllTpLinkJetstream() {
  const devices = [];

  for (const target of TARGETS) {
    try {
      const row = await collectDevice(target);
      devices.push(row);
    } catch (error) {
      devices.push({
        name: target.name || target.ip,
        ip: target.ip,
        ok: false,
        status: "DOWN",
        error: error.message || "SNMP failed",
        uptimeSeconds: 0,
        uptimeTicks: 0,
        uplinkInterface: "Unavailable",
        uplinkIndex: null,
        uplinkAlias: "",
        rxMbps: 0,
        txMbps: 0,
        totalMbps: 0,
        rxUsage: 0,
        txUsage: 0,
        speedMb: 0,
        interfaces: []
      });
    }
  }

  const online = devices.filter(x => x.status === "UP").length;
  const offline = devices.length - online;
  const totalTrafficMbps = Number(devices.reduce((s, x) => s + safeNum(x.totalMbps, 0), 0).toFixed(2));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    community: COMMUNITY,
    deviceCount: devices.length,
    online,
    offline,
    totalTrafficMbps,
    devices
  };
}

module.exports = {
  collectAllTpLinkJetstream
};
