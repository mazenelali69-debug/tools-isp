import { useEffect, useMemo, useState } from "react";

const EXCLUDED_IPS = new Set([
  "10.88.88.253",
  "10.88.88.252",
  "10.88.88.251",
  "88.88.88.49",
  "88.88.88.250",
]);

const REFRESH_MS = 15000;
const HISTORY_LIMIT = 20;

function toNum(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickFirst(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.devices)) return payload.devices;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.targets)) return payload.targets;
  if (Array.isArray(payload?.monitors)) return payload.monitors;
  return [];
}

function normalizeDevice(item, index) {
  const ip = String(
    pickFirst(item, ["ip", "host", "address", "target", "deviceIp", "ipAddress"], "")
  ).trim();

  const name = String(
    pickFirst(item, ["name", "label", "deviceName", "title", "identity"], ip ? "Device " + ip : "Device " + (index + 1))
  ).trim();

  const ping = toNum(pickFirst(item, ["ping", "pingMs", "latency", "avgPing"], null));
  const jitter = toNum(pickFirst(item, ["jitter", "jitterMs", "avgJitter"], 0), 0);
  const packetLoss = toNum(pickFirst(item, ["packetLoss", "loss", "lossPct"], 0), 0);
  const cpu = toNum(pickFirst(item, ["cpu", "cpuLoad", "cpuUsage"], null));
  const load = toNum(pickFirst(item, ["load", "loadPct", "trafficLoad"], null));

  const uptimeText = String(
    pickFirst(item, ["uptime", "uptimeText", "humanUptime", "uptimeHuman"], "No uptime data")
  ).trim();

  const rawStatus = String(pickFirst(item, ["status", "state"], "")).trim().toUpperCase();

  let status = "UP";
  if (rawStatus === "DOWN" || rawStatus === "OFFLINE") {
    status = "DOWN";
  } else if (rawStatus === "DEGRADED" || rawStatus === "WARN" || rawStatus === "WARNING") {
    status = "DEGRADED";
  } else if (packetLoss >= 35 || (ping !== null && ping >= 120) || jitter >= 30) {
    status = "DEGRADED";
  } else if (ping === null && cpu === null && !ip && !name) {
    status = "UNKNOWN";
  }

  const severity =
    status === "DOWN" ? 1000 :
    status === "DEGRADED" ? 700 :
    status === "UNKNOWN" ? 500 : 100;

  const risk =
    severity +
    (packetLoss ?? 0) * 8 +
    (ping ?? 0) * 2 +
    (jitter ?? 0) * 3 +
    (cpu ?? 0) * 1.2;

  return {
    id: item?.id ?? ip ?? name ?? ("dev-" + index),
    name,
    ip,
    ping,
    jitter,
    packetLoss,
    cpu,
    load,
    uptimeText,
    status,
    risk,
  };
}

function fmtMs(v) {
  return v === null || v === undefined ? "--" : Math.round(v) + " ms";
}

function fmtPct(v) {
  return v === null || v === undefined ? "--" : Math.round(v) + "%";
}

function fmtTime(ts) {
  if (!ts) return "--";
  return new Date(ts).toLocaleTimeString();
}

function avg(list) {
  if (!list.length) return null;
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
}

function statusMeta(status) {
  switch (status) {
    case "UP":
      return {
        text: "UP",
        fg: "#4ade80",
        bg: "rgba(74,222,128,0.10)",
        border: "rgba(74,222,128,0.24)",
        row: "rgba(74,222,128,0.03)",
      };
    case "DEGRADED":
      return {
        text: "DEGRADED",
        fg: "#fbbf24",
        bg: "rgba(251,191,36,0.10)",
        border: "rgba(251,191,36,0.26)",
        row: "rgba(251,191,36,0.04)",
      };
    case "DOWN":
      return {
        text: "DOWN",
        fg: "#fb7185",
        bg: "rgba(251,113,133,0.10)",
        border: "rgba(251,113,133,0.28)",
        row: "rgba(251,113,133,0.05)",
      };
    default:
      return {
        text: "UNKNOWN",
        fg: "#94a3b8",
        bg: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.22)",
        row: "rgba(148,163,184,0.03)",
      };
  }
}

function metricColor(value, good, warn) {
  if (value === null || value === undefined) return "#64748b";
  if (value <= good) return "#4ade80";
  if (value <= warn) return "#fbbf24";
  return "#fb7185";
}

function cpuColor(value) {
  if (value === null || value === undefined) return "#64748b";
  if (value <= 45) return "#4ade80";
  if (value <= 75) return "#fbbf24";
  return "#fb7185";
}

function TinyBar({ value, max, color }) {
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, (safe / max) * 100));

  return (
    <div
      style={{
        marginTop: 6,
        height: 4,
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: color,
          transition: "width 220ms ease",
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value, hint, accent }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 14,
        background: "#0e1623",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
        display: "grid",
        gap: 6,
        minHeight: 92,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accent,
          }}
        />
        <div style={{ fontSize: 11, color: "rgba(214,224,243,0.60)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 29, fontWeight: 950, color: "#f8fbff", letterSpacing: "-0.04em" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(214,224,243,0.64)" }}>
        {hint}
      </div>
    </div>
  );
}

