import { useEffect, useMemo, useState } from "react";

const API_BASE = "";
const WINDOW = 24;

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v){
  const n = num(v);
  if(n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtSpeed(v){
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${n} Mbps` : "—";
}

function statusTone(v){
  const s = String(v || "").toLowerCase();
  if(s === "up") return "#00f5d4";
  if(s === "down") return "#ff8a80";
  return "#ffd166";
}

function Metric({ label, value, accent }){
  return (
    <div
      style={{
        display: "grid",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 8px",
        borderRadius: 10,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        marginBottom: 8
      }}
    >
      <div style={{ opacity: 0.82, fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: accent || "white" }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ label, value }){
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        fontSize: 11,
        marginRight: 6,
        marginBottom: 6
      }}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      <strong style={{ color: statusTone(value) }}>{String(value || "unk").toUpperCase()}</strong>
    </div>
  );
}

function MiniSpark({ rxValues = [], txValues = [], height = 120 }){
  const rx = (Array.isArray(rxValues) ? rxValues : []).map(x => num(x));
  const tx = (Array.isArray(txValues) ? txValues : []).map(x => num(x));
  const len = Math.max(rx.length, tx.length, 2);
  const w = 260;
  const h = height;
  const pad = 8;
  const max = Math.max(1, ...rx, ...tx, 1);

  const [hoverIndex, setHoverIndex] = useState(null);

  function buildLine(values){
    const pts = Array.from({ length: len }, (_, i) => num(values[i] ?? 0));
    return pts.map((v, i) => {
      const x = len <= 1 ? pad : pad + (i * (w - pad * 2)) / (len - 1);
      const y = h - (((v / max) * (h - pad * 2)) + pad);
      return `${x},${y}`;
    }).join(" ");
  }

  const rxLine = buildLine(rx);
  const txLine = buildLine(tx);

  const tooltipRx = hoverIndex === null ? null : num(rx[hoverIndex] ?? 0);
  const tooltipTx = hoverIndex === null ? null : num(tx[hoverIndex] ?? 0);

  function handleMove(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(len - 1, Math.round((x / rect.width) * (len - 1))));
    setHoverIndex(idx);
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.07)"
      }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="ethRxFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,255,212,.18)" />
            <stop offset="100%" stopColor="rgba(0,255,212,0)" />
          </linearGradient>
        </defs>

        <polyline
          fill="none"
          stroke="#00f5d4"
          strokeWidth="2.2"
          points={rxLine}
        />
        <polyline
          fill="none"
          stroke="#7aa2ff"
          strokeWidth="2.2"
          points={txLine}
        />

        {hoverIndex !== null ? (
          <line
            x1={pad + (hoverIndex * (w - pad * 2)) / Math.max(1, len - 1)}
            x2={pad + (hoverIndex * (w - pad * 2)) / Math.max(1, len - 1)}
            y1="0"
            y2={h}
            stroke="rgba(255,255,255,.18)"
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>

      {hoverIndex !== null ? (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(10,12,18,.94)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 10,
            padding: "6px 8px",
            fontSize: 11,
            lineHeight: 1.5,
            boxShadow: "0 10px 20px rgba(0,0,0,.24)"
          }}
        >
          <div style={{ color: "#00f5d4", fontWeight: 700 }}>RX: {fmtMbps(tooltipRx)}</div>
          <div style={{ color: "#7aa2ff", fontWeight: 700 }}>TX: {fmtMbps(tooltipTx)}</div>
        </div>
      ) : null}
    </div>
  );
}

function GlobalCard({ totals, hist }){
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: 16,
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 18px 40px rgba(0,0,0,.22)",
        minHeight: 170
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(0,255,220,.10), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.10), transparent 35%)"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 150px",
          gap: 12,
          alignItems: "stretch",
          minHeight: 125
        }}
      >
        <div>
          <Metric label="RX" value={fmtMbps(totals?.rx)} accent="#00f5d4" />
          <Metric label="TX" value={fmtMbps(totals?.tx)} accent="#7aa2ff" />
          <Metric label="Total" value={fmtMbps(totals?.total)} accent="#ffb84d" />
        </div>

        <MiniSpark
          rxValues={hist?.rx || []}
          txValues={hist?.tx || []}
          height={125}
        />
      </div>
    </div>
  );
}

function EthernetCard({ item, hist }){
  const rx = num(item?.rxMbps);
  const tx = num(item?.txMbps);
  const total = rx + tx;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: 16,
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 18px 40px rgba(0,0,0,.22)",
        minHeight: 235
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(0,255,220,.10), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.10), transparent 35%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
          {item?.name || item?.id || "Ethernet"}
        </div>

        <div style={{ opacity: 0.68, marginBottom: 10, fontSize: 12 }}>
          {item?.ip || "—"} {item?.ifName ? `• ${item.ifName}` : ""} {item?.ifIndex ? `• ifIndex ${item.ifIndex}` : ""}
        </div>

        <div style={{ marginBottom: 8 }}>
          <StatusPill label="Status" value={item?.status} />
          <StatusPill label="Admin" value={item?.admin} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 150px",
            gap: 12,
            alignItems: "stretch"
          }}
        >
          <div>
            <Metric label="RX" value={fmtMbps(rx)} accent="#00f5d4" />
            <Metric label="TX" value={fmtMbps(tx)} accent="#7aa2ff" />
            <Metric label="Total" value={fmtMbps(total)} accent="#ffb84d" />
            <Metric label="Link Speed" value={fmtSpeed(item?.speedMb)} accent="#ffffff" />
          </div>

          <MiniSpark
            rxValues={hist?.rx || []}
            txValues={hist?.tx || []}
            height={125}
          />
        </div>
      </div>
    </div>
  );
}

export default function EthernetTrafficPage(){
  const [data, setData] = useState([]);
  const [hist, setHist] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load(){
      try{
        const r = await fetch(`${API_BASE}/api/eth/snapshot`, { cache: "no-store" });
        const j = await r.json();

        if(!j?.ok) throw new Error(j?.error || "snapshot failed");

        const arr = Array.isArray(j?.data) ? j.data : [];

        if(!alive) return;

        setErr("");
        setData(arr);

        setHist(prev => {
          const next = { ...prev };

          let totalRx = 0;
          let totalTx = 0;

          for(const it of arr){
            const id = String(it?.id || it?.name || it?.ip || Math.random());
            const rx = num(it?.rxMbps);
            const tx = num(it?.txMbps);

            totalRx += rx;
            totalTx += tx;

            if(!next[id]){
              next[id] = { rx: [], tx: [], total: [] };
            }

            next[id] = {
              rx: [...next[id].rx, rx].slice(-WINDOW),
              tx: [...next[id].tx, tx].slice(-WINDOW),
              total: [...next[id].total, rx + tx].slice(-WINDOW)
            };
          }

          if(!next.__global){
            next.__global = { rx: [], tx: [], total: [] };
          }

          next.__global = {
            rx: [...next.__global.rx, totalRx].slice(-WINDOW),
            tx: [...next.__global.tx, totalTx].slice(-WINDOW),
            total: [...next.__global.total, totalRx + totalTx].slice(-WINDOW)
          };

          return next;
        });
      } catch(e){
        if(!alive) return;
        setErr(String(e?.message || e || "Unknown error"));
      }
    }

    load();
    const t = setInterval(load, 2000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const totals = useMemo(() => {
    const rx = data.reduce((s, x) => s + num(x?.rxMbps), 0);
    const tx = data.reduce((s, x) => s + num(x?.txMbps), 0);
    return { rx, tx, total: rx + tx };
  }, [data]);

  return (
    <div style={{ padding: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
          maxWidth: '100%'
        }}
      >{data.filter(x => !String(x?.id || "").startsWith("uplink_")).map((it, idx) => {
          const id = String(it?.id || it?.name || it?.ip || idx);
          return (
            <EthernetCard
              key={id}
              item={it}
              hist={hist[id] || { rx: [], tx: [], total: [] }}
            />
          );
        })}
      </div>
    </div>
  );
}












