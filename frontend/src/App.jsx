import React, { useMemo, useState, useEffect } from "react";
import AppShell from "./layout/AppShell";
import Workspace from "./workspace/Workspace";

const STORAGE_KEY = "toolsisp_windows_v1";

function uid(){
  return "w_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
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

  const [windows, setWindows] = useState(() => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch{
      return [];
    }
  });

  useEffect(() => {
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(windows)); }catch{}
  }, [windows]);

  function openWin(type){
    const id = uid();
    const base = {
      id,
      type,
      ip: (type === "ping" ? "88.88.88.10" : undefined),
      community: (type === "monitor" ? "public" : undefined),
      title:
        type === "ping" ? "Ping — 88.88.88.10" :
        type === "monitor" ? "Monitor" :
        "Note",
      x: 140 + (windows.length * 18),
      y: 120 + (windows.length * 14),
      w: type === "note" ? 420 : 560,
      h: type === "note" ? 320 : 340,
      z: 10 + windows.length
    };
    setWindows(prev => [...prev, base]);
  }

  const actions = useMemo(() => ({
    onNewPing: () => openWin("ping"),
    onNewMonitor: () => openWin("monitor"),
    onNewNote: () => openWin("note"),
  }), [windows]);

  useEffect(() => {
    function onKey(e){
      if(e.ctrlKey && e.key.toLowerCase() === "p"){ e.preventDefault(); openWin("ping"); }
      if(e.ctrlKey && e.key.toLowerCase() === "m"){ e.preventDefault(); openWin("monitor"); }
      if(e.ctrlKey && e.key.toLowerCase() === "n"){ e.preventDefault(); openWin("note"); }
      if(e.key === "Escape"){
        setWindows(prev => {
          if(!prev.length) return prev;
          const sorted = [...prev].sort((a,b)=>(b.z??0)-(a.z??0));
          const top = sorted[0];
          return prev.filter(w => w.id !== top.id);
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [windows]);

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h2>tools-isp Dashboard</h2>
      <div style={{ marginBottom: 10 }}>{status}</div>

      
      {showPing ? (
        <div>
          {pings.map(p => (
            <div
              key={p.id}
              style={{
                position: "fixed",
                left: (p.x ?? 40),
                top: (p.y ?? 160),
                width: (p.w ?? 360),
                height: (p.h ?? 320),
                boxSizing: "border-box",
                minWidth: 300,
                minHeight: 220,
                resize: "both",
                overflow: "auto",
                background: "rgba(10, 14, 20, 0.78)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 10,
                
                paddingBottom: 24,boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                padding: 10,
                cursor: "move",
                zIndex: 9999
              }}
            >
              <div onMouseDown={(e) => onPingMouseDown(e, p.id)}  style={{ display: "flex",
                flexDirection: "column", justifyContent: "space-between", cursor: "move", userSelect: "none", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>Packet loss</div>
                <button type="button" onClick={() => removePing(p.id)} style={{ cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                <input
                  value={p.ip}
                  onChange={(e) => setPingField(p.id, { ip: e.target.value })}
                  placeholder="IP / Host (8.8.8.8)"
                  style={{ cursor: "text" }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => startPingId(p.id)}
                  disabled={p.running}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Run
                </button>
                <button
                  type="button"
                  onClick={() => stopPingId(p.id)}
                  disabled={!p.running}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Stop
                </button>
              </div>

              {(() => {
  const loss = getPacketLossPct(p.out);
  const pct = (loss === null) ? 0 : Math.max(0, Math.min(100, loss));
  const lossText = (loss === null) ? "—" : (pct + "%");

  // Sparkline from real ping times: time=23ms / time<1ms / time=23.5ms
  const times = (p.out || "")
    .split(/\r?\n/)
    .map((l) => {
      const m = l.match(/time\s*[=<]\s*([0-9.]+)\s*ms/i);
      return m ? Number(m[1]) : null;
    })
    .filter((v) => v !== null && !Number.isNaN(v))
    .slice(-40);

  const maxT = times.length ? Math.max(...times) : null;
  const minT = times.length ? Math.min(...times) : null;

  const sparkPoints = (() => {
    if (!times.length) return "";
    const w = 100, h = 14;
    const span = Math.max(1, (maxT - minT));
    const n = times.length;
    return times.map((t, i) => {
      const x = (n === 1) ? 0 : (i * (w / (n - 1)));
      const y = h - ((t - minT) / span) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");
  })();

  const sparkColor =
    maxT === null ? "rgba(0,0,0,0)" :
    (maxT >= 150 ? "rgba(255,80,80,0.98)" :
     maxT >= 80  ? "rgba(255,200,0,0.98)" :
                   "rgba(0,255,200,0.98)");

  const pingLabel =
    maxT === null ? "—" :
    (Math.round(maxT) + "ms");

  return (
    <div className="pingMetaWrap">
      <div className="pingMetaRow">
        <div className="pingMetaLeft">
          <div className="pingMetaLabel">Packet loss</div>
          <div className="pingMetaValue">{lossText}</div>
        </div>
        <div className={"pingDotBox " + (p.running ? "on" : "")}>
          <span className="pingDot" />
        </div>
      </div>

      <div
        className="plBar"
        style={{ position: "relative", overflow: "hidden" }}
        title={"Ping: " + pingLabel + " | Packet loss: " + lossText}
      >
        <div className="plFill" style={{ width: pct + "%", position:"absolute", left:0, top:0, bottom:0, zIndex:1, opacity:0.22 }} />

        {/* Real-time ping sparkline */}
        <svg className="plSpark" viewBox="0 0 100 14" width="100%" height="14"
          preserveAspectRatio="none"
          style={{ position:"absolute", left:0, top:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }}
        >
          <polyline
  points={sparkPoints}
  style={(() => {
    const ms = (() => {
      const m = String(pingLabel || "").match(/(\d+)\s*ms/);
      return m ? parseInt(m[1], 10) : null;
    })();
    const stroke =
      ms === null ? "rgba(120,200,255,0.9)" :
      ms >= 200 ? "rgba(255,90,90,0.95)" :
      ms >= 80  ? "rgba(255,210,70,0.95)" :
                  "rgba(60,255,190,0.95)";
    return {
      fill: "none",
      stroke,
      strokeWidth: 2,
      strokeLinejoin: "round",
      strokeLinecap: "round",
      filter: "drop-shadow(0 0 6px rgba(120,220,255,0.35))"
    };
  })()}
/>
        </svg>
      </div>

      <div className={"pingNeonLine " + (p.running ? "on" : "")} />
    </div>
  );
})()}
<pre data-ping-out={p.id} className="pingOut">{cleanPingText(p.out)}</pre>
            
              {/* PING_RESIZE_GRIP */}
              <div
                onMouseDown={(e) => onPingResizeDown(e, p.id)}
                style={{
                  position: "absolute",
                  right: 6,
                  bottom: 6,
                  width: 14,
                  height: 14,
                  cursor: "nwse-resize",
                  borderRadius: 3,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.25)"
                }}
              /></div>
          ))}
        </div>
      </Workspace>
    </AppShell>
  );
}
<<<<<<< HEAD































=======
>>>>>>> autosave-clean


