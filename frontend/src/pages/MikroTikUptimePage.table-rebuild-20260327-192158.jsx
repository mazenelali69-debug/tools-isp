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
  } else if (packetLoss >= 40 || (ping !== null && ping >= 140) || jitter >= 35) {
    status = "DEGRADED";
  } else if (ping === null && cpu === null && !ip && !name) {
    status = "UNKNOWN";
  }

  const score =
    (status === "UP" ? 300 : status === "DEGRADED" ? 180 : status === "DOWN" ? 40 : 80) +
    Math.max(0, 120 - (ping ?? 120)) +
    Math.max(0, 100 - (packetLoss ?? 100)) +
    Math.max(0, 100 - (jitter ?? 100)) +
    Math.max(0, 100 - (cpu ?? 100));

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
    score,
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

function statusMeta(status) {
  switch (status) {
    case "UP":
      return {
        tone: "#22c55e",
        soft: "rgba(34,197,94,0.14)",
        line: "rgba(34,197,94,0.28)",
        label: "Healthy",
      };
    case "DEGRADED":
      return {
        tone: "#f59e0b",
        soft: "rgba(245,158,11,0.15)",
        line: "rgba(245,158,11,0.28)",
        label: "Degraded",
      };
    case "DOWN":
      return {
        tone: "#f43f5e",
        soft: "rgba(244,63,94,0.15)",
        line: "rgba(244,63,94,0.28)",
        label: "Offline",
      };
    default:
      return {
        tone: "#94a3b8",
        soft: "rgba(148,163,184,0.12)",
        line: "rgba(148,163,184,0.22)",
        label: "Unknown",
      };
  }
}

function metricTone(value, goodLimit, warnLimit, reverse = false) {
  if (value === null || value === undefined) return "#94a3b8";
  if (!reverse) {
    if (value <= goodLimit) return "#22c55e";
    if (value <= warnLimit) return "#f59e0b";
    return "#f43f5e";
  }
  if (value >= goodLimit) return "#22c55e";
  if (value >= warnLimit) return "#f59e0b";
  return "#f43f5e";
}

function ProgressBar({ value, max = 100, color = "#38bdf8" }) {
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, (safe / max) * 100));

  return (
    <div
      style={{
        height: 7,
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: color,
          boxShadow: "0 0 14px " + color,
          transition: "width 220ms ease",
        }}
      />
    </div>
  );
}

function KpiCard({ label, value, hint, color }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: 16,
        background: "linear-gradient(180deg, rgba(13,18,29,0.98), rgba(8,11,19,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.26)",
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 3,
          background: color,
          boxShadow: "0 0 16px " + color,
        }}
      />
      <div style={{ fontSize: 11, color: "rgba(212,220,245,0.56)", textTransform: "uppercase", letterSpacing: "0.14em", paddingLeft: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.05em", color: "#f8fbff", paddingLeft: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(212,220,245,0.66)", paddingLeft: 6 }}>
        {hint}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ display: "grid", gap: 5, padding: "0 2px" }}>
      <div style={{ fontSize: 22, fontWeight: 950, color: "#f8fbff", letterSpacing: "-0.04em" }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: "rgba(212,220,245,0.62)" }}>
        {subtitle}
      </div>
    </div>
  );
}

function MetricBox({ label, value, rawValue, max, color }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fbff" }}>{value}</div>
      </div>
      <ProgressBar value={rawValue} max={max} color={color} />
    </div>
  );
}

