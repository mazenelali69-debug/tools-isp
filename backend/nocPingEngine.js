const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const CFG_PATH = path.join(__dirname, "nocPingTargets.json");

const TELEGRAM_TOKEN = "8732391910:AAHU7-0ZI4YBioJMV7-INC53X7R35rRX_0U";
const TELEGRAM_CHAT_ID = "8292425726";

const state = new Map();

function ipToInt(ip) {
  return ip.split(".").reduce((a, o) => ((a << 8) >>> 0) + Number(o), 0) >>> 0;
}

function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join(".");
}

function expandCidr(cidr) {
  const [base, bitsStr] = String(cidr).split("/");
  const bits = Number(bitsStr);
  if (!base || !Number.isInteger(bits) || bits < 0 || bits > 32) return [];

  const baseInt = ipToInt(base);
  const mask = bits === 0 ? 0 : ((0xffffffff << (32 - bits)) >>> 0);
  const network = (baseInt & mask) >>> 0;
  const size = 2 ** (32 - bits);

  const ips = [];
  const start = size > 2 ? network + 1 : network;
  const end = size > 2 ? (network + size - 2) : (network + size - 1);

  for (let i = start; i <= end; i++) {
    ips.push(intToIp(i >>> 0));
  }
  return ips;
}

function loadTargets() {
  try {
    const raw = fs.readFileSync(CFG_PATH, "utf8");
    const cfg = JSON.parse(raw);

    const set = new Set();

    for (const r of (cfg.ranges || [])) {
      for (const ip of expandCidr(r)) set.add(ip);
    }

    for (const ip of (cfg.singleIPs || [])) {
      if (ip) set.add(String(ip).trim());
    }

    return [...set];
  } catch (e) {
    console.error("[PING-ENGINE] config load failed:", e.message);
    return [];
  }
}

function pingOnce(ip) {
  return new Promise((resolve) => {
    execFile("ping", ["-n", "1", "-w", "1200", ip], { windowsHide: true }, (err, stdout) => {
      const out = String(stdout || "");
      const alive = out.includes("TTL=") || out.includes("ttl=");
      resolve(alive);
    });
  });
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
    console.error("[PING-ENGINE] telegram failed:", e.message);
  }
}

function getState(ip) {
  if (!state.has(ip)) {
    state.set(ip, {
      down: false,
      failCount: 0,
      successCount: 0,
      lastChangeAt: 0
    });
  }
  return state.get(ip);
}

async function checkIp(ip) {
  const st = getState(ip);
  const alive = await pingOnce(ip);

  if (alive) {
    st.failCount = 0;
    st.successCount += 1;

    if (st.down && st.successCount >= 1) {
      st.down = false;
      st.lastChangeAt = Date.now();
      const msg = `? PING RESTORED\nIP: ${ip}\nTime: ${new Date().toISOString()}`;
      console.log("[PING-ENGINE] RESTORED", ip);
      await sendTelegram(msg);
    }
  } else {
    st.successCount = 0;
    st.failCount += 1;

    if (!st.down && st.failCount >= 3) {
      st.down = true;
      st.lastChangeAt = Date.now();
      const msg = `?? DEVICE DOWN\nIP: ${ip}\nTime: ${new Date().toISOString()}\nReason: ping failed 3 times`;
      console.log("[PING-ENGINE] DOWN", ip);
      await sendTelegram(msg);
    }
  }
}

async function runCycle() {
  const ips = loadTargets();
  if (!ips.length) {
    console.log("[PING-ENGINE] no targets loaded");
    return;
  }

  console.log("[PING-ENGINE] cycle start, targets:", ips.length);

  const batchSize = 20;
  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    await Promise.all(batch.map(checkIp));
  }

  console.log("[PING-ENGINE] cycle end");
}

function startNocPingEngine() {
  console.log("[PING-ENGINE] started");
  runCycle().catch((e) => console.error("[PING-ENGINE] first cycle failed:", e.message));
  setInterval(() => {
    runCycle().catch((e) => console.error("[PING-ENGINE] cycle failed:", e.message));
  }, 30000);
}

module.exports = { startNocPingEngine };
