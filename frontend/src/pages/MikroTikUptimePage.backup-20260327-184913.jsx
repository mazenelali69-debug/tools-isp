import { useEffect, useMemo, useState } from "react";

function fmt(v, suffix = "") {
  return v == null || Number.isNaN(Number(v)) ? "--" : `${Number(v).toFixed(1)}${suffix}`;
}

function fmtWhole(v, suffix = "") {
  return v == null || Number.isNaN(Number(v)) ? "--" : `${Math.round(Number(v))}${suffix}`;
}

function gaugeColor(v) {
  const n = Number(v || 0);
  if (n >= 80) return "#6cff7e";
  if (n >= 60) return "#cce85f";
  if (n >= 40) return "#ffbe55";
  return "#ff6672";
}

function arcPath(value, radius = 60) {
  const clamped = Math.max(0, Math.min(100, Number(value || 0)));
  const start = 180;
  const end = 180 + (clamped / 100) * 180;
  const cx = 90;
  const cy = 90;

  const polar = (a) => {
    const rad = (a - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const s = polar(start);
  const e = polar(end);
  const large = end - start > 180 ? 1 : 0;

  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
}

function Gauge({ title, value, subtitle }) {
  const c = gaugeColor(value);
  return (
    <div style={styles.gaugeCard}>
      <svg viewBox="0 0 180 112" style={styles.gaugeSvg}>
        <path d="M 30 90 A 60 60 0 0 1 150 90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
        <path d={arcPath(value)} fill="none" stroke={c} strokeWidth="16" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${c})` }} />
        <text x="90" y="70" textAnchor="middle" style={styles.gaugeTitle}>{title}</text>
        <text x="90" y="97" textAnchor="middle" style={styles.gaugeValue}>{fmtWhole(value, "%")}</text>
      </svg>
      <div style={styles.gaugeSub}>{subtitle}</div>
    </div>
  );
}

function UsageBar({ label, value }) {
  const n = Math.max(0, Math.min(100, Number(value || 0)));
  const color = gaugeColor(n);
  return (
    <div style={styles.usageRow}>
      <div style={styles.usageLabel}>{label}</div>
      <div style={styles.usageTrack}>
        <div style={{ ...styles.usageFill, width: `${n}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <div style={styles.usagePct}>{fmtWhole(n, "%")}</div>
    </div>
  );
}

function TopCard({ item }) {
  return (
    <div style={styles.topCard}>
      <div style={styles.topHead}>
        <div>
          <div style={styles.topTitle}>{item.name}</div>
          <div style={styles.topSub}>{item.ip}</div>
        </div>
        <div style={{ ...styles.topState, color: item.status === "UP" ? "#6cff7e" : "#ff6672" }}>{item.status}</div>
      </div>

      <div style={styles.topMetricRow}>
        <div style={styles.topMetric}>
          <div style={styles.topMetricLabel}>Ping</div>
          <div style={styles.topMetricValue}>{fmt(item.pingMs, " ms")}</div>
        </div>
        <div style={styles.topMetric}>
          <div style={styles.topMetricLabel}>Jitter</div>
          <div style={styles.topMetricValue}>{fmt(item.jitterMs, " ms")}</div>
        </div>
        <div style={styles.topMetric}>
          <div style={styles.topMetricLabel}>Loss</div>
          <div style={styles.topMetricValue}>{fmtWhole(item.packetLossPct, "%")}</div>
        </div>
      </div>

      <UsageBar label="health" value={item.health} />
    </div>
  );
}

function DeviceCard({ item }) {
  const hasCpu = item.cpu != null;
  const load = hasCpu ? Math.min(100, Math.round(item.cpu * 1.9)) : item.health;

  return (
    <div style={styles.deviceCard}>
      <div style={styles.deviceHead}>
        <div>
          <div style={styles.deviceName}>{item.name}</div>
          <div style={styles.deviceIp}>{item.ip}</div>
        </div>
        <div style={{ ...styles.deviceStatus, color: item.status === "UP" ? "#6cff7e" : "#ff6672" }}>
          {item.status}
        </div>
      </div>

      <div style={styles.deviceBody}>
        <div style={styles.leftCol}>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Uptime</span><span style={styles.metaValue}>{item.uptime || "N/A"}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Ping</span><span style={styles.metaValue}>{fmt(item.pingMs, " ms")}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Jitter</span><span style={styles.metaValue}>{fmt(item.jitterMs, " ms")}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Loss</span><span style={styles.metaValue}>{fmtWhole(item.packetLossPct, "%")}</span></div>

          <div style={styles.barsWrap}>
            <UsageBar label="Health" value={item.health} />
            <UsageBar label="CPU" value={hasCpu ? item.cpu : 0} />
            <UsageBar label="Load" value={load} />
          </div>
        </div>

        <div style={styles.rightCol}>
          <Gauge title="Health" value={item.health} subtitle="status quality" />
          <Gauge title={hasCpu ? "CPU" : "Signal"} value={hasCpu ? item.cpu : item.health} subtitle={hasCpu ? "processor load" : "fallback view"} />
        </div>
      </div>
    </div>
  );
}

export default function MikroTikUptimePage() {
  const [services, setServices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/mikrotik/uptime", { cache: "no-store" });
      const js = await res.json();
      if (!res.ok || !js?.ok) throw new Error(js?.error || "Failed to load dashboard");

      const sortedDevices = Array.isArray(js.devices) ? [...js.devices].sort((a, b) => {
        if (a.top && !b.top) return -1;
        if (!a.top && b.top) return 1;
        if (a.name === "AviatLink") return -1;
        if (b.name === "AviatLink") return 1;
        return 0;
      }) : [];

      setServices(Array.isArray(js.services) ? js.services : []);
      setDevices(sortedDevices);
      setLastUpdate(new Date().toLocaleTimeString());
      setErrorText("");
    } catch (e) {
      setServices([]);
      setDevices([]);
      setErrorText(e?.message || "Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const totals = useMemo(() => {
    const all = [...services, ...devices];
    return {
      total: all.length,
      up: all.filter(x => x.status === "UP").length,
      down: all.filter(x => x.status !== "UP").length
    };
  }, [services, devices]);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>MikroTik uptime view</div>
          <div style={styles.heroTitle}>MikroTik NOC Dashboard</div>
          <div style={styles.heroSub}>Real uptime + CPU + service health · Last update: {lastUpdate || "-"}</div>
        </div>

        <div style={styles.heroStats}>
          <div style={styles.statBox}><div style={styles.statLabel}>TOTAL</div><div style={styles.statValue}>{totals.total}</div></div>
          <div style={styles.statBox}><div style={styles.statLabel}>UP</div><div style={{ ...styles.statValue, color: "#6cff7e" }}>{totals.up}</div></div>
          <div style={styles.statBox}><div style={styles.statLabel}>DOWN</div><div style={{ ...styles.statValue, color: "#ff6672" }}>{totals.down}</div></div>
        </div>
      </div>

      {errorText ? <div style={styles.errorBox}>{errorText}</div> : null}

      <div style={styles.topGrid}>
        {services.map((item) => <TopCard key={item.name} item={item} />)}
      </div>

      <div style={styles.deviceGrid}>
        {devices.map((item) => <DeviceCard key={`${item.name}-${item.ip}`} item={item} />)}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 14,
    color: "#ecffff",
    minHeight: "100%",
    background: "linear-gradient(180deg, rgba(3,11,18,0.18), rgba(2,8,15,0))"
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 10
  },

  eyebrow: {
    fontSize: 11,
    color: "#66deff",
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    marginBottom: 5
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.1,
    color: "#ffffff"
  },

  heroSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ec6d0"
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(110px, 1fr))",
    gap: 8,
    minWidth: 360
  },

  statBox: {
    padding: "11px 13px",
    borderRadius: 10,
    background: "linear-gradient(180deg, rgba(8,25,36,0.95), rgba(4,14,20,0.98))",
    border: "1px solid rgba(79,185,224,0.18)"
  },

  statLabel: {
    fontSize: 10,
    color: "#88adb8",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    marginBottom: 8
  },

  statValue: {
    fontSize: 22,
    fontWeight: 900,
    color: "#f6ffff"
  },

  errorBox: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(127,29,29,0.35)",
    border: "1px solid rgba(255,102,114,0.20)",
    color: "#ffd4d7"
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 8,
    marginBottom: 10
  },

  topCard: {
    minHeight: 112,
    padding: 10,
    borderRadius: 10,
    background: "linear-gradient(180deg, rgba(7,22,28,0.98), rgba(4,14,20,1))",
    border: "1px solid rgba(79,185,224,0.16)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)"
  },

  topHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8
  },

  topTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#f0ffff"
  },

  topSub: {
    fontSize: 10,
    color: "#8baeb8",
    marginTop: 2
  },

  topState: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1
  },

  topMetricRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 6,
    marginTop: 10,
    marginBottom: 8
  },

  topMetric: {
    borderRadius: 8,
    padding: "6px 7px",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.045)"
  },

  topMetricLabel: {
    fontSize: 9,
    color: "#8aacb5",
    textTransform: "uppercase",
    marginBottom: 4
  },

  topMetricValue: {
    fontSize: 11,
    fontWeight: 800,
    color: "#f5ffff"
  },

  deviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 8
  },

  deviceCard: {
    padding: 10,
    borderRadius: 10,
    background: "linear-gradient(180deg, rgba(7,22,28,0.98), rgba(4,14,20,1))",
    border: "1px solid rgba(79,185,224,0.16)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
    minHeight: 258
  },

  deviceHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8
  },

  deviceName: {
    fontSize: 15,
    fontWeight: 900,
    color: "#f6ffff",
    lineHeight: 1.15
  },

  deviceIp: {
    marginTop: 2,
    fontSize: 10,
    color: "#8caeb8"
  },

  deviceStatus: {
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 900
  },

  deviceBody: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 8
  },

  leftCol: {
    minWidth: 0
  },

  rightCol: {
    display: "grid",
    gap: 6
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: "5px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)"
  },

  metaLabel: {
    fontSize: 10,
    color: "#8eaeb7"
  },

  metaValue: {
    fontSize: 11,
    fontWeight: 800,
    color: "#f2ffff",
    textAlign: "right"
  },

  barsWrap: {
    marginTop: 10,
    display: "grid",
    gap: 6
  },

  usageRow: {
    display: "grid",
    gridTemplateColumns: "52px 1fr 34px",
    gap: 6,
    alignItems: "center"
  },

  usageLabel: {
    fontSize: 10,
    color: "#8eaeb7"
  },

  usageTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.04)"
  },

  usageFill: {
    height: "100%",
    borderRadius: 999
  },

  usagePct: {
    fontSize: 10,
    fontWeight: 800,
    color: "#e5fff0",
    textAlign: "right"
  },

  gaugeCard: {
    borderRadius: 8,
    padding: 4,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.045)"
  },

  gaugeSvg: {
    width: "100%",
    height: 84,
    display: "block"
  },

  gaugeTitle: {
    fill: "#ff7c88",
    fontSize: 12,
    fontWeight: 800
  },

  gaugeValue: {
    fill: "#f5ffff",
    fontSize: 17,
    fontWeight: 900
  },

  gaugeSub: {
    marginTop: -5,
    textAlign: "center",
    fontSize: 9,
    color: "#8aadb7",
    textTransform: "uppercase"
  }
};

