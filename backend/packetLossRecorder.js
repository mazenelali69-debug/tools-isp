const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const TARGETS = [
  "10.0.25.10",
  "155.15.59.1",
  "112.24.30.1",
  "155.15.59.4",
  "88.88.88.254",
  "8.8.8.8",
  "1.1.1.1",
  "www.facebook.com",
  "www.youtube.com",
  "www.cnn.com",
  "www.tiktok.com",
  "www.whatsapp.com",
  "mail.google.com",
  "x.com",
  "discord.com"
];

const INTERVAL = 3000;
const DATA_FILE = path.join(__dirname, "data", "packetloss-history.json");

try {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
} catch {}

let state = {};
let history = [];
let busy = false;

if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    history = Array.isArray(parsed) ? parsed : [];
  } catch {
    history = [];
  }
}

function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2), "utf8");
  } catch (e) {
    console.error("[PACKETLOSS-RECORDER][SAVE]", e?.message || e);
  }
}

function pingHost(host) {
  return new Promise((resolve) => {
    try {
      exec(`ping -n 3 ${host}`, { windowsHide: true }, (err, stdout) => {
        if (err) {
          return resolve({ loss: 100, avg: null });
        }

        const out = String(stdout || "");
        const lossMatch = out.match(/(\d+)%\s*loss/i);
        const avgMatch = out.match(/Average\s*=\s*(\d+)ms/i);

        const loss = lossMatch ? parseInt(lossMatch[1], 10) : 100;
        const avg = avgMatch ? parseInt(avgMatch[1], 10) : null;

        resolve({ loss, avg });
      });
    } catch (e) {
      console.error("[PACKETLOSS-RECORDER][PING]", host, e?.message || e);
      resolve({ loss: 100, avg: null });
    }
  });
}

async function check() {
  if (busy) return;
  busy = true;

  try {
    const now = Date.now();

    for (const host of TARGETS) {
      const res = await pingHost(host);

      if (!state[host]) {
        state[host] = {
          inLoss: false,
          start: null,
          last: null
        };
      }

      if (res.loss > 0 && !state[host].inLoss) {
        state[host].inLoss = true;
        state[host].start = now;
      }

      if (res.loss === 0 && state[host].inLoss) {
        history.push({
          host,
          start: state[host].start,
          end: now,
          duration: now - state[host].start
        });

        if (history.length > 5000) {
          history = history.slice(-5000);
        }

        state[host].inLoss = false;
        state[host].start = null;
        save();
      }

      state[host].last = {
        loss: res.loss,
        ping: res.avg,
        ts: now
      };
    }
  } catch (e) {
    console.error("[PACKETLOSS-RECORDER][CHECK]", e?.message || e);
  } finally {
    busy = false;
  }
}

check().catch((e) => console.error("[PACKETLOSS-RECORDER][BOOT]", e?.message || e));
setInterval(() => {
  check().catch((e) => console.error("[PACKETLOSS-RECORDER][INTERVAL]", e?.message || e));
}, INTERVAL);

module.exports = {
  getLive: () => state,
  getHistory: () => history
};

