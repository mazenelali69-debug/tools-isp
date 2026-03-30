import { useEffect, useMemo, useState } from "react";

const EXCLUDED_IPS = new Set([
  "10.88.88.253",
  "10.88.88.252",
  "10.88.88.251",
  "88.88.88.49",
  "88.88.88.250",
]);

const REFRESH_MS = 15000;

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDevice(item, index) {
  const ip = String(item?.ip ?? item?.host ?? item?.address ?? "").trim();
  const name =
    String(item?.name ?? item?.label ?? item?.deviceName ?? "").trim() ||
    (ip ? "Device " + ip : "Device " + (index + 1));

  const ping =
    toNumber(item?.pingMs) ??
    toNumber(item?.ping) ??
    toNumber(item?.latency) ??
    toNumber(item?.avgPing);

  const jitter =
    toNumber(item?.jitterMs) ??
    toNumber(item?.jitter) ??
    toNumber(item?.avgJitter) ??
    0;

  const packetLoss =
    toNumber(item?.packetLoss) ??
    toNumber(item?.loss) ??
    toNumber(item?.lossPct) ??
    0;

  const cpu =
    toNumber(item?.cpu) ??
    toNumber(item?.cpuLoad) ??
    toNumber(item?.cpuUsage);

  const uptimeText =
    String(item?.uptime ?? item?.uptimeText ?? item?.humanUptime ?? item?.uptimeHuman ?? "").trim();

  const statusRaw = String(item?.status ?? "").trim().toUpperCase();
  let status = "UP";

  if (statusRaw === "DOWN" || statusRaw === "OFFLINE") {
    status = "DOWN";
  } else if (packetLoss >= 40 || (ping !== null && ping >= 140) || jitter >= 35) {
    status = "DEGRADED";
  } else if (statusRaw === "DEGRADED" || statusRaw === "WARN" || statusRaw === "WARNING") {
    status = "DEGRADED";
  } else if (ping === null && !uptimeText) {
    status = "UNKNOWN";
  }

  return {
    id: item?.id ?? ip ?? "dev-" + index,
    name,
    ip,
    ping,
    jitter,
    packetLoss,
    cpu,
    uptimeText: uptimeText || "No uptime data",
    status,
  };
}

function statusMeta(status) {
  switch (status) {
    case "UP":
      return {
        tone: "#23d18b",
        soft: "rgba(35, 209, 139, 0.16)",
        line: "rgba(35, 209, 139, 0.45)",
        glow: "0 0 0 1px rgba(35, 209, 139, 0.25), 0 18px 44px rgba(35, 209, 139, 0.12)",
        label: "Operational",
      };
    case "DEGRADED":
      return {
        tone: "#ffb84d",
        soft: "rgba(255, 184, 77, 0.16)",
        line: "rgba(255, 184, 77, 0.45)",
        glow: "0 0 0 1px rgba(255, 184, 77, 0.25), 0 18px 44px rgba(255, 184, 77, 0.12)",
        label: "Degraded",
      };
    case "DOWN":
      return {
        tone: "#ff5d73",
        soft: "rgba(255, 93, 115, 0.16)",
        line: "rgba(255, 93, 115, 0.45)",
        glow: "0 0 0 1px rgba(255, 93, 115, 0.25), 0 18px 44px rgba(255, 93, 115, 0.12)",
        label: "Offline",
      };
    default:
      return {
        tone: "#8f9bb3",
        soft: "rgba(143, 155, 179, 0.12)",
        line: "rgba(143, 155, 179, 0.28)",
        glow: "0 0 0 1px rgba(143, 155, 179, 0.18), 0 18px 44px rgba(8, 15, 34, 0.35)",
        label: "Unknown",
      };
  }
}

function fmtMs(value) {
  return value === null || value === undefined ? "--" : Math.round(value) + " ms";
}

function fmtPct(value) {
  return value === null || value === undefined ? "--" : Math.round(value) + "%";
}

function fmtCpu(value) {
  return value === null || value === undefined ? "--" : Math.round(value) + "%";
}

function rankValue(status) {
  if (status === "DOWN") return 0;
  if (status === "DEGRADED") return 1;
  if (status === "UNKNOWN") return 2;
  return 3;
}

