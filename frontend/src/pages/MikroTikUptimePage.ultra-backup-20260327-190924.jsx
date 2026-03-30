import { useEffect, useState } from "react";

const EXCLUDED_IPS = [
  "10.88.88.253",
  "10.88.88.252",
  "10.88.88.251",
  "88.88.88.49",
  "88.88.88.250"
];

export default function MikroTikUptimePage() {
  const [devices, setDevices] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/mikrotik/uptime");
      const data = await res.json();

      const filtered = data.filter(d => !EXCLUDED_IPS.includes(d.ip));
      setDevices(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, []);

  const total = devices.length;
  const up = devices.filter(d => d.status === "UP").length;
  const down = total - up;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>LIVE FLEET</div>
          <h1 style={styles.title}>MikroTik Uptime</h1>
        </div>

        <div style={styles.stats}>
          <Stat label="TOTAL" value={total} />
          <Stat label="UP" value={up} green />
          <Stat label="DOWN" value={down} red />
        </div>
      </div>

      <div style={styles.grid}>
        {devices.map((d, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              borderColor: d.status === "UP" ? "#00ff9c33" : "#ff3b3b33"
            }}
          >
            <div style={styles.cardTop}>
              <div>
                <div style={styles.name}>{d.name}</div>
                <div style={styles.ip}>{d.ip}</div>
              </div>

              <div
                style={{
                  ...styles.status,
                  background: d.status === "UP" ? "#00ff9c22" : "#ff3b3b22",
                  color: d.status === "UP" ? "#00ff9c" : "#ff3b3b"
                }}
              >
                {d.status}
              </div>
            </div>

            <div style={styles.metrics}>
              <Metric label="PING" value={d.ping + " ms"} />
              <Metric label="JITTER" value={d.jitter + " ms"} />
              <Metric label="LOSS" value={d.loss + " %"} />
              <Metric label="CPU" value={d.cpu + " %"} />
            </div>

            <div style={styles.uptime}>{d.uptime}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, green, red }) {
  return (
    <div style={{
      padding: "10px 14px",
      borderRadius: 10,
      background: "#0f172a",
      border: "1px solid #1e293b",
      color: green ? "#00ff9c" : red ? "#ff3b3b" : "#fff"
    }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{
      background: "#020617",
      padding: 8,
      borderRadius: 8,
      border: "1px solid #1e293b"
    }}>
      <div style={{ fontSize: 10, opacity: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    color: "#fff",
    background: "radial-gradient(circle at top, #020617, #000)",
    minHeight: "100vh"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  badge: {
    fontSize: 12,
    color: "#00ff9c",
    marginBottom: 6
  },

  title: {
    fontSize: 32,
    margin: 0
  },

  stats: {
    display: "flex",
    gap: 10
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: 14
  },

  card: {
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 14,
    transition: "0.2s",
    boxShadow: "0 0 20px #000"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  name: {
    fontWeight: 600,
    fontSize: 14
  },

  ip: {
    fontSize: 11,
    opacity: 0.5
  },

  status: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11
  },

  metrics: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6
  },

  uptime: {
    marginTop: 10,
    fontSize: 11,
    opacity: 0.6
  }
};
