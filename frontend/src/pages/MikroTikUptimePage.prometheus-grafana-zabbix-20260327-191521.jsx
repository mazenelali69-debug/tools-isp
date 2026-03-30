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

function statusMeta(status) {
  switch (status) {
    case "UP":
      return {
        tone: "#22c55e",
        soft: "rgba(34,197,94,0.14)",
        line: "rgba(34,197,94,0.26)",
        glow: "0 0 0 1px rgba(34,197,94,0.18), 0 22px 46px rgba(34,197,94,0.10)",
        text: "Operational",
      };
    case "DEGRADED":
      return {
        tone: "#f59e0b",
        soft: "rgba(245,158,11,0.14)",
        line: "rgba(245,158,11,0.26)",
        glow: "0 0 0 1px rgba(245,158,11,0.18), 0 22px 46px rgba(245,158,11,0.10)",
        text: "Degraded",
      };
    case "DOWN":
      return {
        tone: "#f43f5e",
        soft: "rgba(244,63,94,0.14)",
        line: "rgba(244,63,94,0.26)",
        glow: "0 0 0 1px rgba(244,63,94,0.18), 0 22px 46px rgba(244,63,94,0.10)",
        text: "Offline",
      };
    default:
      return {
        tone: "#94a3b8",
        soft: "rgba(148,163,184,0.10)",
        line: "rgba(148,163,184,0.22)",
        glow: "0 0 0 1px rgba(148,163,184,0.14), 0 22px 46px rgba(10,15,30,0.24)",
        text: "Unknown",
      };
  }
}

function MiniBar({ value, max = 100, tone = "#38bdf8" }) {
  const n = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, (n / max) * 100));

  return (
    <div
      style={{
        height: 7,
        width: "100%",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg, " + tone + ", rgba(255,255,255,0.98))",
          boxShadow: "0 0 16px " + tone,
          transition: "width 260ms ease",
        }}
      />
    </div>
  );
}

function MetricTile({ label, value, bar, max, tone }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#f8fbff" }}>{value}</div>
      </div>
      <MiniBar value={bar} max={max} tone={tone} />
    </div>
  );
}

