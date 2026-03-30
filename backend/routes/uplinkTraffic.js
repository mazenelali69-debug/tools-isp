const express = require("express");
const router = express.Router();
const snmp = require("net-snmp");

const DEFAULT_COMMUNITY = process.env.SNMP_COMMUNITY || "public";
const SAMPLE_DELAY_MS = 2200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSession(ip, community = DEFAULT_COMMUNITY) {
  return snmp.createSession(ip, community, {
    timeout: 1800,
    retries: 0,
    version: snmp.Version2c,
  });
}

function oid(base, index) {
  return base + "." + index;
}

function walkToMap(session, baseOid) {
  return new Promise((resolve, reject) => {
    const map = {};
    session.subtree(
      baseOid,
      (varbind) => {
        if (snmp.isVarbindError(varbind)) return;
        const parts = String(varbind.oid).split(".");
        const index = Number(parts[parts.length - 1]);
        map[index] = varbind.value;
      },
      (err) => {
        if (err) return reject(err);
        resolve(map);
      }
    );
  });
}

function getMany(session, oids) {
  return new Promise((resolve, reject) => {
    session.get(oids, (err, varbinds) => {
      if (err) return reject(err);
      resolve(varbinds);
    });
  });
}

function normalizeString(value) {
  if (value === null || value === undefined) return "";
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value);
}

function normalizeNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeDelta(curr, prev) {
  const c = normalizeNumber(curr);
  const p = normalizeNumber(prev);
  if (c === null || p === null) return null;
  if (c < p) return null;
  return c - p;
}

function shouldIgnoreName(name) {
  const n = String(name || "").toLowerCase();
  return (
    !n ||
    n.includes("loopback") ||
    n === "lo" ||
    n.includes("null") ||
    n.includes("docker") ||
    n.includes("veth") ||
    n.includes("bridge") ||
    n.includes("br-") ||
    n.includes("pppoe-in") ||
    n.includes("pppoe out") ||
    n.includes("pppoe-out") ||
    n.includes("gre") ||
    n.includes("eoip") ||
    n.includes("vlan") ||
    n.includes("wg") ||
    n.includes("wireguard")
  );
}

async function discoverInterfaces(ip, community) {
  const session = createSession(ip, community);
  try {
    const [ifDescrMap, ifOperMap] = await Promise.all([
      walkToMap(session, "1.3.6.1.2.1.2.2.1.2"),  // ifDescr
      walkToMap(session, "1.3.6.1.2.1.2.2.1.8"),  // ifOperStatus
    ]);

    const indexes = Object.keys(ifDescrMap)
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x))
      .sort((a, b) => a - b);

    const interfaces = indexes.map((index) => ({
      ifIndex: index,
      ifName: normalizeString(ifDescrMap[index]),
      operStatus: normalizeNumber(ifOperMap[index]),
    }));

    return interfaces.filter((item) => item.operStatus === 1 && !shouldIgnoreName(item.ifName));
  } finally {
    try { session.close(); } catch {}
  }
}

async function readCounters(ip, community, indexes) {
  if (!indexes.length) return {};

  const session = createSession(ip, community);
  try {
    const hcInBase = "1.3.6.1.2.1.31.1.1.1.6";
    const hcOutBase = "1.3.6.1.2.1.31.1.1.1.10";
    const inBase = "1.3.6.1.2.1.2.2.1.10";
    const outBase = "1.3.6.1.2.1.2.2.1.16";

    const hcOids = indexes.flatMap((idx) => [oid(hcInBase, idx), oid(hcOutBase, idx)]);
    let hcOk = true;
    let hcVarbinds = [];

    try {
      hcVarbinds = await getMany(session, hcOids);
      if (hcVarbinds.some((vb) => snmp.isVarbindError(vb))) {
        hcOk = false;
      }
    } catch {
      hcOk = false;
    }

    if (hcOk) {
      const result = {};
      for (let i = 0; i < indexes.length; i++) {
        const idx = indexes[i];
        const inVb = hcVarbinds[i * 2];
        const outVb = hcVarbinds[i * 2 + 1];
        result[idx] = {
          rx: normalizeNumber(inVb?.value),
          tx: normalizeNumber(outVb?.value),
          mode: "64bit",
        };
      }
      return result;
    }

    const stdOids = indexes.flatMap((idx) => [oid(inBase, idx), oid(outBase, idx)]);
    const varbinds = await getMany(session, stdOids);

    const result = {};
    for (let i = 0; i < indexes.length; i++) {
      const idx = indexes[i];
      const inVb = varbinds[i * 2];
      const outVb = varbinds[i * 2 + 1];
      result[idx] = {
        rx: normalizeNumber(inVb?.value),
        tx: normalizeNumber(outVb?.value),
        mode: "32bit",
      };
    }
    return result;
  } finally {
    try { session.close(); } catch {}
  }
}

async function detectBestUplink(ip, community) {
  const interfaces = await discoverInterfaces(ip, community);
  if (!interfaces.length) {
    return { ok: false, error: "No suitable UP interfaces found" };
  }

  const indexes = interfaces.map((x) => x.ifIndex);

  const first = await readCounters(ip, community, indexes);
  const startTs = Date.now();
  await sleep(SAMPLE_DELAY_MS);
  const second = await readCounters(ip, community, indexes);
  const endTs = Date.now();

  const dtSeconds = Math.max(1, (endTs - startTs) / 1000);

  const candidates = interfaces.map((iface) => {
    const a = first[iface.ifIndex];
    const b = second[iface.ifIndex];

    const rxDelta = safeDelta(b?.rx, a?.rx);
    const txDelta = safeDelta(b?.tx, a?.tx);

    const rxMbps = rxDelta === null ? null : (rxDelta * 8) / dtSeconds / 1000000;
    const txMbps = txDelta === null ? null : (txDelta * 8) / dtSeconds / 1000000;

    const score =
      (Number.isFinite(rxMbps) ? rxMbps : 0) +
      (Number.isFinite(txMbps) ? txMbps : 0);

    return {
      ifIndex: iface.ifIndex,
      ifName: iface.ifName,
      operStatus: iface.operStatus,
      rxMbps: Number.isFinite(rxMbps) ? rxMbps : 0,
      txMbps: Number.isFinite(txMbps) ? txMbps : 0,
      score,
      counterMode: b?.mode || a?.mode || "unknown",
    };
  });

  candidates.sort((a, b) => b.score - a.score || a.ifIndex - b.ifIndex);
  const best = candidates[0];

  if (!best) {
    return { ok: false, error: "No candidate uplink found" };
  }

  return {
    ok: true,
    ip,
    ifIndex: best.ifIndex,
    ifName: best.ifName,
    rxMbps: best.rxMbps,
    txMbps: best.txMbps,
    counterMode: best.counterMode,
    sampleMs: SAMPLE_DELAY_MS,
    candidates,
  };
}

router.get("/uplink-traffic", async (req, res) => {
  const ip = String(req.query.ip || "").trim();
  const community = String(req.query.community || DEFAULT_COMMUNITY).trim();

  if (!ip) {
    return res.status(400).json({ ok: false, error: "ip required" });
  }

  try {
    const result = await detectBestUplink(ip, community);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to detect uplink traffic",
    });
  }
});

module.exports = router;
