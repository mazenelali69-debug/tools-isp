import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:9090";

function clampHistory(arr, max=60) {
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

export default function App() {
  const [ip, setIp] = useState("88.88.88.10");
  const [community, setCommunity] = useState("public");
  const [interfaces, setInterfaces] = useState([]);
  const [ifIndex, setIfIndex] = useState(2);
  const [label, setLabel] = useState("WAN-ether1");
  const [status, setStatus] = useState("");
  const [monitors, setMonitors] = useState([]);
  const socketRef = useRef(null);

  const [live, setLive] = useState({}); // id -> {down, up, ok, err, historyDown[], historyUp[]}

  useEffect(() => {
    // socket.io connects to backend origin (9090)
    const s = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current = s;

    s.on("connect", () => setStatus("✅ Socket connected"));
    s.on("disconnect", () => setStatus("⚠️ Socket disconnected"));

    s.on("monitor:update", (msg) => {
      setLive((prev) => {
        const cur = prev[msg.id] || { historyDown: [], historyUp: [] };
        const next = {
          ...cur,
          ok: msg.ok,
          err: msg.ok ? "" : (msg.error || "error"),
          down: msg.down_mbps ?? cur.down ?? 0,
          up: msg.up_mbps ?? cur.up ?? 0,
          historyDown: msg.ok ? clampHistory([...cur.historyDown, msg.down_mbps ?? 0]) : cur.historyDown,
          historyUp: msg.ok ? clampHistory([...cur.historyUp, msg.up_mbps ?? 0]) : cur.historyUp,
          ts: msg.ts,
          label: msg.label || cur.label
        };
        return { ...prev, [msg.id]: next };
      });
    });

    s.on("monitor:stopped", ({ id }) => {
      setLive((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      refreshMonitors();
    });

    return () => s.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshMonitors() {
    const r = await fetch(`${API_BASE}/api/monitors`);
    const j = await r.json();
    setMonitors(j.monitors || []);
  }

  useEffect(() => { refreshMonitors(); }, []);

  async function fetchInterfaces() {
    setStatus("⏳ Fetching interfaces...");
    const r = await fetch(`${API_BASE}/api/interfaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, community })
    });
    const j = await r.json();
    if (!j.ok) {
      setInterfaces([]);
      setStatus(`❌ ${j.error || "Failed to fetch interfaces"}`);
      return;
    }
    setInterfaces(j.interfaces || []);
    const best = (j.interfaces || [])[0];
    if (best && !ifIndex) setIfIndex(best.ifIndex);
    setStatus("✅ Interfaces loaded");
  }

  async function startMonitor() {
    setStatus("⏳ Starting monitor...");
    const r = await fetch(`${API_BASE}/api/monitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, community, ifIndex: Number(ifIndex), label, intervalMs: 1000 })
    });
    const j = await r.json();
    if (!j.ok) {
      setStatus(`❌ ${j.error || "Failed to start monitor"}`);
      return;
    }
    setStatus(`✅ Monitor started: ${j.id}`);
    await refreshMonitors();
  }

  async function stopMonitor(id) {
    setStatus("⏳ Stopping...");
    await fetch(`${API_BASE}/api/monitors/${id}`, { method: "DELETE" });
    setStatus("✅ Stopped");
    await refreshMonitors();
  }

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ margin: 0 }}>tools-isp Dashboard</h2>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>{status}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
        <div>
          <label>IP</label>
          <input value={ip} onChange={(e) => setIp(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <div>
          <label>Community</label>
          <input value={community} onChange={(e) => setCommunity(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <div>
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchInterfaces} style={{ padding: "9px 12px" }}>Fetch Interfaces</button>
          <button onClick={startMonitor} style={{ padding: "9px 12px" }}>+ Add</button>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Interface</label>
          <select value={ifIndex} onChange={(e) => setIfIndex(Number(e.target.value))} style={{ width: "100%", padding: 8 }}>
            {(interfaces || []).map((x) => (
              <option key={x.ifIndex} value={x.ifIndex}>
                #{x.ifIndex} — {x.ifName}{x.ifSpeed ? ` (${Math.round(x.ifSpeed/1e6)} Mbps)` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Active Monitors</h3>
        <button onClick={refreshMonitors}>Refresh</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
        {monitors.map((m) => {
          const L = live[m.id] || {};
          const down = (L.down ?? 0).toFixed(3);
          const up = (L.up ?? 0).toFixed(3);
          const ok = L.ok !== false;

          return (
            <div key={m.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {m.ip} — ifIndex {m.ifIndex} — poll {m.poll}ms
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    border: "1px solid #ccc"
                  }}>
                    {ok ? "OK" : "ERR"}
                  </span>
                  <button onClick={() => stopMonitor(m.id)}>Close</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Download</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{down} Mbps</div>
                </div>
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Upload</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{up} Mbps</div>
                </div>
              </div>

              {!ok && L.err ? (
                <div style={{ marginTop: 10, color: "#b00020", fontSize: 12 }}>
                  {L.err}
                </div>
              ) : null}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Live updates via Socket.IO
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
