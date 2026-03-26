import { useEffect, useState } from "react";

const DEVICES = [
  { name: "Core Router", ip: "88.88.88.1" },
  { name: "Tower A", ip: "10.88.88.2" },
  { name: "Tower B", ip: "10.88.88.3" },
  { name: "Backbone Link", ip: "88.88.88.10" },
];

export default function NetworkMapPage() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const data = DEVICES.map((d) => ({
      ...d,
      uptime: Math.floor(Math.random() * 99) + "%",
      ping: Math.floor(Math.random() * 30) + " ms",
      status: Math.random() > 0.2 ? "UP" : "DOWN",
    }));

    setDevices(data);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        MikroTik Uptime Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {devices.map((d, i) => (
          <div
            key={i}
            style={{
              background: "#0b1220",
              border: "1px solid #1f2a44",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: "bold" }}>
              {d.name}
            </div>

            <div style={{ opacity: 0.7 }}>{d.ip}</div>

            <div style={{ marginTop: 10 }}>
              Uptime: <b>{d.uptime}</b>
            </div>

            <div>Ping: {d.ping}</div>

            <div
              style={{
                marginTop: 10,
                color: d.status === "UP" ? "lime" : "red",
                fontWeight: "bold",
              }}
            >
              {d.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