function buildSparklineGeometry(values, width, height, maxOverride = null) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) return { linePoints: "", areaPoints: "", lastX: 0, lastY: 0 };

  const rawMax = maxOverride !== null && maxOverride !== undefined
    ? Math.max(maxOverride, ...valid, 1)
    : Math.max(...valid, 1);

  const rawMin = Math.min(...valid);
  let minValue = rawMin;
  let maxValue = rawMax;

  if (maxValue - minValue < 1) {
    minValue = Math.max(0, rawMin - 1);
    maxValue = rawMax + 1;
  } else {
    const pad = (maxValue - minValue) * 0.18;
    minValue = Math.max(0, minValue - pad);
    maxValue = maxValue + pad;
  }

  const stepX = valid.length > 1 ? width / (valid.length - 1) : width;

  const points = valid.map((value, index) => {
    const x = index * stepX;
    const normalized = (value - minValue) / Math.max(0.0001, maxValue - minValue);
    const y = height - normalized * height;
    return { x, y };
  });

  const linePoints = points.map((p) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const areaPoints =
    first.x.toFixed(2) + "," + height.toFixed(2) + " " +
    linePoints + " " +
    last.x.toFixed(2) + "," + height.toFixed(2);

  return {
    linePoints,
    areaPoints,
    lastX: last.x,
    lastY: last.y,
  };
}

