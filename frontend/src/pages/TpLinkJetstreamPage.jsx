import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_URL = "/api/tplink/jetstream/devices";
const REFRESH_MS = 30000;
const LIVE_TICK_MS = 1000;
const HISTORY_LIMIT = 60;

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value || 0), min), max);
}

function formatMbps(value) {
  return `${Number(value || 0).toFixed(2)} Mbps`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatCompactUptime(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatUptime(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function uptimeTone(seconds) {
  const days = Number(seconds || 0) / 86400;
  if (days >= 30) return { color: "#22c55e", label: "stable" };
  if (days >= 7) return { color: "#38bdf8", label: "healthy" };
  if (days >= 1) return { color: "#f59e0b", label: "recent reboot" };
  return { color: "#ef4444", label: "fresh boot" };
}

function usageTone(value) {
  const v = Number(value || 0);
  if (v >= 85) return { color: "#ff5d73", glow: "rgba(255,93,115,0.35)" };
  if (v >= 60) return { color: "#f59e0b", glow: "rgba(245,158,11,0.35)" };
  return { color: "#22c55e", glow: "rgba(34,197,94,0.35)" };
}

function statusTone(status) {
  return String(status || "").toUpperCase() === "UP"
    ? { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.32)" }
    : { color: "#ff5d73", bg: "rgba(255,93,115,0.12)", border: "rgba(255,93,115,0.32)" };
}

function Gauge({ label, percent, speedText, tone }) {
  const p = clamp(percent, 0, 100);

  return (
    <div style={styles.gaugeCard}>
      <div style={styles.gaugeHeader}>
        <div style={styles.gaugeLabel}>{label}</div>
        <div style={{ ...styles.gaugePercent, color: tone.color }}>{formatPercent(p)}</div>
      </div>

      <div style={styles.gaugeTrack}>
        <div
          style={{
            ...styles.gaugeFill,
            width: `${p}%`,
            background: tone.color,
            boxShadow: `0 0 18px ${tone.glow}`,
          }}
        />
      </div>

      <div style={styles.gaugeSub}>{speedText}</div>
    </div>
  );
}

function UptimeRing({ seconds }) {
  const tone = uptimeTone(seconds);
  const progress = clamp((Number(seconds || 0) / 86400 / 30) * 100, 0, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div style={styles.ringWrap}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="11"
          fill="none"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke={tone.color}
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 75 75)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>

      <div style={styles.ringCenter}>
        <div style={styles.ringTitle}>UPTIME</div>
        <div style={styles.ringMain}>{formatCompactUptime(seconds)}</div>
        <div style={{ ...styles.ringSub, color: tone.color }}>{tone.label}</div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const rx = payload.find((x) => x.dataKey === "rx");
  const tx = payload.find((x) => x.dataKey === "tx");

  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipTime}>{label}</div>
      <div style={styles.tooltipRow}>
        <span style={{ ...styles.tooltipDot, background: "#60a5fa" }} />
        <span>RX</span>
        <strong>{formatMbps(rx?.value || 0)}</strong>
      </div>
      <div style={styles.tooltipRow}>
        <span style={{ ...styles.tooltipDot, background: "#22c55e" }} />
        <span>TX</span>
        <strong>{formatMbps(tx?.value || 0)}</strong>
      </div>
      <div style={styles.tooltipRow}>
        <span style={{ ...styles.tooltipDot, background: "#f59e0b" }} />
        <span>Total</span>
        <strong>{formatMbps((rx?.value || 0) + (tx?.value || 0))}</strong>
      </div>
    </div>
  );
}

function DeviceTrafficChart({ points }) {
  const chartData = (points || []).map((p) => ({
    t: p.t,
    rx: Number(p.rx || 0),
    tx: Number(p.tx || 0),
    total: Number((Number(p.rx || 0) + Number(p.tx || 0)).toFixed(2)),
  }));

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div style={styles.chartTitle}>LIVE TRAFFIC</div>
        <div style={styles.chartLegend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#60a5fa" }} />
            RX
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#22c55e" }} />
            TX
          </span>
        </div>
      </div>

      <div style={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "#7c95ad", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="rx" stroke="#60a5fa" strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="tx" stroke="#22c55e" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeviceCard({ device, history }) {
  const rxTone = usageTone(device.rxUsage);
  const txTone = usageTone(device.txUsage);
  const stat = statusTone(device.status);

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.deviceName}>{device.name || device.ip}</div>
          <div style={styles.deviceIp}>{device.ip}</div>
        </div>

        <div
          style={{
            ...styles.statusBadge,
            color: stat.color,
            background: stat.bg,
            borderColor: stat.border,
          }}
        >
          {device.status || "UNKNOWN"}
        </div>
      </div>

      <div style={styles.metaGrid}>
        <div style={styles.metaBox}>
          <div style={styles.metaLabel}>AUTO UPLINK</div>
          <div style={styles.metaValue}>{device.uplinkInterface || "Unavailable"}</div>
          <div style={styles.metaSub}>IDX {device.uplinkIndex ?? "-"}</div>
        </div>

        <div style={styles.metaBox}>
          <div style={styles.metaLabel}>ALIAS</div>
          <div style={styles.metaValue}>{device.uplinkAlias || "—"}</div>
          <div style={styles.metaSub}>selected best link</div>
        </div>

        <div style={styles.metaBox}>
          <div style={styles.metaLabel}>LINK SPEED</div>
          <div style={styles.metaValue}>{device.speedMb ? `${device.speedMb} Mbps` : "N/A"}</div>
          <div style={styles.metaSub}>from SNMP</div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.uptimePanel}>
          <UptimeRing seconds={device.liveUptime} />
          <div style={styles.uptimeText}>{formatUptime(device.liveUptime)}</div>
        </div>

        <div style={styles.metricsPanel}>
          <div style={styles.gaugesGrid}>
            <Gauge
              label="RX Usage"
              percent={device.rxUsage}
              speedText={formatMbps(device.rxMbps)}
              tone={rxTone}
            />
            <Gauge
              label="TX Usage"
              percent={device.txUsage}
              speedText={formatMbps(device.txMbps)}
              tone={txTone}
            />
          </div>

          <div style={styles.liveGrid}>
            <div style={styles.liveBox}>
              <div style={styles.liveLabel}>LIVE RX</div>
              <div style={styles.liveValue}>{formatMbps(device.rxMbps)}</div>
            </div>
            <div style={styles.liveBox}>
              <div style={styles.liveLabel}>LIVE TX</div>
              <div style={styles.liveValue}>{formatMbps(device.txMbps)}</div>
            </div>
          </div>

          <DeviceTrafficChart points={history} />
        </div>
      </div>

      {device.error ? <div style={styles.errorText}>{device.error}</div> : null}
    </div>
  );
}

export default function TpLinkJetstreamPage() {
  const [data, setData] = useState({
    ok: true,
    deviceCount: 0,
    online: 0,
    offline: 0,
    totalTrafficMbps: 0,
    devices: [],
  });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [histories, setHistories] = useState({});
  const historiesRef = useRef({});

  async function loadData() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();

      const nextHistory = { ...historiesRef.current };
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      (json.devices || []).forEach((device) => {
        const ip = device.ip;
        const arr = Array.isArray(nextHistory[ip]) ? [...nextHistory[ip]] : [];
        arr.push({
          t: timeLabel,
          rx: Number(device.rxMbps || 0),
          tx: Number(device.txMbps || 0),
        });
        while (arr.length > HISTORY_LIMIT) arr.shift();
        nextHistory[ip] = arr;
      });

      historiesRef.current = nextHistory;
      setHistories(nextHistory);
      setData(json);
    } catch (error) {
      console.error("TP-Link JetStream load failed:", error);
      setData((prev) => ({ ...prev, ok: false }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const refreshId = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, LIVE_TICK_MS);
    return () => clearInterval(tickId);
  }, []);

  const devices = useMemo(() => {
    return (data.devices || []).map((device) => ({
      ...device,
      liveUptime: Number(device.uptimeSeconds || 0) + tick,
    }));
  }, [data.devices, tick]);

  return (
    <div style={styles.page}>
      <div style={styles.bgLayerA} />
      <div style={styles.bgLayerB} />

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>TP-LINK JETSTREAM</div>
          <h1 style={styles.title}>Uplink Traffic Monitor</h1>
          <div style={styles.subtitle}>
            Real SNMP uptime, real RX/TX, smart uplink auto-detection, rebuilt NOC layout.
          </div>
        </div>

        <div style={styles.refreshBadge}>
          {loading ? "Loading..." : `Refresh ${REFRESH_MS / 1000}s`}
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Devices</div>
          <div style={styles.summaryValue}>{data.deviceCount || devices.length}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Online</div>
          <div style={{ ...styles.summaryValue, color: "#22c55e" }}>{data.online || 0}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Offline</div>
          <div style={{ ...styles.summaryValue, color: "#ff5d73" }}>{data.offline || 0}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Traffic</div>
          <div style={styles.summaryValue}>{formatMbps(data.totalTrafficMbps || 0)}</div>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        {devices.map((device) => (
          <DeviceCard
            key={device.ip}
            device={device}
            history={histories[device.ip] || []}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100%",
    padding: "24px",
    color: "#e8f2ff",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 24%), radial-gradient(circle at top right, rgba(34,197,94,0.10), transparent 18%), linear-gradient(180deg, #071019 0%, #08111d 48%, #091420 100%)",
  },
  bgLayerA: {
    position: "absolute",
    inset: "-10% auto auto -10%",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)",
    pointerEvents: "none",
    filter: "blur(8px)",
  },
  bgLayerB: {
    position: "absolute",
    inset: "auto -8% -8% auto",
    width: "460px",
    height: "460px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%)",
    pointerEvents: "none",
    filter: "blur(10px)",
  },
  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.24em",
    color: "#6ee7b7",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.04,
    color: "#f8fbff",
  },
  subtitle: {
    marginTop: "10px",
    color: "#8aa2ba",
    fontSize: "14px",
    maxWidth: "760px",
  },
  refreshBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    fontSize: "12px",
    fontWeight: 800,
    color: "#d6e4f3",
  },
  summaryGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  summaryCard: {
    borderRadius: "20px",
    padding: "16px 18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  },
  summaryLabel: {
    color: "#8ca4bc",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.10em",
  },
  summaryValue: {
    marginTop: "8px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#f8fbff",
  },
  cardsGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(560px, 1fr))",
    gap: "18px",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "28px",
    padding: "20px",
    background: "linear-gradient(180deg, rgba(8,17,29,0.96), rgba(8,17,29,0.90))",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 22px 50px rgba(0,0,0,0.34)",
  },
  cardTop: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  deviceName: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#f9fbff",
    lineHeight: 1.1,
  },
  deviceIp: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#8ca6bf",
  },
  statusBadge: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.2fr 0.9fr",
    gap: "12px",
    marginBottom: "16px",
  },
  metaBox: {
    borderRadius: "18px",
    padding: "14px 15px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  metaLabel: {
    fontSize: "11px",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#8aa3ba",
    marginBottom: "6px",
  },
  metaValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#eef5fc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metaSub: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#7691aa",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    gap: "16px",
    alignItems: "stretch",
  },
  uptimePanel: {
    borderRadius: "22px",
    padding: "16px 14px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrap: {
    position: "relative",
    width: "150px",
    height: "150px",
  },
  ringCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ringTitle: {
    fontSize: "10px",
    color: "#89a4bc",
    letterSpacing: "0.14em",
    marginBottom: "3px",
  },
  ringMain: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#f7fbff",
  },
  ringSub: {
    marginTop: "3px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  uptimeText: {
    marginTop: "12px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#dce8f4",
    textAlign: "center",
  },
  metricsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  gaugesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  gaugeCard: {
    borderRadius: "18px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  gaugeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  gaugeLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#e0ebf7",
  },
  gaugePercent: {
    fontSize: "14px",
    fontWeight: 800,
  },
  gaugeTrack: {
    height: "12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.8s ease",
  },
  gaugeSub: {
    marginTop: "9px",
    fontSize: "12px",
    color: "#8da6be",
  },
  liveGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  liveBox: {
    borderRadius: "18px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  liveLabel: {
    fontSize: "11px",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#8ba3bb",
    marginBottom: "8px",
  },
  liveValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#f8fbff",
  },
  chartCard: {
    borderRadius: "20px",
    padding: "14px 16px 10px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  chartTitle: {
    fontSize: "11px",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#8ba3bb",
  },
  chartLegend: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#a6bdd4",
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    display: "inline-block",
  },
  chartWrap: {
    width: "100%",
    height: "165px",
  },
  tooltip: {
    borderRadius: "14px",
    padding: "10px 12px",
    background: "rgba(10,18,30,0.96)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 16px 32px rgba(0,0,0,0.34)",
    color: "#eef6ff",
  },
  tooltipTime: {
    fontSize: "12px",
    marginBottom: "8px",
    color: "#8ca8c0",
  },
  tooltipRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "space-between",
    minWidth: "170px",
    fontSize: "12px",
    marginTop: "5px",
  },
  tooltipDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    display: "inline-block",
  },
  errorText: {
    marginTop: "12px",
    color: "#fda4af",
    fontSize: "12px",
  },
};
