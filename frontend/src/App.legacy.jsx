import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tools-isp:pings:v1";
const STORAGE_UI_KEY = "tools-isp:ui:v1";

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}
function loadSavedPings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const arr = safeParse(raw, null);
  if (!Array.isArray(arr)) return null;
  // minimal validation + defaults
  return arr.map(p => ({
    id: String(p.id || (crypto?.randomUUID ? crypto.randomUUID() : Date.now())),
    ip: String(p.ip || ""),
    out: String(p.out || ""),
    running: false,            // never restore running
    x: Number.isFinite(p.x) ? p.x : 40,
    y: Number.isFinite(p.y) ? p.y : 160,
    w: Number.isFinite(p.w) ? p.w : (p.w ?? undefined),
    h: Number.isFinite(p.h) ? p.h : (p.h ?? undefined),
  }));
}
function savePingsNow(pings) {
  try {
    const toSave = (pings || []).map(p => ({
      id: p.id, ip: p.ip, out: p.out,
      x: p.x, y: p.y, w: p.w, h: p.h
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}
import { io } from "socket.io-client";
import MonitorBox from "./MonitorBox.jsx";
import TrafficGraph from "./TrafficGraph.jsx";
import "./packet-loss.css";
import "./ping-modern.css";

const API = window.location.origin.replace(/:\d+$/, ":9090");
const ENABLE_LEGACY_MONITORS = false;
function getPacketLossPct(out) {
  if (!out) return null;
  const s = String(out);
  const lines = s.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const tail = lines.slice(-50); // آخر 50 نتيجة
  let sent = 0;
  let lost = 0;
  for (const l of tail) {
    // نجاح
    if (/^reply from/i.test(l) || /bytes=\d+/i.test(l)) {
      sent++;
      continue;
    }
    // فشل (ويندوز + حالات شائعة)
    if (/request timed out/i.test(l) || /destination host unreachable/i.test(l) || /general failure/i.test(l) || /transmit failed/i.test(l) || /unreachable/i.test(l)) {
      sent++;
      lost++;
      continue;
    }
  }
  if (sent === 0) return null;
  const pct = (lost / sent) * 100;
  return Math.round(pct * 10) / 10; // 1 decimal
}
function cleanPingText(out){
  if(!out) return "";
  return String(out)
    .split(/\r?\n/)
    .filter(line => !/^Pinging\s+/i.test(line))  // remove "Pinging x.x.x.x ..."
    .filter(line => line.trim() !== "")         // remove empty lines
    .join("\n");
}

export default function App() {
  const [ip, setIp] = useState("88.88.88.10");
  const [community, setCommunity] = useState("public");
  const [interfaces, setInterfaces] = useState([]);
  const [ifIndex, setIfIndex] = useState(2);
  const [ifOpen, setIfOpen] = useState(false);
  const [label, setLabel] = useState("WAN-ether1");
  // Ping UI (multi boxes)
  const [showPing, setShowPing] = useState(false);
  const [pings, setPings] = useState([]); 
useEffect(() => {
  // Restore pings positions + last IPs
  const saved = loadSavedPings();
  if (saved && saved.length) {
    setPings(saved);
  }

  // (Optional) restore simple UI state (interface/group) if you want later:
  // const ui = safeParse(localStorage.getItem(STORAGE_UI_KEY), null);
  // if (ui && typeof ui === "object") {
  //   if (ui.iface != null) setSelectedInterface(String(ui.iface));
  // }
}, []);

useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// [{id, ip, out, running, x, y}]
  const pingSrcRef = useRef({});          // { [id]: EventSource }
  const dragRef = useRef({ active:false, id:null, dx:0, dy:0 });

  const resizeRef = useRef({ active:false, id:null, sx:0, sy:0, sw:0, sh:0 });
const [pingSrc, setPingSrc] = useState(null);
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


  
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// PING_RESIZE_ENGINE_START
  useEffect(() => {
    function onMove(e) {
      const r = resizeRef.current;
      if (!r || !r.active || !r.id) return;

      const dx = e.clientX - r.sx;
      const dy = e.clientY - r.sy;

      const nw = Math.max(280, r.sw + dx);
      const nh = Math.max(220, r.sh + dy);

      setPings(prev => prev.map(pp => (pp.id === r.id ? { ...pp, w: nw, h: nh } : pp)));
    }

    function onUp() {
      const r = resizeRef.current;
      if (!r) return;
      resizeRef.current = { active:false, id:null, sx:0, sy:0, sw:0, sh:0 };
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// PING_RESIZE_ENGINE_END
  async function loadMonitors() {
    const r = await fetch(API + "/api/monitors");
    const j = await r.json();
    setMonitors(j.monitors || []);
  }

  useEffect(() => {
    if (!ENABLE_LEGACY_MONITORS) return;
    loadMonitors();
  }, []);

  

  

  
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// cleanup pings on unmount
  useEffect(() => {
    return () => {
      try {
        const m = pingSrcRef.current || {};
        Object.keys(m).forEach(k => { try { m[k].close(); } catch {} });
      } catch {}
    };
  }, []);

  
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// PING_RESIZE_ENGINE_START
  useEffect(() => {
    function onMove(e) {
      const r = resizeRef.current;
      if (!r || !r.active || !r.id) return;

      const dx = e.clientX - r.sx;
      const dy = e.clientY - r.sy;

      const nw = Math.max(280, r.sw + dx);
      const nh = Math.max(220, r.sh + dy);

      setPings(prev => prev.map(pp => (pp.id === r.id ? { ...pp, w: nw, h: nh } : pp)));
    }

    function onUp() {
      const r = resizeRef.current;
      if (!r) return;
      resizeRef.current = { active:false, id:null, sx:0, sy:0, sw:0, sh:0 };
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
// PING_RESIZE_ENGINE_END
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
  }, []);
useEffect(() => {
  // Debounced save to localStorage
  let saveTimer = setTimeout(() => {
    savePingsNow(pings);
  }, 150);

  return () => {
    try { clearTimeout(saveTimer); } catch {}
  };
}, [pings]);
async function fetchInterfaces() {
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

  function addPing() {
    const id = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2));
    const baseX = 40 + (pings.length * 30);
    const baseY = 160 + (pings.length * 30);
    setPings(prev => prev.concat([{ id, ip: "", out: "", running: false, x: baseX, y: baseY }]));
  }

  function removePing(id) {
    stopPingId(id);
    setPings(prev => prev.filter(p => p.id !== id));
  }

  function setPingField(id, patch) {
    setPings(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  function stopPingId(id) {
    try {
      const es = pingSrcRef.current?.[id];
      if (es) { try { es.close(); } catch {} }
      if (pingSrcRef.current) delete pingSrcRef.current[id];
    } catch {}
    setPingField(id, { running: false });
  }

  function startPingId(id) {
    const p = pings.find(x => x.id === id);
    const target = String((p?.ip || "")).trim();
    if (!target) { setPingField(id, { out: "Enter IP first" }); return; }

    // stop previous if any
    stopPingId(id);

    // show header + keep running
    setPingField(id, { out: "Pinging " + target + " ...\n", running: true });

    // ✅ SSE live stream
    const url = API + "/api/ping-sse?ip=" + encodeURIComponent(target);
    const es = new EventSource(url);
    pingSrcRef.current[id] = es;

    let startedAt = Date.now();
    let lineCount = 0;

    const append = (line) => {
      lineCount++;
      // Append + force react re-render/scroll using a tiny changing suffix
      setPings(prev => prev.map(pp => {
        if (pp.id !== id) return pp;
        const base = (pp.out || "");
        const next = base + String(line || "") + "\n";
        return { ...pp, out: next, _scroll: Date.now() };
      }));

      // ✅ Auto-scroll output to bottom (after DOM updates)
      setTimeout(() => {
        try {
          const el = document.querySelector(`[data-ping-out="${id}"]`);
          if (el) { el.scrollTop = el.scrollHeight; }
        } catch {}
      }, 0);
    };

    es.addEventListener("line", (ev) => {
      try {
        const obj = JSON.parse(ev.data || "{}");
        append(obj.line ?? String(ev.data ?? ""));
      } catch {
        append(String(ev.data ?? ""));
      }
    });

    es.addEventListener("end", () => {
      try { es.close(); } catch {}
      try { delete pingSrcRef.current[id]; } catch {}
      const ms = Date.now() - startedAt;
      append("[done] " + ms + "ms");
      setPingField(id, { running: false });
    });

    es.onerror = () => {
      // NOTE: EventSource auto-reconnects, but backend closes when client closes.
      // We will show error and stop to avoid endless loop.
      try { es.close(); } catch {}
      try { delete pingSrcRef.current[id]; } catch {}
      append("[error] stream disconnected");
      setPingField(id, { running: false });
    };
}

  function onPingMouseDown(e, id) {
    const p = pings.find(x => x.id === id);
    if (!p) return;
    dragRef.current = {
      active: true,
      id,
      dx: e.clientX - (p.x || 0),
      dy: e.clientY - (p.y || 0)
    };
    e.preventDefault();
  }
  function onPingResizeDown(e, id) {
    if (e.button !== 0) return;
    const p = pings.find(x => x.id === id);
    if (!p) return;

    const sw = (p.w ?? 360);
    const sh = (p.h ?? 320);

    resizeRef.current = { active:true, id, sx:e.clientX, sy:e.clientY, sw, sh };
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current;
      if (!d?.active || !d.id) return;
      const x = Math.max(0, e.clientX - d.dx);
      const y = Math.max(0, e.clientY - d.dy);
      setPingField(d.id, { x, y });
    }
    function onUp() {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = { active:false, id:null, dx:0, dy:0 };
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pings]);

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h2>tools-isp Dashboard</h2>
      <div style={{ marginBottom: 10 }}>{status}</div>
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




































