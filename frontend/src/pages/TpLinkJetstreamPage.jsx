import { useEffect, useMemo, useState } from "react";

const REFRESH_MS = 30000;
const RING_SIZE = 120;
const RING_RADIUS = 46;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

function formatUptime(sec) {
  const total = Math.max(0, Number(sec || 0));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatShortUptime(sec) {
  const total = Math.max(0, Number(sec || 0));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function ringProgressFromUptime(sec) {
  const days = Number(sec || 0) / 86400;
  return clamp((days / 30) * 100, 0, 100);
}

function uptimeTone(sec) {
  const days = Number(sec || 0) / 86400;
  if (days >= 7) return { label: "stable", color: "#22c55e" };
  if (days >= 1) return { label: "recent reboot", color: "#f59e0b" };
  return { label: "fresh boot", color: "#ef4444" };
}

function Gauge({ label, value, subValue }) {
  const v = clamp(Number(value || 0), 0, 100);
  return (
    <div style={styles.gaugeBox}>
      <div style={styles.gaugeTop}>
        <span style={styles.gaugeLabel}>{label}</span>
        <span style={styles.gaugeValue}>{v.toFixed(1)}%</span>
      </div>
      <div style={styles.gaugeTrack}>
        <div style={{ ...styles.gaugeFill, width: `${v}%` }} />
      </div>
      <div style={styles.gaugeSub}>{subValue}</div>
    </div>
  );
}

function UptimeRing({ seconds }) {
  const progress = ringProgressFromUptime(seconds);
  const tone = uptimeTone(seconds);
  const offset = RING_CIRC - (RING_CIRC * progress) / 100;

  return (
    <div style={styles.ringWrap}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 120 120" style={styles.ringSvg}>
        <circle cx="60" cy="60" r={RING_RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          stroke={tone.color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div style={styles.ringCenter}>
        <div style={styles.ringTitle}>UPTIME</div>
        <div style={styles.ringMain}>{formatShortUptime(seconds)}</div>
        <div style={{ ...styles.ringSub, color: tone.color }}>{tone.label}</div>
      </div>
    </div>
  );
}

function DeviceCard({ device, liveUptime }) {
  const statusColor = device.status === "UP" ? "#22c55e" : "#ef4444";

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.deviceName}>{device.name || device.ip}</div>
          <div style={styles.deviceIp}>{device.ip}</div>
        </div>

        <div style={{ ...styles.statusBadge, borderColor: `${statusColor}55`, color: statusColor }}>
          {device.status || "UNKNOWN"}
        </div>
      </div>

      <div style={styles.uplinkRow}>
        <div style={styles.infoTile}>
          <div style={styles.infoLabel}>AUTO UPLINK</div>
          <div style={styles.infoValue}>{device.uplinkInterface || "Unavailable"}</div>
        </div>
        <div style={styles.infoTile}>
          <div style={styles.infoLabel}>LINK SPEED</div>
          <div style={styles.infoValue}>{device.speedMb ? `${device.speedMb} Mbps` : "N/A"}</div>
        </div>
      </div>

      <div style={styles.middleGrid}>
        <div style={styles.uptimePanel}>
          <UptimeRing seconds={liveUptime} />
          <div style={styles.liveCounter}>{formatUptime(liveUptime)}</div>
        </div>

        <div style={styles.metricsPanel}>
          <Gauge label="RX Usage" value={device.rxUsage} subValue={`${Number(device.rxMbps || 0).toFixed(2)} Mbps`} />
          <Gauge label="TX Usage" value={device.txUsage} subValue={`${Number(device.txMbps || 0).toFixed(2)} Mbps`} />

          <div style={styles.trafficGrid}>
            <div style={styles.trafficBox}>
              <div style={styles.trafficLabel}>LIVE RX</div>
              <div style={styles.trafficValue}>{Number(device.rxMbps || 0).toFixed(2)} Mbps</div>
            </div>
            <div style={styles.trafficBox}>
              <div style={styles.trafficLabel}>LIVE TX</div>
              <div style={styles.trafficValue}>{Number(device.txMbps || 0).toFixed(2)} Mbps</div>
            </div>
            <div style={styles.trafficBoxWide}>
              <div style={styles.trafficLabel}>TOTAL TRAFFIC</div>
              <div style={styles.trafficValue}>{Number(device.totalMbps || 0).toFixed(2)} Mbps</div>
            </div>
          </div>
        </div>
      </div>

      {device.error ? <div style={styles.errorText}>{device.error}</div> : null}
    </div>
  );
}

export default function TpLinkJetstreamPage() {
  const [data, setData] = useState({
    ok: true,
    devices: [],
    online: 0,
    offline: 0,
    totalTrafficMbps: 0
  });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/tplink/jetstream/devices", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData((prev) => ({
        ...prev,
        ok: false,
        devices: (prev.devices || []).map((x) => ({
          ...x,
          status: "DOWN",
          error: "Failed to load API"
        }))
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    const sec = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(sec);
  }, []);

  const devices = useMemo(() => {
    return (data.devices || []).map((device) => ({
      ...device,
      liveUptime: Math.max(0, Number(device.uptimeSeconds || 0) + tick)
    }));
  }, [data.devices, tick]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>TP-LINK JETSTREAM</div>
          <h1 style={styles.title}>JetStream Uplink Monitor</h1>
          <div style={styles.subtitle}>
            Smart SNMP uplink auto-detection • realtime uptime ring • live RX/TX usage
          </div>
        </div>

        <div style={styles.refreshBadge}>
          {loading ? "Loading..." : `Refresh ${REFRESH_MS / 1000}s`}
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Devices</div>
          <div style={styles.summaryValue}>{data.deviceCount ?? devices.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Online</div>
          <div style={styles.summaryValue}>{data.online ?? 0}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Offline</div>
          <div style={styles.summaryValue}>{data.offline ?? 0}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Traffic</div>
          <div style={styles.summaryValue}>{Number(data.totalTrafficMbps || 0).toFixed(2)} Mbps</div>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        {devices.map((device) => (
          <DeviceCard key={device.ip} device={device} liveUptime={device.liveUptime} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    padding: "24px",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 26%), radial-gradient(circle at top right, rgba(34,197,94,0.10), transparent 18%), #071019",
    color: "#e5eef8"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  eyebrow: {
    fontSize: "12px",
    letterSpacing: "0.24em",
    color: "#6ee7b7",
    marginBottom: "8px",
    fontWeight: 700
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    color: "#f8fbff"
  },
  subtitle: {
    marginTop: "10px",
    color: "#8fa6bd",
    fontSize: "14px"
  },
  refreshBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#c9d8e6",
    fontSize: "13px",
    fontWeight: 700
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px"
  },
  summaryCard: {
    borderRadius: "18px",
    padding: "16px 18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.24)"
  },
  summaryLabel: {
    color: "#8ba2b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.10em"
  },
  summaryValue: {
    marginTop: "8px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#f8fbff"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(560px, 1fr))",
    gap: "18px"
  },
  card: {
    borderRadius: "24px",
    padding: "20px",
    background: "linear-gradient(180deg, rgba(8,17,29,0.94), rgba(8,17,29,0.88))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px"
  },
  deviceName: {
    fontSize: "21px",
    fontWeight: 800,
    color: "#f7fbff"
  },
  deviceIp: {
    marginTop: "4px",
    color: "#87a0b7",
    fontSize: "13px"
  },
  statusBadge: {
    border: "1px solid rgba(255,255,255,0.16)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    background: "rgba(255,255,255,0.03)"
  },
  uplinkRow: {
    display: "grid",
    gridTemplateColumns: "1.7fr 1fr",
    gap: "12px",
    marginBottom: "18px"
  },
  infoTile: {
    borderRadius: "16px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  infoLabel: {
    color: "#88a0b7",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.10em",
    marginBottom: "7px"
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#edf5fd"
  },
  middleGrid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "16px",
    alignItems: "stretch"
  },
  uptimePanel: {
    borderRadius: "20px",
    padding: "18px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  ringWrap: {
    position: "relative",
    width: `${RING_SIZE}px`,
    height: `${RING_SIZE}px`
  },
  ringSvg: {
    display: "block"
  },
  ringCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  ringTitle: {
    fontSize: "11px",
    letterSpacing: "0.12em",
    color: "#83a1ba",
    marginBottom: "4px"
  },
  ringMain: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#f7fbff"
  },
  ringSub: {
    marginTop: "2px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  liveCounter: {
    marginTop: "12px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#dce8f3",
    textAlign: "center"
  },
  metricsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  gaugeBox: {
    borderRadius: "16px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  gaugeTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "10px"
  },
  gaugeLabel: {
    color: "#d6e2ee",
    fontSize: "13px",
    fontWeight: 700
  },
  gaugeValue: {
    color: "#f8fbff",
    fontSize: "14px",
    fontWeight: 800
  },
  gaugeTrack: {
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  gaugeFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #22c55e, #38bdf8, #60a5fa)"
  },
  gaugeSub: {
    marginTop: "9px",
    color: "#89a2b9",
    fontSize: "12px"
  },
  trafficGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  trafficBox: {
    borderRadius: "16px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  trafficBoxWide: {
    gridColumn: "1 / span 2",
    borderRadius: "16px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  trafficLabel: {
    color: "#8ca5bd",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.10em",
    marginBottom: "8px"
  },
  trafficValue: {
    color: "#f8fbff",
    fontSize: "20px",
    fontWeight: 800
  },
  errorText: {
    marginTop: "12px",
    color: "#fca5a5",
    fontSize: "12px"
  }
};
