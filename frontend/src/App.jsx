import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import MonitorBox from "./MonitorBox.jsx";
import TrafficGraph from "./TrafficGraph.jsx";

const API = window.location.origin.replace(/:\d+$/, ":9090");

export default function App() {
  const [ip, setIp] = useState("88.88.88.10");
  const [community, setCommunity] = useState("public");
  const [interfaces, setInterfaces] = useState([]);
  const [ifIndex, setIfIndex] = useState(2);
  const [ifOpen, setIfOpen] = useState(false);
  const [label, setLabel] = useState("WAN-ether1");
  const [monitors, setMonitors] = useState([]);
  const [live, setLive] = useState({});
  const [history, setHistory] = useState({}); // { [id]: [{t,down,up}, ...] }
  const [status, setStatus] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    const s = io(API);
    socketRef.current = s;

    s.on("monitor:update", (msg) => {
      setLive(prev => ({
        ...prev,
        [msg.id]: {
          down: msg.down_mbps ?? 0,
          up: msg.up_mbps ?? 0,
          ok: msg.ok,
          err: msg.error
        }
      }));

      setHistory(prev => {
        const id = msg.id;
        const prevArr = prev[id] || [];
        const next = prevArr.concat([{
          t: Date.now(),
          down: msg.down_mbps ?? 0,
          up: msg.up_mbps ?? 0
        }]);
        const sliced = next.length > 120 ? next.slice(next.length - 120) : next;
        return { ...prev, [id]: sliced };
      });
    });

    s.on("monitor:stopped", ({ id }) => {
      setLive(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      setHistory(prevH => {
        const copyH = { ...prevH };
        delete copyH[id];
        return copyH;
      });

      loadMonitors();
    });

    return () => s.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMonitors() {
    const r = await fetch(API + "/api/monitors");
    const j = await r.json();
    setMonitors(j.monitors || []);
  }

  useEffect(() => { loadMonitors(); }, []);

  

  // close interface dropdown on outside click
  useEffect(() => {
    function onDoc(e){
      const el = e.target;
      if (!el) return;
      // if click is inside dropdown, ignore
      if (el.closest && el.closest(".dd")) return;
      setIfOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);async function fetchInterfaces() {
    setStatus("Loading interfaces...");
    const r = await fetch(API + "/api/interfaces-cli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, community })
    });
    const j = await r.json();
    if (!j.ok) { setStatus(j.error); return; }
    setInterfaces(j.interfaces);
    setStatus("Interfaces loaded");
  }

  async function startMonitor() {
    const r = await fetch(API + "/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, community, ifIndex: Number(ifIndex), label })
    });
    const j = await r.json();
    if (!j.ok) { setStatus(j.error); return; }
    loadMonitors();
  }

  async function stopMonitor(id) {
    await fetch(API + "/api/monitors/" + id, { method: "DELETE" });
    loadMonitors();
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h2>tools-isp Dashboard</h2>
      <div style={{ marginBottom: 10 }}>{status}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="IP" />
        <input value={community} onChange={e => setCommunity(e.target.value)} placeholder="Community" />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
        <button onClick={fetchInterfaces}>Fetch Interfaces</button>
      </div>

      <div className="dd" style={{ marginTop: 10 }}>
  <button
    type="button"
    className="ddBtn"
    onClick={() => setIfOpen(v => !v)}
    aria-expanded={ifOpen ? "true" : "false"}
    title={(interfaces.find(i => String(i.ifIndex) === String(ifIndex))?.ifName) || ""}
  >
    <span>
      {(() => {
        const sel = interfaces.find(i => String(i.ifIndex) === String(ifIndex));
        return sel ? `#${sel.ifIndex} - ${sel.ifName}` : `#${ifIndex}`;
      })()}
    </span>
    <span className="ddCaret">▾</span>
  </button>

  {ifOpen ? (
    <div className="ddMenu">
      {interfaces.map(i => {
        const active = String(i.ifIndex) === String(ifIndex);
        return (
          <button
            key={i.ifIndex}
            type="button"
            className={"ddItem" + (active ? " ddItemActive" : "")}
            onClick={() => { setIfIndex(i.ifIndex); setIfOpen(false); }}
          >
            #{i.ifIndex} - {i.ifName}
          </button>
        );
      })}
      {interfaces.length === 0 ? (
        <div style={{ padding: 10, color: "rgba(255,255,255,.7)" }}>
          No interfaces loaded
        </div>
      ) : null}
    </div>
  ) : null}
</div>

      <button onClick={startMonitor} style={{ marginLeft: 10 }}>+ Add</button>

      <hr />

      {monitors.map(m => {
        const L = live[m.id] || {};
        const down = (L.down ?? 0);
        const up = (L.up ?? 0);

        return (
          <MonitorBox
            key={m.id}
            monitor={m}
            live={L}
            points={(history[m.id] || [])}
            onClose={() => stopMonitor(m.id)}
          />
        );
      })}
    </div>
  );
}








