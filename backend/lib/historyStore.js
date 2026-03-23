const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLINK_HISTORY_FILE = path.join(DATA_DIR, "uplink-history.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLINK_HISTORY_FILE)) {
    fs.writeFileSync(UPLINK_HISTORY_FILE, "[]\n", "utf8");
  }
}

function safeReadJsonArray(filePath) {
  try {
    ensureFile();
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteJsonArray(filePath, arr) {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2) + "\n", "utf8");
}

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function parseRangeToMs(range) {
  switch (String(range || "").trim().toLowerCase()) {
    case "5m": return 5 * 60 * 1000;
    case "30m": return 30 * 60 * 1000;
    case "60m":
    case "1h": return 1 * 60 * 60 * 1000;
    case "6h": return 6 * 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

function filterUplinkHistory(rows, options = {}) {
  const list = Array.isArray(rows) ? rows.slice() : [];
  const now = Date.now();

  const rangeMs = parseRangeToMs(options.range);
  const q = normalizeText(options.q);
  const uplink = normalizeText(options.uplink);

  let out = list.filter(row => row && typeof row === "object");

  if (rangeMs > 0) {
    const cutoff = now - rangeMs;
    out = out.filter(row => {
      const ts = new Date(row.ts || 0).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    });
  }

  if (uplink) {
    out = out.filter(row => {
      const fields = [
        row.uplink,
        row.name,
        row.ip,
        row.source
      ].map(normalizeText);

      return fields.some(x => x.includes(uplink));
    });
  }

  if (q) {
    out = out.filter(row => {
      const hay = [
        row.uplink,
        row.name,
        row.ip,
        row.source,
        row.ts
      ]
        .map(normalizeText)
        .join(" | ");

      return hay.includes(q);
    });
  }

  return out;
}

function getUplinkHistory(options = {}) {
  const max = Math.max(1, Math.min(Number(options.limit) || 200, 5000));
  const rows = safeReadJsonArray(UPLINK_HISTORY_FILE);
  const filtered = filterUplinkHistory(rows, options);
  return filtered.slice(-max);
}

function appendUplinkHistory(sample) {
  const rows = safeReadJsonArray(UPLINK_HISTORY_FILE);

  rows.push({
    ts: sample?.ts || new Date().toISOString(),
    rxMbps: Number(sample?.rxMbps || 0),
    txMbps: Number(sample?.txMbps || 0),
    source: sample?.source || "unknown",
    uplink: sample?.uplink || null,
    ip: sample?.ip || null,
    name: sample?.name || null
  });

  const MAX_ROWS = 10000;
  const trimmed = rows.slice(-MAX_ROWS);
  safeWriteJsonArray(UPLINK_HISTORY_FILE, trimmed);
  return trimmed.length;
}

module.exports = {
  getUplinkHistory,
  appendUplinkHistory,
  UPLINK_HISTORY_FILE,
  parseRangeToMs,
  filterUplinkHistory
};