function PriorityCard({ item, rank }) {
  const meta = statusMeta(item.status);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        padding: 20,
        minHeight: 250,
        background:
          "linear-gradient(180deg, rgba(10,18,40,0.98), rgba(6,10,23,1))",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: meta.glow,
        display: "grid",
        gap: 16,
      }}
    >
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
          right: 0,
          top: 0,
          height: 2,
          background: "linear-gradient(90deg, rgba(255,255,255,0), " + meta.tone + ", rgba(255,255,255,0))",
          opacity: 0.95,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 12,
              color: "rgba(225,233,255,0.9)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 900,
            }}
          >
            #{rank} Priority
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 950,
              letterSpacing: "-0.05em",
              lineHeight: 1.02,
              color: "#f9fbff",
              wordBreak: "break-word",
            }}
          >
            {item.name}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(230,236,255,0.86)",
              fontSize: 12,
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
            padding: "9px 12px",
            borderRadius: 999,
            background: meta.soft,
            border: "1px solid " + meta.line,
            color: meta.tone,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {meta.text}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <MetricTile label="Ping" value={fmtMs(item.ping)} bar={item.ping ?? 0} max={180} tone="#38bdf8" />
        <MetricTile label="Jitter" value={fmtMs(item.jitter)} bar={item.jitter ?? 0} max={60} tone="#8b5cf6" />
        <MetricTile label="Loss" value={fmtPct(item.packetLoss)} bar={item.packetLoss ?? 0} max={100} tone="#fb7185" />
        <MetricTile label="CPU" value={fmtPct(item.cpu)} bar={item.cpu ?? 0} max={100} tone="#2dd4bf" />
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Uptime
          </div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 850, color: "#f8fbff", lineHeight: 1.35 }}>
            {item.uptimeText}
          </div>
        </div>
        <div
          style={{
            minWidth: 110,
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Load
          </div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#f8fbff" }}>
            {fmtPct(item.load)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ item }) {
  const meta = statusMeta(item.status);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(180deg, rgba(8,14,30,0.96), rgba(5,8,18,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: meta.glow,
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: meta.soft,
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#f8fbff",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              wordBreak: "break-word",
            }}
          >
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
              fontSize: 12,
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
            padding: "8px 11px",
            borderRadius: 999,
            background: meta.soft,
            border: "1px solid " + meta.line,
            color: meta.tone,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {meta.text}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
        <MetricTile label="Ping" value={fmtMs(item.ping)} bar={item.ping ?? 0} max={180} tone="#38bdf8" />
        <MetricTile label="Jitter" value={fmtMs(item.jitter)} bar={item.jitter ?? 0} max={60} tone="#8b5cf6" />
        <MetricTile label="Loss" value={fmtPct(item.packetLoss)} bar={item.packetLoss ?? 0} max={100} tone="#fb7185" />
        <MetricTile label="CPU" value={fmtPct(item.cpu)} bar={item.cpu ?? 0} max={100} tone="#2dd4bf" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Load
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: "#f8fbff" }}>
            {fmtPct(item.load)}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Uptime
          </div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 850, color: "#f8fbff", lineHeight: 1.35, wordBreak: "break-word" }}>
            {item.uptimeText}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopStat({ label, value, hint, accent }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(180deg, rgba(13,20,42,0.94), rgba(7,11,24,0.99))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: accent,
          filter: "blur(28px)",
          opacity: 0.45,
        }}
      />
      <div style={{ fontSize: 12, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 950, color: "#fbfdff", letterSpacing: "-0.05em" }}>{value}</div>
      <div style={{ fontSize: 13, color: "rgba(220,228,255,0.70)" }}>{hint}</div>
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
        setLastUpdated(new Date().toLocaleTimeString());
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

    return { total, up, degraded, down, avgPing };
  }, [rows]);

  const priority = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "24px 24px 40px",
        background:
          "radial-gradient(circle at top left, rgba(41,121,255,0.16) 0%, rgba(7,12,27,0) 28%), radial-gradient(circle at top right, rgba(0,220,180,0.12) 0%, rgba(7,12,27,0) 24%), linear-gradient(180deg, #030711 0%, #060c18 52%, #050812 100%)",
        color: "#eaf0ff",
      }}
    >
      <div style={{ maxWidth: 1840, margin: "0 auto", display: "grid", gap: 24 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            padding: "30px 30px 28px",
            background: "linear-gradient(135deg, rgba(8,15,34,0.98) 0%, rgba(5,9,21,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -140,
              right: -50,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(55,110,255,0.20) 0%, rgba(55,110,255,0) 66%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -170,
              left: -120,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,214,170,0.14) 0%, rgba(0,214,170,0) 66%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 980 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#7fe6ff",
                    background: "rgba(127,230,255,0.08)",
                    border: "1px solid rgba(127,230,255,0.2)",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#54d7ff",
                      boxShadow: "0 0 16px #54d7ff",
                    }}
                  />
                  NoComment NOC • Live MikroTik Fleet
                </div>

                <div
                  style={{
                    fontSize: "clamp(34px, 4.8vw, 68px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.065em",
                    fontWeight: 1000,
                    color: "#fbfdff",
                    marginBottom: 14,
                  }}
                >
                  MikroTik Uptime
                </div>

                <div
                  style={{
                    maxWidth: 880,
                    color: "rgba(221,228,255,0.76)",
                    fontSize: 15,
                    lineHeight: 1.75,
                  }}
                >
                  Rebuilt with stronger hierarchy, sharper contrast, premium density, and a more aggressive
                  modern NOC presentation focused on real live operational devices.
                </div>
              </div>

              <div style={{ minWidth: 260, display: "grid", gap: 12 }}>
                <div
                  style={{
                    borderRadius: 24,
                    padding: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(214,220,255,0.52)" }}>
                    Refresh
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 950, color: "#f8fbff" }}>Every 15 seconds</div>
                  <div style={{ fontSize: 13, color: "rgba(216,223,255,0.68)" }}>
                    Last update: {lastUpdated || "--"}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 24,
                    padding: 18,
                    background: error ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.12)",
                    border: error ? "1px solid rgba(244,63,94,0.28)" : "1px solid rgba(34,197,94,0.24)",
                    color: error ? "#ff9cae" : "#86efac",
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {error ? "API error: " + error : loading ? "Loading devices..." : "Feed connected and rendering live data"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              <TopStat label="Total Devices" value={String(stats.total)} hint="Visible after filtering excluded IPs" accent="rgba(69,144,255,0.42)" />
              <TopStat label="Operational" value={String(stats.up)} hint="Healthy devices with stable response" accent="rgba(34,197,94,0.42)" />
              <TopStat label="Degraded / Down" value={String(stats.degraded + stats.down)} hint="Needs attention first" accent="rgba(245,158,11,0.34)" />
              <TopStat label="Average Ping" value={stats.avgPing === null ? "--" : stats.avgPing + " ms"} hint="Computed from current live sample" accent="rgba(99,102,241,0.34)" />
            </div>
          </div>
        </div>

        {priority.length > 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0 4px",
              }}
            >
              <div>
                <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-0.04em", color: "#fbfdff" }}>
                  Top Priority Devices
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "rgba(217,224,255,0.64)" }}>
                  Featured devices ranked by current live operational quality.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                gap: 16,
              }}
            >
              {priority.map((item, index) => (
                <PriorityCard key={item.id} item={item} rank={index + 1} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ padding: "0 4px" }}>
            <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-0.04em", color: "#fbfdff" }}>
              Device Grid
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(217,224,255,0.64)" }}>
              Full fleet view with cleaner modern cards and stronger readability.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: 16,
            }}
          >
            {rest.map((item) => (
              <DeviceCard key={item.id} item={item} />
            ))}

            {!loading && rows.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderRadius: 26,
                  padding: 30,
                  textAlign: "center",
                  background: "linear-gradient(180deg, rgba(15,20,41,0.94), rgba(8,11,24,0.98))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(225,232,255,0.82)",
                  fontSize: 16,
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
