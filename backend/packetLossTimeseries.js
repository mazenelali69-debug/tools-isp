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
const MAX_AGE = 24 * 60 * 60 * 1000;
const FILE = path.join(__dirname, "data", "packetloss-timeseries.json");

try {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
} catch {}

let db = {};
let busy = false;

if (fs.existsSync(FILE)) {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    db = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    db = {};
  }
}

function save() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("[PACKETLOSS-TS][SAVE]", e?.message || e);
  }
}

function pingHost(host) {
  return new Promise((resolve) => {
    try {
      exec(`ping -n 2 ${host}`, { windowsHide: true }, (err, stdout) => {
        if (err) {
          return resolve({ loss: 100, ping: null });
        }

        const out = String(stdout || "");
        const lossMatch = out.match(/(\d+)%\s*loss/i);
        const avgMatch = out.match(/Average\s*=\s*(\d+)ms/i);

        resolve({
          loss: lossMatch ? parseInt(lossMatch[1], 10) : 100,
          ping: avgMatch ? parseInt(avgMatch[1], 10) : null
        });
      });
    } catch (e) {
      console.error("[PACKETLOSS-TS][PING]", host, e?.message || e);
      resolve({ loss: 100, ping: null });
    }
  });
}

async function loop() {
  if (busy) return;
  busy = true;

  try {
    const now = Date.now();

    for (const host of TARGETS) {
      let res = { loss: 100, ping: null };

      try {
        res = await pingHost(host);
      } catch (e) {
        console.error("[PACKETLOSS-TS][HOST]", host, e?.message || e);
      }

      if (!Array.isArray(db[host])) {
        db[host] = [];
      }

      db[host].push({
        ts: now,
        loss: Number.isFinite(Number(res.loss)) ? Number(res.loss) : 100,
        ping: Number.isFinite(Number(res.ping)) ? Number(res.ping) : null
      });

      db[host] = db[host].filter((p) => now - Number(p.ts || 0) < MAX_AGE);
    }

    save();
  } catch (e) {
    console.error("[PACKETLOSS-TS][LOOP]", e?.message || e);
  } finally {
    busy = false;
  }
}

loop().catch((e) => console.error("[PACKETLOSS-TS][BOOT]", e?.message || e));
setInterval(() => {
  loop().catch((e) => console.error("[PACKETLOSS-TS][INTERVAL]", e?.message || e));
}, INTERVAL);

module.exports = {
  getSeries: (host) => Array.isArray(db[host]) ? db[host] : []
};

