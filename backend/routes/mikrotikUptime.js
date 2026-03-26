const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

const COMMUNITY = "public";

const SERVICES = [
  { name: "Google DNS", host: "8.8.8.8", external: true },
  { name: "Cloudflare DNS", host: "1.1.1.1", external: true },
  { name: "TikTok", host: "tiktok.com", external: true },
  { name: "Instagram", host: "instagram.com", external: true }
];

const DEVICES = [
  { name: "AviatLink", ip: "155.15.59.4", top: true },

  { name: "RB Redwan", ip: "88.88.88.4" },
  { name: "RB Center Fadel", ip: "88.88.88.5" },
  { name: "To Dragon Clubs", ip: "88.88.88.6" },
  { name: "To My Office", ip: "88.88.88.7" },
  { name: "To Pharmacy Wahib", ip: "88.88.88.9" },
  { name: "IN C5C Jabal", ip: "88.88.88.10" },
  { name: "Hex IN Home Fast Web", ip: "88.88.88.12" },
  { name: "Fineshed JABAL", ip: "88.88.88.13" },
  { name: "HexGr3 Davo Office", ip: "88.88.88.15" },
  { name: "To Wish Money", ip: "88.88.88.22" },

  { name: "C5C Station", ip: "88.88.88.249" },
  { name: "C5C Client", ip: "88.88.88.250" },
  { name: "C5C TO Ahmadkh", ip: "10.88.88.253" },
  { name: "C5C IN Ahmadkh", ip: "88.88.88.252" },
  { name: "C5C TO Walid", ip: "10.88.88.251" },
  { name: "C5C IN Walid", ip: "88.88.88.250" }
];

function run(cmd, timeout = 12000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout, stderr) => {
      resolve({
        err,
        stdout: String(stdout || ""),
        stderr: String(stderr || "")
      });
    });
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parsePingOutput(output) {
  const lines = String(output || "").split(/\r?\n/);
  let received = 0;
  let lossPct = 100;
  const times = [];

  for (const line of lines) {
    const packets = line.match(/Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)\s*\((\d+)%\s*loss\)/i);
    if (packets) {
      received = Number(packets[2]);
      lossPct = Number(packets[4]);
    }
    const msMatches = [...line.matchAll(/time[=<]\s*(\d+)ms/gi)];
    for (const m of msMatches) times.push(Number(m[1]));
  }

  let avgMs = null;
  if (times.length) avgMs = times.reduce((a, b) => a + b, 0) / times.length;

  let jitterMs = null;
  if (times.length >= 2) {
    const deltas = [];
    for (let i = 1; i < times.length; i++) deltas.push(Math.abs(times[i] - times[i - 1]));
    jitterMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  } else if (times.length === 1) {
    jitterMs = 0;
  }

  return {
    alive: received > 0,
    lossPct,
    avgMs,
    jitterMs
  };
}

async function pingHost(host) {
  const { stdout, stderr } = await run(`ping -n 4 -w 1000 ${host}`, 9000);
  return parsePingOutput(stdout || stderr || "");
}

async function snmpUptime(ip) {
  const { err, stdout } = await run(`snmpwalk -v2c -c ${COMMUNITY} ${ip} 1.3.6.1.2.1.1.3.0`, 10000);

  if (err || !stdout) {
    return { raw: null, text: "N/A" };
  }

  const ticks = stdout.match(/Timeticks:\s*\((\d+)\)\s*(.+)$/im);
  if (!ticks) {
    return { raw: null, text: "N/A" };
  }

  return {
    raw: Number(ticks[1]),
    text: ticks[2].trim()
  };
}

async function snmpCpu(ip) {
  const { err, stdout } = await run(`snmpwalk -v2c -c ${COMMUNITY} ${ip} 1.3.6.1.2.1.25.3.3.1.2`, 10000);

  if (err || !stdout || /No Such Object|No Such Instance/i.test(stdout)) {
    return null;
  }

  const matches = [...stdout.matchAll(/INTEGER:\s*(-?\d+)/gi)].map(m => Number(m[1]));
  if (!matches.length) return null;

  const avg = matches.reduce((a, b) => a + b, 0) / matches.length;
  return Math.round(avg * 10) / 10;
}

function calcHealth(lossPct, pingMs, jitterMs, cpu) {
  const lossPenalty = Number(lossPct || 0) * 1.25;
  const pingPenalty = Number(pingMs || 0) * 0.16;
  const jitterPenalty = Number(jitterMs || 0) * 0.55;
  const cpuPenalty = cpu == null ? 0 : Number(cpu) * 0.35;
  return clamp(Math.round(100 - lossPenalty - pingPenalty - jitterPenalty - cpuPenalty), 0, 100);
}

router.get("/uptime", async (_req, res) => {
  try {
    const services = await Promise.all(
      SERVICES.map(async (s) => {
        const ping = await pingHost(s.host);
        const health = calcHealth(ping.lossPct, ping.avgMs, ping.jitterMs, null);
        return {
          type: "service",
          name: s.name,
          ip: s.host,
          status: ping.alive ? "UP" : "DOWN",
          pingMs: ping.avgMs == null ? null : Number(ping.avgMs.toFixed(1)),
          jitterMs: ping.jitterMs == null ? null : Number(ping.jitterMs.toFixed(1)),
          packetLossPct: Number(ping.lossPct || 0),
          health,
          uptime: "N/A",
          uptimeTicks: null,
          cpu: null
        };
      })
    );

    const devices = await Promise.all(
      DEVICES.map(async (d) => {
        const [ping, uptime, cpu] = await Promise.all([
          pingHost(d.ip),
          snmpUptime(d.ip),
          snmpCpu(d.ip)
        ]);

        const health = calcHealth(ping.lossPct, ping.avgMs, ping.jitterMs, cpu);

        return {
          type: "device",
          name: d.name,
          ip: d.ip,
          top: !!d.top,
          status: uptime.raw ? "UP" : "DOWN",
          pingMs: ping.avgMs == null ? null : Number(ping.avgMs.toFixed(1)),
          jitterMs: ping.jitterMs == null ? null : Number(ping.jitterMs.toFixed(1)),
          packetLossPct: Number(ping.lossPct || 0),
          uptime: uptime.text,
          uptimeTicks: uptime.raw,
          cpu,
          health
        };
      })
    );

    res.json({
      ok: true,
      services,
      devices,
      ts: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message || "mikrotik uptime route failed"
    });
  }
});

module.exports = router;
