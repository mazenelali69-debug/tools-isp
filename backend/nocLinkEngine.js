const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const CFG_PATH = path.join(__dirname, "nocPingTargets.json");

const TELEGRAM_TOKEN = "8732391910:AAHU7-0ZI4YBioJMV7-INC53X7R35rRX_0U";
const TELEGRAM_CHAT_ID = "8292425726";

const state = new Map();

function runSnmpwalk(ip, oidOrName) {
  return new Promise((resolve, reject) => {
    execFile(
      "snmpwalk",
      ["-v2c", "-c", "public", ip, oidOrName],
      { windowsHide: true, timeout: 8000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(String(stderr || err.message || err)));
          return;
        }
        resolve(String(stdout || ""));
      }
    );
  });
}

function loadTargets() {
  try {
    const raw = fs.readFileSync(CFG_PATH, "utf8");
    const cfg = JSON.parse(raw);
    return [...new Set((cfg.singleIPs || []).map(x => String(x).trim()).filter(Boolean))];
  } catch (e) {
    console.error("[LINK-ENGINE] config load failed:", e.message);
    return [];
  }
}

function parseTable(output, prefix) {
  const map = new Map();
  const lines = String(output).split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  for (const line of lines) {
    const m = line.match(new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.(\\d+)\\s*=\\s*.+?:\\s*(.+)$"));
    if (!m) continue;
    const idx = Number(m[1]);
    const val = String(m[2]).trim().replace(/^"|"$/g, "");
    map.set(idx, val);
  }
  return map;
}

function normalizeSpeedMbps(ifHighSpeedVal, ifSpeedVal) {
  const hs = Number(ifHighSpeedVal);
  if (Number.isFinite(hs) && hs > 0) return hs;

  const sp = Number(ifSpeedVal);
  if (Number.isFinite(sp) && sp > 0) return Math.round(sp / 1000000);

  return 0;
}

function looksPhysical(name) {
  const s = String(name || "").toLowerCase();

  if (
    s.includes("bridge") ||
    s.includes("vlan") ||
    s.includes("pppoe") ||
    s.includes("loopback") ||
    s === "lo" ||
    s.includes("eoip") ||
    s.includes("gre") ||
    s.includes("ovpn") ||
    s.includes("wg") ||
    s.includes("wireguard") ||
    s.includes("bond") ||
    s.includes("lte") ||
    s.includes("wlan")
  ) {
    return false;
  }

  return (
    s.includes("ether") ||
    s.includes("sfp") ||
    s.includes("gigabitethernet") ||
    s.includes("ge ") ||
    s.includes("ge-") ||
    s.includes("xe-")
  );
}

function scoreIface(name, speedMbps, operUp) {
  let score = 0;
  if (operUp) score += 100;
  if (looksPhysical(name)) score += 100;
  if (speedMbps >= 1000) score += 50;
  else if (speedMbps >= 100) score += 20;
  score += Math.min(speedMbps, 10000) / 100;
  return score;
}

async function detectBestInterface(ip) {
  const [descrOut, operOut, speedOut, highOut] = await Promise.all([
    runSnmpwalk(ip, "IF-MIB::ifDescr"),
    runSnmpwalk(ip, "IF-MIB::ifOperStatus"),
    runSnmpwalk(ip, "IF-MIB::ifSpeed"),
    runSnmpwalk(ip, "IF-MIB::ifHighSpeed")
  ]);

  const descr = parseTable(descrOut, "IF-MIB::ifDescr");
  const oper = parseTable(operOut, "IF-MIB::ifOperStatus");
  const speed = parseTable(speedOut, "IF-MIB::ifSpeed");
  const high = parseTable(highOut, "IF-MIB::ifHighSpeed");

  let best = null;

  for (const [idx, name] of descr.entries()) {
    const operVal = String(oper.get(idx) || "");
    const operUp = /up/i.test(operVal);
    const speedMbps = normalizeSpeedMbps(high.get(idx), speed.get(idx));

    const item = {
      idx,
      name,
      operUp,
      speedMbps,
      score: scoreIface(name, speedMbps, operUp)
    };

    if (!best || item.score > best.score) best = item;
  }

  return best;
}

async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text
      })
    });
  } catch (e) {
    console.error("[LINK-ENGINE] telegram failed:", e.message);
  }
}