function MiniBar({ value, max = 100, tone = "#59f" }) {
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.max(4, Math.min(100, (safe / max) * 100));

  return (
    <div
      style={{
        height: 8,
        width: "100%",
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg, " + tone + ", rgba(255,255,255,0.95))",
          boxShadow: "0 0 18px " + tone,
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}

function Metric({ label, value, tone, barValue, barMax }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(214,220,255,0.52)" }}>
          {label}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#f7f9ff" }}>{value}</div>
      </div>
      <MiniBar value={barValue} max={barMax} tone={tone} />
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
        background:
          "linear-gradient(180deg, rgba(13,19,41,0.94) 0%, rgba(8,12,27,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: meta.glow,
        display: "grid",
        gap: 16,
        minHeight: 255,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, " + meta.soft + " 0%, rgba(255,255,255,0) 42%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: meta.soft,
          filter: "blur(36px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#f8fbff",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                marginTop: 7,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                padding: "7px 10px",
                borderRadius: 999,
                color: "rgba(223,228,255,0.88)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
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
                  flex: "0 0 auto",
                }}
              />
              {item.ip || "No IP"}
            </div>
          </div>

          <div
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              padding: "9px 12px",
              background: meta.soft,
              border: "1px solid " + meta.line,
              color: meta.tone,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
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
            {meta.label}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <Metric label="Ping" value={fmtMs(item.ping)} tone="#57c7ff" barValue={item.ping ?? 0} barMax={180} />
          <Metric label="Jitter" value={fmtMs(item.jitter)} tone="#8d6bff" barValue={item.jitter ?? 0} barMax={60} />
          <Metric label="Loss" value={fmtPct(item.packetLoss)} tone="#ff6c92" barValue={item.packetLoss ?? 0} barMax={100} />
          <Metric label="CPU" value={fmtCpu(item.cpu)} tone="#4df0c8" barValue={item.cpu ?? 0} barMax={100} />
        </div>

        <div
          style={{
            padding: "14px 15px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.05)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(214,220,255,0.52)" }}>
            Uptime
          </div>
          <div
            style={{
              color: "#eef2ff",
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.35,
              wordBreak: "break-word",
            }}
          >
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
        background: "linear-gradient(180deg, rgba(17,24,50,0.92), rgba(10,14,30,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 18px 42px rgba(0,0,0,0.22)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(214,220,255,0.52)" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.05em", color: "#fbfdff" }}>{value}</div>
      <div style={{ fontSize: 13, color: "rgba(216,223,255,0.72)" }}>{hint}</div>
    </div>
  );
}

export default function MikroTikUptimePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (mounted) setError("");

        const response = await fetch("/api/mikrotik/uptime", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

        const normalized = list
          .map(normalizeDevice)
          .filter((item) => item.ip && !EXCLUDED_IPS.has(item.ip))
          .sort((a, b) => {
            const statusDiff = rankValue(b.status) - rankValue(a.status);
            if (statusDiff !== 0) return statusDiff;

            const pingA = a.ping ?? 999999;
            const pingB = b.ping ?? 999999;
            if (pingA !== pingB) return pingA - pingB;

            return a.name.localeCompare(b.name);
          });

        if (!mounted) return;

        setRows(normalized);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const up = rows.filter((x) => x.status === "UP").length;
    const degraded = rows.filter((x) => x.status === "DEGRADED").length;
    const down = rows.filter((x) => x.status === "DOWN").length;

    const avgPingSource = rows.map((x) => x.ping).filter((x) => x !== null && x !== undefined);
    const avgPing = avgPingSource.length
      ? Math.round(avgPingSource.reduce((sum, val) => sum + val, 0) / avgPingSource.length)
      : null;

    return {
      total: rows.length,
      up,
      degraded,
      down,
      avgPing,
    };
  }, [rows]);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "24px 24px 38px",
        background:
          "radial-gradient(circle at top left, rgba(43,124,255,0.16) 0%, rgba(8,13,31,0) 30%), radial-gradient(circle at top right, rgba(0,220,180,0.14) 0%, rgba(8,13,31,0) 28%), linear-gradient(180deg, #040812 0%, #070d1a 52%, #060910 100%)",
        color: "#eaf0ff",
      }}
    >
      <div
        style={{
          maxWidth: 1800,
          margin: "0 auto",
          display: "grid",
          gap: 24,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 30,
            padding: "28px 28px 26px",
            background:
              "linear-gradient(135deg, rgba(11,19,42,0.96) 0%, rgba(8,13,28,0.98) 60%, rgba(8,13,28,1) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -40,
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(72,125,255,0.22) 0%, rgba(72,125,255,0) 66%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -140,
              left: -80,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(24,222,178,0.16) 0%, rgba(24,222,178,0) 66%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 18,
              }}
            >
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

                <div
                  style={{
                    maxWidth: 820,
                    color: "rgba(221,228,255,0.76)",
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  Fully rebuilt modern NOC view with stronger card hierarchy, cleaner density,
                  sharper visual contrast, and live operational metrics for every active device.
                </div>
              </div>

              <div
                style={{
                  minWidth: 260,
                  display: "grid",
                  gap: 12,
                }}
              >
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
                    background: error
                      ? "rgba(255,93,115,0.1)"
                      : "rgba(35,209,139,0.08)",
                    border: error
                      ? "1px solid rgba(255,93,115,0.28)"
                      : "1px solid rgba(35,209,139,0.22)",
                    color: error ? "#ff8ea0" : "#7ef0b6",
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
              <TopStat label="Average Ping" value={stats.avgPing === null ? "--" : stats.avgPing + " ms"} hint="Computed from current device sample" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
                padding: 32,
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
