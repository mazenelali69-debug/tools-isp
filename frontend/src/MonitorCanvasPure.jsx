import { useRef } from "react";
import DragResizeWindow from "./DragResizeWindow.jsx";
import TrafficGraph from "./TrafficGraph.jsx";

function defaultRect(i){
  return { x: 20 + (i % 3) * 70, y: 20 + (i % 4) * 60, w: 860, h: 320 };
}

export default function MonitorCanvasPure({ monitors, live, history, stopMonitor }) {
  const boundsRef = useRef(null);

  return (
    <div
      ref={boundsRef}
      style={{
        position: "relative",
        width: "100%",
        height: "72vh",
        minHeight: 520,
        marginTop: 12,
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 16,
        background: "rgba(0,0,0,.10)",
        overflow: "hidden"
      }}
    >
      {(monitors || []).map((m, i) => {
        const L = live[m.id] || {};
        const down = (L.down ?? 0);
        const up = (L.up ?? 0);

        return (
          <DragResizeWindow
            key={m.id}
            id={m.id}
            boundsRef={boundsRef}
            title={`${m.label} (${m.ip}) — ifIndex ${m.ifIndex}`}
            defaultRect={defaultRect(i)}
          >
            <div>Download: {(down).toFixed?.(3) ?? "0"} Mbps</div>
            <div>Upload: {(up).toFixed?.(3) ?? "0"} Mbps</div>

            <TrafficGraph points={(history[m.id] || [])} height={140} />

            {!L.ok && L.err ? (
              <div style={{ color: "red", marginTop: 8 }}>{L.err}</div>
            ) : null}

            <div style={{ marginTop: 10 }}>
              <button onClick={() => stopMonitor(m.id)}>Close</button>
            </div>
          </DragResizeWindow>
        );
      })}
    </div>
  );
}




