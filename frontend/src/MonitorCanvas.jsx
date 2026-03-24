import { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import TrafficGraph from "./TrafficGraph.jsx";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function defaultLayout(index){
  // Cascade layout (nice first open)
  const x = 20 + (index % 3) * 60;
  const y = 20 + (index % 4) * 50;
  return { x, y, w: 820, h: 300 };
}

export default function MonitorCanvas({ monitors, live, history, stopMonitor }) {
  const key = "tisp.canvas.layout.v1";

  const [layout, setLayout] = useState({}); // { [id]: {x,y,w,h} }
  const ids = useMemo(() => (monitors || []).map(m => m.id), [monitors]);

  // load saved layout once
  useEffect(() => {
    try{
      const raw = localStorage.getItem(key);
      if(raw){
        const j = JSON.parse(raw);
        if(j && typeof j === "object") setLayout(j);
      }
    } catch {}
  }, []);

  // ensure new monitors get default layout
  useEffect(() => {
    setLayout(prev => {
      let changed = false;
      const next = { ...prev };
      ids.forEach((id, idx) => {
        if(!next[id]){
          next[id] = defaultLayout(idx);
          changed = true;
        }
      });
      // remove layouts for deleted monitors
      Object.keys(next).forEach(id => {
        if(!ids.includes(id)){
          delete next[id];
          changed = true;
        }
      });
      if(changed){
        try{ localStorage.setItem(key, JSON.stringify(next)); } catch {}
        return next;
      }
      return prev;
    });
  }, [ids]);

  function save(id, patch){
    setLayout(prev => {
      const cur = prev[id] || defaultLayout(0);
      const next = { ...prev, [id]: { ...cur, ...patch } };
      try{ localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <div className="tisp-canvas">
      {monitors.map((m, idx) => {
        const st = layout[m.id] || defaultLayout(idx);
        const L = live[m.id] || {};
        const down = (L.down ?? 0);
        const up = (L.up ?? 0);

        return (
          <Rnd
            key={m.id}
            bounds="parent"
            size={{ width: st.w, height: st.h }}
            position={{ x: st.x, y: st.y }}
            minWidth={520}
            minHeight={240}
            
            onDragStop={(e, d) => save(m.id, { x: d.x, y: d.y })}
            onResizeStop={(e, dir, ref, delta, pos) => {
              const w = clamp(ref.offsetWidth, 520, 2400);
              const h = clamp(ref.offsetHeight, 240, 1600);
              save(m.id, { x: pos.x, y: pos.y, w, h });
            }}
            enableResizing={{
              top:true, right:true, bottom:true, left:true,
              topRight:true, bottomRight:true, bottomLeft:true, topLeft:true
            }}
          >
            <div className="tisp-cardWin">
              <div className="tisp-drag">
                <div className="tisp-dragTitle">
                  <strong>{m.label}</strong> ({m.ip}) — ifIndex {m.ifIndex}
                </div>
                <div className="tisp-dragHint">drag</div>
              </div>

              <div className="tisp-cardBody">
                <div>Download: {(down).toFixed?.(3) ?? "0"} Mbps</div>
                <div>Upload: {(up).toFixed?.(3) ?? "0"} Mbps</div>

                <TrafficGraph points={(history[m.id] || [])} height={140} />

                {!L.ok && L.err ? <div style={{ color: "red", marginTop: 8 }}>{L.err}</div> : null}

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => stopMonitor(m.id)}>Close</button>
                </div>
              </div>
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}







