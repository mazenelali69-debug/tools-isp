import React, { useMemo, useState } from "react";
import WindowFrame from "./WindowFrame";
import PingTool from "./tools/PingTool";
import MonitorTool from "./tools/MonitorTool";
import "./workspace.css";

/**
 * Workspace overlays managed windows on top of the legacy app (children).
 * We keep LegacyApp intact and gradually migrate features into windows.
 */
export default function Workspace({ windows, setWindows, children }) {
  const [zTop, setZTop] = useState(10);

  const byId = useMemo(() => {
    const m = new Map();
    for(const w of windows) m.set(w.id, w);
    return m;
  }, [windows]);

  function focus(id){
    setWindows(prev => {
      const w = prev.find(x => x.id === id);
      if(!w) return prev;
      const maxZ = Math.max(10, ...prev.map(x => x.z ?? 10));
      const nextZ = maxZ + 1;
      setZTop(nextZ);
      return prev.map(x => x.id === id ? { ...x, z: nextZ } : x);
    });
  }

  function close(id){
    setWindows(prev => prev.filter(x => x.id !== id));
  }

  function update(id, patch){
    setWindows(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  return (
    <div className="wsRoot">
      <div className="wsBase">
        {children}
      </div>

      <div className="wsOverlay">
        {windows.map(w => (
          <WindowFrame
            key={w.id}
            win={w}
            onFocus={() => focus(w.id)}
            onClose={() => close(w.id)}
            onChange={(patch) => update(w.id, patch)}
          >
            {w.type === "ping" && (
  <PingTool
    ip={w.ip ?? "88.88.88.10"}
    onIpChange={(next)=> update(w.id, { ip: next, title: "Ping — " + (String(next||"").trim() || "…") })}
  />
)}

            {w.type === "monitor" && (
  <MonitorTool
    win={w}
    onChange={(patch)=> update(w.id, patch)}
  />
)}

            {w.type === "note" && (
              <div className="wsPanel">
                <div className="wsHint">Note</div>
                <textarea
                  className="wsNote"
                  value={w.note ?? ""}
                  onChange={(e)=> update(w.id, { note: e.target.value })}
                  placeholder="Write your notes..."
                />
              </div>
            )}
          </WindowFrame>
        ))}
      </div>
    </div>
  );
}







