import { useEffect, useMemo, useState } from "react";

const EXCLUDED_IPS = new Set([
  "10.88.88.253",
  "10.88.88.252",
  "10.88.88.251",
  "88.88.88.49",
  "88.88.88.250",
]);

const REFRESH_MS = 15000;

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
        row: "rgba(74,222,128,0.035)",
      };
    case "DEGRADED":
      return {
        text: "DEGRADED",
        fg: "#fbbf24",
        bg: "rgba(251,191,36,0.10)",
        border: "rgba(251,191,36,0.26)",
        row: "rgba(251,191,36,0.035)",
      };
    case "DOWN":
      return {
        text: "DOWN",
        fg: "#fb7185",
        bg: "rgba(251,113,133,0.10)",
        border: "rgba(251,113,133,0.28)",
        row: "rgba(251,113,133,0.04)",
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
  if (value === null || value === undefined) return "#94a3b8";
  if (value <= good) return "#4ade80";
  if (value <= warn) return "#fbbf24";
  return "#fb7185";
}

function CpuColor(value) {
  if (value === null || value === undefined) return "#94a3b8";
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

function IncidentItem({ item }) {
  const meta = statusMeta(item.status);

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 12,
        background: "#0f1826",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "grid",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: "#f8fbff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              color: "rgba(214,224,243,0.66)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
          >
            {item.ip || "No IP"}
          </div>
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: meta.bg,
            border: "1px solid " + meta.border,
            color: meta.fg,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.12em",
          }}
        >
          {meta.text}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        <div style={{ fontSize: 11, color: "rgba(214,224,243,0.62)" }}>
          Ping
          <div style={{ marginTop: 3, color: "#f8fbff", fontWeight: 800 }}>{fmtMs(item.ping)}</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(214,224,243,0.62)" }}>
          Loss
          <div style={{ marginTop: 3, color: "#f8fbff", fontWeight: 800 }}>{fmtPct(item.packetLoss)}</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(214,224,243,0.62)" }}>
          CPU
          <div style={{ marginTop: 3, color: "#f8fbff", fontWeight: 800 }}>{fmtPct(item.cpu)}</div>
        </div>
      </div>
    </div>
  );
}

function CellMetric({ value, raw, max, color }) {
  return (
    <div style={{ minWidth: 88 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff" }}>{value}</div>
      <TinyBar value={raw} max={max} color={color} />
    </div>
  );
}

function DeviceRow({ item, zebra }) {
  const meta = statusMeta(item.status);
  const pingColor = metricColor(item.ping, 40, 100);
  const jitterColor = metricColor(item.jitter, 10, 25);
  const lossColor = metricColor(item.packetLoss, 1, 10);
  const cpuColor = CpuColor(item.cpu);

  return (
    <tr
      style={{
        background: meta.status === "DOWN" ? meta.row : zebra ? "rgba(255,255,255,0.015)" : "transparent",
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

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <CellMetric value={fmtMs(item.ping)} raw={item.ping ?? 0} max={180} color={pingColor} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <CellMetric value={fmtMs(item.jitter)} raw={item.jitter ?? 0} max={60} color={jitterColor} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <CellMetric value={fmtPct(item.packetLoss)} raw={item.packetLoss ?? 0} max={100} color={lossColor} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <CellMetric value={fmtPct(item.cpu)} raw={item.cpu ?? 0} max={100} color={cpuColor} />
      </td>

      <td style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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

  const incidents = useMemo(() => {
    return rows
      .filter((x) => x.status === "DOWN" || x.status === "DEGRADED")
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 8);
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
                Table-first monitoring rebuild with incident queue, dense metrics, and less toy-card styling.
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

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
          <div
            style={{
              borderRadius: 18,
              background: "#0b1320",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
              overflow: "hidden",
              position: "sticky",
              top: 14,
            }}
          >
            <div
              style={{
                padding: "13px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 950, color: "#f8fbff", letterSpacing: "-0.02em" }}>
                Incident Queue
              </div>
              <div style={{ fontSize: 11, color: "rgba(214,224,243,0.54)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Top Risk
              </div>
            </div>

            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              {incidents.length ? (
                incidents.map((item) => <IncidentItem key={item.id} item={item} />)
              ) : (
                <div
                  style={{
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(74,222,128,0.08)",
                    border: "1px solid rgba(74,222,128,0.18)",
                    color: "#9ff0b7",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  No degraded or down devices right now.
                </div>
              )}
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
                  Dense live table instead of oversized cards.
                </div>
              </div>

              <div style={{ fontSize: 12, color: "rgba(214,224,243,0.62)" }}>
                Rows: <strong style={{ color: "#f8fbff" }}>{rows.length}</strong>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.025)" }}>
                    {["Device", "Status", "Ping", "Jitter", "Loss", "CPU", "Load", "Uptime"].map((label) => (
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
                        colSpan={8}
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
                      <DeviceRow key={item.id} item={item} zebra={index % 2 === 1} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