function DeviceCard({ item }) {
  const meta = statusMeta(item.status);
  const pingColor = metricTone(item.ping, 40, 100);
  const jitterColor = metricTone(item.jitter, 10, 25);
  const lossColor = metricTone(item.packetLoss, 1, 10);
  const cpuColor = metricTone(item.cpu, 45, 75);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        background: "linear-gradient(180deg, rgba(11,16,27,0.98), rgba(7,10,17,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 18px 34px rgba(0,0,0,0.24)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: meta.tone,
          boxShadow: "0 0 14px " + meta.tone,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -70,
          right: -60,
          width: 170,
          height: 170,
          borderRadius: "50%",
          background: meta.soft,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: 16, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#f8fbff", lineHeight: 1.12, wordBreak: "break-word" }}>
              {item.name}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(230,236,255,0.86)",
                fontSize: 11,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: meta.tone,
                  boxShadow: "0 0 14px " + meta.tone,
                }}
              />
              {item.ip || "No IP"}
            </div>
          </div>

          <div
            style={{
              flex: "0 0 auto",
              padding: "7px 10px",
              borderRadius: 999,
              background: meta.soft,
              border: "1px solid " + meta.line,
              color: meta.tone,
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {meta.label}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
          <MetricBox label="Ping" value={fmtMs(item.ping)} rawValue={item.ping ?? 0} max={180} color={pingColor} />
          <MetricBox label="Jitter" value={fmtMs(item.jitter)} rawValue={item.jitter ?? 0} max={60} color={jitterColor} />
          <MetricBox label="Loss" value={fmtPct(item.packetLoss)} rawValue={item.packetLoss ?? 0} max={100} color={lossColor} />
          <MetricBox label="CPU" value={fmtPct(item.cpu)} rawValue={item.cpu ?? 0} max={100} color={cpuColor} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Load
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f8fbff" }}>
              {fmtPct(item.load)}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Uptime
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fbff", lineHeight: 1.35, wordBreak: "break-word" }}>
              {item.uptimeText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({ item, rank }) {
  const meta = statusMeta(item.status);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(10,15,25,1), rgba(6,9,15,1))",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 46px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.16,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -90,
          right: -70,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: meta.soft,
          filter: "blur(34px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: meta.tone,
          boxShadow: "0 0 18px " + meta.tone,
        }}
      />

      <div style={{ position: "relative", padding: 18, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 9px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 12,
                color: "rgba(225,233,255,0.90)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 900,
              }}
            >
              #{rank} Priority
            </div>

            <div style={{ fontSize: 24, fontWeight: 950, lineHeight: 1.02, letterSpacing: "-0.05em", color: "#f9fbff", wordBreak: "break-word" }}>
              {item.name}
            </div>

            <div
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 11px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(230,236,255,0.86)",
                fontSize: 11,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
            >
              {item.ip || "No IP"}
            </div>
          </div>

          <div
            style={{
              flex: "0 0 auto",
              padding: "8px 10px",
              borderRadius: 999,
              background: meta.soft,
              border: "1px solid " + meta.line,
              color: meta.tone,
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {meta.label}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
          <MetricBox label="Ping" value={fmtMs(item.ping)} rawValue={item.ping ?? 0} max={180} color={metricTone(item.ping, 40, 100)} />
          <MetricBox label="Jitter" value={fmtMs(item.jitter)} rawValue={item.jitter ?? 0} max={60} color={metricTone(item.jitter, 10, 25)} />
          <MetricBox label="Loss" value={fmtPct(item.packetLoss)} rawValue={item.packetLoss ?? 0} max={100} color={metricTone(item.packetLoss, 1, 10)} />
          <MetricBox label="CPU" value={fmtPct(item.cpu)} rawValue={item.cpu ?? 0} max={100} color={metricTone(item.cpu, 45, 75)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
          <div
            style={{
              padding: 13,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Uptime
            </div>
            <div style={{ fontSize: 14, fontWeight: 850, color: "#f8fbff", lineHeight: 1.35 }}>
              {item.uptimeText}
            </div>
          </div>

          <div
            style={{
              minWidth: 110,
              padding: 13,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Load
            </div>
            <div style={{ fontSize: 18, fontWeight: 950, color: "#f8fbff" }}>
              {fmtPct(item.load)}
            </div>
          </div>
        </div>
      </div>
    </div>
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
          .sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));

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

    const pings = rows.map((x) => x.ping).filter((x) => x !== null && x !== undefined);
    const avgPing = pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null;

    const losses = rows.map((x) => x.packetLoss).filter((x) => x !== null && x !== undefined);
    const avgLoss = losses.length ? Math.round(losses.reduce((a, b) => a + b, 0) / losses.length) : null;

    const cpus = rows.map((x) => x.cpu).filter((x) => x !== null && x !== undefined);
    const avgCpu = cpus.length ? Math.round(cpus.reduce((a, b) => a + b, 0) / cpus.length) : null;

    return { total, up, degraded, down, avgPing, avgLoss, avgCpu };
  }, [rows]);

  const alertItems = useMemo(() => {
    return rows
      .filter((x) => x.status === "DOWN" || x.status === "DEGRADED")
      .sort((a, b) => {
        const order = { DOWN: 0, DEGRADED: 1, UP: 2, UNKNOWN: 3 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99) || (b.packetLoss ?? 0) - (a.packetLoss ?? 0);
      })
      .slice(0, 6);
  }, [rows]);

  const priority = rows.slice(0, 3);
  const gridRows = rows.slice(3);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "18px 18px 34px",
        color: "#eaf0ff",
        background:
          "radial-gradient(circle at top left, rgba(55,110,255,0.14) 0%, rgba(6,10,18,0) 28%), radial-gradient(circle at top right, rgba(34,197,94,0.10) 0%, rgba(6,10,18,0) 24%), linear-gradient(180deg, #05070c 0%, #070b12 46%, #04060a 100%)",
      }}
    >
      <div style={{ maxWidth: 1880, margin: "0 auto", display: "grid", gap: 16 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 26,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(10,14,22,0.98), rgba(6,9,14,1))",
            boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              opacity: 0.15,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(39,125,255,0.20) 0%, rgba(39,125,255,0) 68%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -160,
              left: -100,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0) 68%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", padding: 20, display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "stretch" }}>
              <div
                style={{
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "grid",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 11px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#7fe6ff",
                    background: "rgba(127,230,255,0.08)",
                    border: "1px solid rgba(127,230,255,0.2)",
                    width: "fit-content",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#54d7ff",
                      boxShadow: "0 0 16px #54d7ff",
                    }}
                  />
                  NoComment Network Observatory
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: "clamp(30px, 4.6vw, 58px)", lineHeight: 0.92, letterSpacing: "-0.06em", fontWeight: 1000, color: "#fbfdff" }}>
                    MikroTik Uptime Matrix
                  </div>
                  <div style={{ maxWidth: 900, color: "rgba(221,228,255,0.76)", fontSize: 14, lineHeight: 1.7 }}>
                    Dense observability layout inspired by Prometheus, Grafana, and Zabbix dashboards:
                    cleaner signal hierarchy, live fleet status, top-priority spotlight, and compact operational cards.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
                  <div style={{ borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Refresh</div>
                    <div style={{ marginTop: 6, fontSize: 17, fontWeight: 950, color: "#f8fbff" }}>15 sec</div>
                  </div>
                  <div style={{ borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Last Update</div>
                    <div style={{ marginTop: 6, fontSize: 17, fontWeight: 950, color: "#f8fbff" }}>{fmtTime(lastUpdated)}</div>
                  </div>
                  <div style={{ borderRadius: 16, padding: 12, background: error ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.12)", border: error ? "1px solid rgba(244,63,94,0.24)" : "1px solid rgba(34,197,94,0.22)" }}>
                    <div style={{ fontSize: 10, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Feed</div>
                    <div style={{ marginTop: 6, fontSize: 15, fontWeight: 950, color: error ? "#ffb0be" : "#9cf8b5" }}>
                      {error ? "API Error" : loading ? "Loading" : "Connected"}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(220,228,255,0.60)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 900 }}>
                  Alert Rail
                </div>

                {alertItems.length ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {alertItems.map((item) => {
                      const meta = statusMeta(item.status);
                      return (
                        <div
                          key={item.id}
                          style={{
                            borderRadius: 16,
                            padding: 12,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "grid",
                            gap: 7,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fbff", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.name}
                            </div>
                            <div
                              style={{
                                padding: "5px 8px",
                                borderRadius: 999,
                                background: meta.soft,
                                border: "1px solid " + meta.line,
                                color: meta.tone,
                                fontSize: 10,
                                fontWeight: 900,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                              }}
                            >
                              {meta.label}
                            </div>
                          </div>

                          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.72)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}>
                            {item.ip || "No IP"}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                            <div style={{ fontSize: 11, color: "rgba(220,228,255,0.66)" }}>Ping: <span style={{ color: "#f8fbff", fontWeight: 800 }}>{fmtMs(item.ping)}</span></div>
                            <div style={{ fontSize: 11, color: "rgba(220,228,255,0.66)" }}>Loss: <span style={{ color: "#f8fbff", fontWeight: 800 }}>{fmtPct(item.packetLoss)}</span></div>
                            <div style={{ fontSize: 11, color: "rgba(220,228,255,0.66)" }}>CPU: <span style={{ color: "#f8fbff", fontWeight: 800 }}>{fmtPct(item.cpu)}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.20)",
                      color: "#a7f3b0",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    No degraded or down devices right now.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))", gap: 12 }}>
              <KpiCard label="Total Devices" value={String(stats.total)} hint="Visible after excluded IP filtering" color="#3b82f6" />
              <KpiCard label="Operational" value={String(stats.up)} hint="Healthy live responders" color="#22c55e" />
              <KpiCard label="Degraded" value={String(stats.degraded)} hint="Latency, jitter, or loss issues" color="#f59e0b" />
              <KpiCard label="Down" value={String(stats.down)} hint="Offline or failed status" color="#f43f5e" />
              <KpiCard label="Avg Ping" value={stats.avgPing === null ? "--" : stats.avgPing + " ms"} hint="Current fleet latency" color="#06b6d4" />
              <KpiCard label="Avg CPU" value={stats.avgCpu === null ? "--" : stats.avgCpu + "%"} hint="Current device load average" color="#8b5cf6" />
            </div>
          </div>
        </div>

        {priority.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <SectionTitle
              title="Priority Spotlight"
              subtitle="Top ranked devices by current operational score."
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px,1fr))", gap: 14 }}>
              {priority.map((item, index) => (
                <SpotlightCard key={item.id} item={item} rank={index + 1} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <SectionTitle
            title="Fleet Grid"
            subtitle="Compact operational cards with better density, readability, and monitoring feel."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 14 }}>
            {gridRows.map((item) => (
              <DeviceCard key={item.id} item={item} />
            ))}

            {!loading && rows.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderRadius: 22,
                  padding: 28,
                  textAlign: "center",
                  background: "linear-gradient(180deg, rgba(15,20,32,0.98), rgba(8,11,18,0.98))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(225,232,255,0.82)",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                No devices available after current filtering.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