function getState(ip) {
  if (!state.has(ip)) {
    state.set(ip, {
      baselineSet: false,
      lastIfName: "",
      lastIfIndex: 0,
      lastSpeedMbps: 0,
      lastOperUp: false
    });
  }
  return state.get(ip);
}

async function checkIp(ip) {
  try {
    const best = await detectBestInterface(ip);
    if (!best) return;

    const st = getState(ip);

    if (!st.baselineSet) {
      st.baselineSet = true;
      st.lastIfName = best.name;
      st.lastIfIndex = best.idx;
      st.lastSpeedMbps = best.speedMbps;
      st.lastOperUp = best.operUp;

      console.log(`[LINK-ENGINE] baseline ${ip} -> ${best.name} idx=${best.idx} speed=${best.speedMbps}M up=${best.operUp}`);
      return;
    }

    const oldSpeed = st.lastSpeedMbps;
    const newSpeed = best.speedMbps;
    const oldUp = st.lastOperUp;
    const newUp = best.operUp;

    if (oldUp && !newUp) {
      await sendTelegram(`?? LINK DOWN\nIP: ${ip}\nInterface: ${best.name}\nTime: ${new Date().toISOString()}`);
      console.log("[LINK-ENGINE] DOWN", ip, best.name);
    } else if (!oldUp && newUp) {
      await sendTelegram(`? LINK RESTORED\nIP: ${ip}\nInterface: ${best.name}\nSpeed: ${newSpeed}M\nTime: ${new Date().toISOString()}`);
      console.log("[LINK-ENGINE] RESTORED", ip, best.name, newSpeed + "M");
    } else if (newUp && oldSpeed >= 1000 && newSpeed > 0 && newSpeed < 1000) {
      await sendTelegram(`?? LINK DEGRADED\nIP: ${ip}\nInterface: ${best.name}\nSpeed: ${newSpeed}M (was ${oldSpeed}M)\nTime: ${new Date().toISOString()}`);
      console.log("[LINK-ENGINE] DEGRADED", ip, best.name, oldSpeed, "->", newSpeed);
    } else if (newUp && oldSpeed > 0 && oldSpeed < 1000 && newSpeed >= 1000) {
      await sendTelegram(`? LINK SPEED RESTORED\nIP: ${ip}\nInterface: ${best.name}\nSpeed: ${newSpeed}M\nTime: ${new Date().toISOString()}`);
      console.log("[LINK-ENGINE] SPEED RESTORED", ip, best.name, newSpeed + "M");
    }

    st.lastIfName = best.name;
    st.lastIfIndex = best.idx;
    st.lastSpeedMbps = newSpeed;
    st.lastOperUp = newUp;
  } catch (e) {
    console.error("[LINK-ENGINE] check failed for", ip, e.message);
  }
}

async function runCycle() {
  const ips = loadTargets();
  if (!ips.length) {
    console.log("[LINK-ENGINE] no targets loaded");
    return;
  }

  console.log("[LINK-ENGINE] cycle start, targets:", ips.length);

  const batchSize = 5;
  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    await Promise.all(batch.map(checkIp));
  }

  console.log("[LINK-ENGINE] cycle end");
}

function startNocLinkEngine() {
  console.log("[LINK-ENGINE] started");
  runCycle().catch((e) => console.error("[LINK-ENGINE] first cycle failed:", e.message));
  setInterval(() => {
    runCycle().catch((e) => console.error("[LINK-ENGINE] cycle failed:", e.message));
  }, 60000);
}

module.exports = { startNocLinkEngine };