function SparkMini({ series, max, color, label, valueText }) {
  const geom = buildSparklineGeometry(series, 180, 46, max);
  const hasData = geom.linePoints.length > 0;

  return (
    <div
      style={{
        minWidth: 196,
        borderRadius: 12,
        padding: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "rgba(214,224,243,0.54)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#f8fbff" }}>
          {valueText}
        </div>
      </div>

      <div style={{ marginTop: 8, height: 50 }}>
        {hasData ? (
          <svg width="180" height="46" viewBox="0 0 180 46" style={{ display: "block", width: "100%", height: 46 }}>
            <line x1="0" y1="45" x2="180" y2="45" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="30" x2="180" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="0" y1="15" x2="180" y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            <polygon
              points={geom.areaPoints}
              fill={color}
              opacity="0.16"
            />

            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.4"
              points={geom.linePoints}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <circle
              cx={geom.lastX}
              cy={geom.lastY}
              r="2.8"
              fill={color}
            />
          </svg>
        ) : (
          <div style={{ height: 46, display: "flex", alignItems: "center", color: "rgba(214,224,243,0.42)", fontSize: 11 }}>
            Waiting for samples...
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceRow({ item, zebra, history }) {
  const meta = statusMeta(item.status);
  const pingTone = metricColor(item.ping, 40, 100);
  const jitterTone = metricColor(item.jitter, 10, 25);
  const lossTone = metricColor(item.packetLoss, 1, 10);
  const cpuTone = cpuColor(item.cpu);

  const samples = history[item.id] || [];
  const pingSeries = samples.map((x) => x.ping).filter((x) => Number.isFinite(x));
  const cpuSeries = samples.map((x) => x.cpu).filter((x) => Number.isFinite(x));

  return (
    <tr
      style={{
        background: item.status === "DOWN" ? meta.row : zebra ? "rgba(255,255,255,0.012)" : "transparent",
      }}
    >
      <td style={{ padding: "14px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fbff", lineHeight: 1.2 }}>
            {item.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(214,224,243,0.68)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
          >
            {item.ip || "No IP"}
          </div>
        </div>
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", width: 110 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            background: meta.bg,
            border: "1px solid " + meta.border,
            color: meta.fg,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.10em",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: meta.fg,
            }}
          />
          {meta.text}
        </div>
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 100 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{fmtMs(item.ping)}</div>
        <TinyBar value={item.ping ?? 0} max={180} color={pingTone} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 100 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{fmtMs(item.jitter)}</div>
        <TinyBar value={item.jitter ?? 0} max={60} color={jitterTone} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 100 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{fmtPct(item.packetLoss)}</div>
        <TinyBar value={item.packetLoss ?? 0} max={100} color={lossTone} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 100 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{fmtPct(item.cpu)}</div>
        <TinyBar value={item.cpu ?? 0} max={100} color={cpuTone} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 430 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SparkMini
            series={pingSeries}
            max={180}
            color={pingTone}
            label="Ping Live"
            valueText={fmtMs(item.ping)}
          />
          <SparkMini
            series={cpuSeries}
            max={100}
            color={cpuTone}
            label="CPU Live"
            valueText={fmtPct(item.cpu)}
          />
        </div>
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 90 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{fmtPct(item.load)}</div>
      </td>

      <td style={{ padding: "14px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 220 }}>
        <div style={{ fontSize: 13, color: "rgba(228,235,248,0.86)", lineHeight: 1.35 }}>
          {item.uptimeText}
        </div>
      </td>
    </tr>
  );
}

export default function MikroTikUptimePage() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const response = await fetch("/api/mikrotik/uptime", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const payload = await response.json();
        const list = extractList(payload);

        const normalized = list
          .map((item, index) => normalizeDevice(item, index))
          .filter((item) => !EXCLUDED_IPS.has(item.ip))
          .filter((item) => item.name || item.ip)
          .sort((a, b) => b.risk - a.risk || String(a.name).localeCompare(String(b.name)));

        if (!alive) return;

        setRows(normalized);
        setHistory((prev) => {
          const next = {};

          for (const item of normalized) {
            const oldSeries = Array.isArray(prev[item.id]) ? prev[item.id] : [];
            const newPoint = {
              ts: Date.now(),
              ping: Number.isFinite(item.ping) ? item.ping : null,
              cpu: Number.isFinite(item.cpu) ? item.cpu : null,
            };

            next[item.id] = [...oldSeries, newPoint].slice(-HISTORY_LIMIT);
          }

          return next;
        });

        setError("");
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const up = rows.filter((x) => x.status === "UP").length;
    const degraded = rows.filter((x) => x.status === "DEGRADED").length;
    const down = rows.filter((x) => x.status === "DOWN").length;

    const pingVals = rows.map((x) => x.ping).filter((x) => x !== null && x !== undefined);
    const lossVals = rows.map((x) => x.packetLoss).filter((x) => x !== null && x !== undefined);
    const cpuVals = rows.map((x) => x.cpu).filter((x) => x !== null && x !== undefined);

    return {
      total,
      up,
      degraded,
      down,
      avgPing: avg(pingVals),
      avgLoss: avg(lossVals),
      avgCpu: avg(cpuVals),
    };
  }, [rows]);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "16px 16px 28px",
        background: "linear-gradient(180deg, #070b11 0%, #09101a 50%, #070b11 100%)",
        color: "#e8eef9",
      }}
    >
      <div style={{ maxWidth: 1900, margin: "0 auto", display: "grid", gap: 14 }}>
        <div
          style={{
            borderRadius: 18,
            background: "#0b1320",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(214,224,243,0.56)", fontWeight: 900 }}>
                NoComment NOC
              </div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 1000, letterSpacing: "-0.05em", color: "#f8fbff" }}>
                MikroTik Fleet Monitoring
              </div>
              <div style={{ marginTop: 7, fontSize: 13, color: "rgba(214,224,243,0.70)" }}>
                Dense live matrix with real session-based per-device graphs for ping and CPU.
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                  color: "rgba(224,232,246,0.86)",
                }}
              >
                Refresh: <strong style={{ color: "#f8fbff" }}>15s</strong>
              </div>

              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                  color: "rgba(224,232,246,0.86)",
                }}
              >
                Updated: <strong style={{ color: "#f8fbff" }}>{fmtTime(lastUpdated)}</strong>
              </div>

              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: error ? "rgba(251,113,133,0.10)" : "rgba(74,222,128,0.10)",
                  border: error ? "1px solid rgba(251,113,133,0.22)" : "1px solid rgba(74,222,128,0.22)",
                  fontSize: 12,
                  fontWeight: 900,
                  color: error ? "#ffb3c0" : "#9ff0b7",
                }}
              >
                {error ? "API ERROR" : loading ? "LOADING" : "LIVE FEED"}
              </div>
            </div>
          </div>

          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <SummaryCard label="Total" value={String(stats.total)} hint="Visible after filter" accent="#60a5fa" />
            <SummaryCard label="Up" value={String(stats.up)} hint="Healthy responders" accent="#4ade80" />
            <SummaryCard label="Degraded" value={String(stats.degraded)} hint="Needs review" accent="#fbbf24" />
            <SummaryCard label="Down" value={String(stats.down)} hint="Offline / failed" accent="#fb7185" />
            <SummaryCard label="Avg Ping" value={stats.avgPing === null ? "--" : stats.avgPing + " ms"} hint="Fleet latency" accent="#22d3ee" />
            <SummaryCard label="Avg CPU" value={stats.avgCpu === null ? "--" : stats.avgCpu + "%"} hint="Fleet load" accent="#a78bfa" />
            <SummaryCard label="Avg Loss" value={stats.avgLoss === null ? "--" : stats.avgLoss + "%"} hint="Packet loss" accent="#f59e0b" />
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            background: "#0b1320",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "13px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 950, color: "#f8fbff", letterSpacing: "-0.02em" }}>
                Devices Matrix
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(214,224,243,0.64)" }}>
                Real devices with live session graphs beside each row.
              </div>
            </div>

            <div style={{ fontSize: 12, color: "rgba(214,224,243,0.62)" }}>
              Rows: <strong style={{ color: "#f8fbff" }}>{rows.length}</strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1450 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.025)" }}>
                  {["Device", "Status", "Ping", "Jitter", "Loss", "CPU", "Live Graphs", "Load", "Uptime"].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 11,
                        color: "rgba(214,224,243,0.56)",
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        position: "sticky",
                        top: 0,
                        background: "#0f1724",
                        zIndex: 1,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: 26,
                        textAlign: "center",
                        color: "rgba(214,224,243,0.72)",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      No devices available after current filtering.
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => (
                    <DeviceRow
                      key={item.id}
                      item={item}
                      zebra={index % 2 === 1}
                      history={history}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

