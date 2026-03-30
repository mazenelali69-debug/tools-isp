const express = require("express");
const router = express.Router();
const snmp = require("net-snmp");

const DEFAULT_COMMUNITY = process.env.SNMP_COMMUNITY || "public";
const DEFAULT_IFINDEXES = [1537, 2049, 2050];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSession(ip, community = DEFAULT_COMMUNITY) {
  return snmp.createSession(ip, community, {
    timeout: 2500,
    retries: 0,
    version: snmp.Version2c,
  });
}

function snmpGet(session, oids) {
  return new Promise((resolve, reject) => {
    session.get(oids, (err, varbinds) => {
      if (err) return reject(err);
      resolve(varbinds || []);
    });
  });
}

function vbOk(vb) {
  return vb && vb.oid && !snmp.isVarbindError(vb);
}

function vbToBigInt(vb) {
  if (!vbOk(vb)) return null;
  const v = vb.value;

  try {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(Math.trunc(v));
    if (Buffer.isBuffer(v)) {
      const hex = v.toString("hex") || "0";
      return BigInt("0x" + hex);
    }
    if (v && typeof v.toString === "function") {
      const s = v.toString();
      if (/^\d+$/.test(s)) return BigInt(s);
      const n = Number(s);
      if (Number.isFinite(n)) return BigInt(Math.trunc(n));
    }
  } catch {}

  return null;
}

async function readIfCounters(session, ifIndex) {
  const OID_ifHCInOctets  = `1.3.6.1.2.1.31.1.1.1.6.${ifIndex}`;
  const OID_ifHCOutOctets = `1.3.6.1.2.1.31.1.1.1.10.${ifIndex}`;
  const OID_ifOperStatus  = `1.3.6.1.2.1.2.2.1.8.${ifIndex}`;
  const OID_ifSpeed       = `1.3.6.1.2.1.2.2.1.5.${ifIndex}`;

  const vbs = await snmpGet(session, [
    OID_ifHCInOctets,
    OID_ifHCOutOctets,
    OID_ifOperStatus,
    OID_ifSpeed
  ]);

  const byOid = {};
  for (const vb of vbs) {
    if (vb && vb.oid) byOid[vb.oid] = vb;
  }

  return {
    ifIndex,
    inCounter: vbToBigInt(byOid[OID_ifHCInOctets]),
    outCounter: vbToBigInt(byOid[OID_ifHCOutOctets]),
    operStatus: vbOk(byOid[OID_ifOperStatus]) ? Number(byOid[OID_ifOperStatus].value) : null,
    speed: vbOk(byOid[OID_ifSpeed]) ? Number(byOid[OID_ifSpeed].value) : null,
  };
}

router.get("/aviat/throughput", async (req, res) => {
  const ip = String(req.query.ip || "").trim();
  const community = String(req.query.community || DEFAULT_COMMUNITY).trim();

  let ms = parseInt(String(req.query.ms || "2000"), 10);
  if (!Number.isFinite(ms)) ms = 2000;
  ms = Math.max(500, Math.min(5000, ms));

  if (!ip || !community) {
    return res.status(400).json({ ok: false, error: "ip+community required" });
  }

  const session = createSession(ip, community);

  try {
    const first = [];
    for (const idx of DEFAULT_IFINDEXES) {
      first.push(await readIfCounters(session, idx));
    }

    await sleep(ms);

    const second = [];
    for (const idx of DEFAULT_IFINDEXES) {
      second.push(await readIfCounters(session, idx));
    }

    const deltaSec = ms / 1000;

    const candidates = DEFAULT_IFINDEXES.map((idx, i) => {
      const a = first[i];
      const b = second[i];

      if (a.inCounter === null || a.outCounter === null || b.inCounter === null || b.outCounter === null) {
        return {
          ifIndex: idx,
          ok: false,
          error: "missing counters",
          operStatus: b.operStatus,
          speed: b.speed
        };
      }

      const inDelta = b.inCounter - a.inCounter;
      const outDelta = b.outCounter - a.outCounter;

      const rxMbps = inDelta < 0n ? 0 : Number(inDelta) * 8 / deltaSec / 1000000;
      const txMbps = outDelta < 0n ? 0 : Number(outDelta) * 8 / deltaSec / 1000000;

      return {
        ifIndex: idx,
        ok: true,
        rxMbps,
        txMbps,
        score: rxMbps + txMbps,
        operStatus: b.operStatus,
        speed: b.speed
      };
    });

    const valid = candidates.filter(x => x.ok && x.operStatus === 1);
    const best = [...valid].sort((a, b) => b.score - a.score)[0] || null;
    const bestRx = [...valid].sort((a, b) => b.rxMbps - a.rxMbps)[0] || null;
    const bestTx = [...valid].sort((a, b) => b.txMbps - a.txMbps)[0] || null;

    return res.json({
      ok: true,
      ip,
      deltaMs: ms,
      bestIfIndex: best?.ifIndex ?? null,
      rxMbps: best?.rxMbps ?? 0,
      txMbps: best?.txMbps ?? 0,
      bestRxIfIndex: bestRx?.ifIndex ?? null,
      bestTxIfIndex: bestTx?.ifIndex ?? null,
      candidates
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e)
    });
  } finally {
    try { session.close(); } catch {}
  }
});

module.exports = router;
