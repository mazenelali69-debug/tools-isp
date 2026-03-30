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
  };
}

function statusMeta(status) {
  switch (status) {
    case "UP":
      return {
        tone: "#22c55e",
        soft: "rgba(34,197,94,0.12)",
        border: "rgba(34,197,94,0.28)",
        text: "Operational",
      };
    case "DEGRADED":
      return {
        tone: "#f59e0b",
        soft: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.28)",
        text: "Degraded",
      };
    case "DOWN":
      return {
        tone: "#f43f5e",
        soft: "rgba(244,63,94,0.12)",
        border: "rgba(244,63,94,0.28)",
        text: "Offline",
      };
    default:
      return {
        tone: "#94a3b8",
        soft: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.24)",
        text: "Unknown",
      };
  }
}

function fmtMs(v) {
  return v === null || v === undefined ? "--" : Math.round(v) + " ms";
}
function fmtPct(v) {
  return v === null || v === undefined ? "--" : Math.round(v) + "%";
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
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg, " + tone + ", rgba(255,255,255,0.95))",
          boxShadow: "0 0 18px " + tone,
        }}
      />
    </div>
  );
}

function Metric({ label, value, bar, max, tone }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, color: "rgba(220,228,255,0.58)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fbff" }}>{value}</div>
      </div>
      <MiniBar value={bar} max={max} tone={tone} />
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
        background: "linear-gradient(180deg, rgba(10,16,34,0.96), rgba(5,9,20,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.25)",
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
              fontSize: 19,
              fontWeight: 900,
              color: "#f8fbff",
              lineHeight: 1.15,
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
            border: "1px solid " + meta.border,
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
        <Metric label="Ping" value={fmtMs(item.ping)} bar={item.ping ?? 0} max={180} tone="#38bdf8" />
        <Metric label="Jitter" value={fmtMs(item.jitter)} bar={item.jitter ?? 0} max={60} tone="#8b5cf6" />
        <Metric label="Loss" value={fmtPct(item.packetLoss)} bar={item.packetLoss ?? 0} max={100} tone="#fb7185" />
        <Metric label="CPU" value={fmtPct(item.cpu)} bar={item.cpu ?? 0} max={100} tone="#2dd4bf" />
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
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.58)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Load
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800, color: "#f8fbff" }}>
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
          <div style={{ fontSize: 11, color: "rgba(220,228,255,0.58)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Uptime
          </div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: "#f8fbff", lineHeight: 1.35, wordBreak: "break-word" }}>
            {item.uptimeText}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopStat({ label, value, hint }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 18,
        background: "linear-gradient(180deg, rgba(15,22,44,0.92), rgba(8,12,26,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, color: "rgba(220,228,255,0.56)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, color: "#fbfdff", letterSpacing: "-0.05em" }}>{value}</div>
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
          .sort((a, b) => {
            const order = { DOWN: 0, DEGRADED: 1, UNKNOWN: 2, UP: 3 };
            const diff = (order[b.status] ?? 0) - (order[a.status] ?? 0);
            if (diff !== 0) return diff;
            return String(a.name).localeCompare(String(b.name));
          });

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

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "24px 24px 38px",
        background:
          "radial-gradient(circle at top left, rgba(51,126,255,0.16) 0%, rgba(8,13,31,0) 30%), radial-gradient(circle at top right, rgba(0,220,180,0.14) 0%, rgba(8,13,31,0) 28%), linear-gradient(180deg, #040812 0%, #070d1a 52%, #060910 100%)",
        color: "#eaf0ff",
      }}
    >
      <div style={{ maxWidth: 1800, margin: "0 auto", display: "grid", gap: 24 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 30,
            padding: "28px 28px 26px",
            background: "linear-gradient(135deg, rgba(10,18,40,0.96) 0%, rgba(7,12,26,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ display: "grid", gap: 22 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 18 }}>
              <div style={{ minWidth: 280 }}>
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
                    marginBottom: 14,
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
                  Live MikroTik Fleet
                </div>

                <div
                  style={{
                    fontSize: "clamp(30px, 4vw, 56px)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.06em",
                    fontWeight: 950,
                    color: "#fbfdff",
                    marginBottom: 12,
                  }}
                >
                  MikroTik Uptime
                </div>

                <div style={{ maxWidth: 860, color: "rgba(221,228,255,0.76)", fontSize: 15, lineHeight: 1.7 }}>
                  Modern rebuilt NOC page with live device cards, stronger hierarchy, tighter spacing,
                  and cleaner operational focus.
                </div>
              </div>

              <div style={{ minWidth: 260, display: "grid", gap: 12 }}>
                <div
                  style={{
                    borderRadius: 22,
                    padding: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(214,220,255,0.52)" }}>
                    Refresh
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fbff" }}>Every 15 seconds</div>
                  <div style={{ fontSize: 13, color: "rgba(216,223,255,0.68)" }}>
                    Last update: {lastUpdated || "--"}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 22,
                    padding: 16,
                    background: error ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.12)",
                    border: error ? "1px solid rgba(244,63,94,0.28)" : "1px solid rgba(34,197,94,0.24)",
                    color: error ? "#ff9cae" : "#86efac",
                    fontWeight: 800,
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <TopStat label="Total Devices" value={String(stats.total)} hint="Visible after filtering excluded IPs" />
              <TopStat label="Operational" value={String(stats.up)} hint="Healthy devices with stable response" />
              <TopStat label="Degraded / Down" value={String(stats.degraded + stats.down)} hint="Needs attention first" />
              <TopStat label="Average Ping" value={stats.avgPing === null ? "--" : stats.avgPing + " ms"} hint="Computed from current live sample" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 16,
          }}
        >
          {rows.map((item) => (
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
  );
}
