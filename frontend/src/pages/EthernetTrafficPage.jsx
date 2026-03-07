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

function MiniSpark({ values = [], color = "#00f5d4", fill = "rgba(0,255,212,.10)", height = 42 }){
  const pts = (Array.isArray(values) ? values : []).map(x => num(x));
  const max = Math.max(1, ...pts, 1);
  const w = 320;
  const h = height;

  const line = pts.map((v, i) => {
    const x = pts.length <= 1 ? 0 : (i * (w - 1)) / (pts.length - 1);
    const y = h - ((v / max) * (h - 10)) - 5;
    return `${x},${y}`;
  }).join(" ");

  const area = line
    ? `0,${h} ` + line + ` ${w},${h}`
    : `0,${h} ${w},${h}`;

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.07)",
        marginTop: 8
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={"g-" + color.replace(/[^a-z0-9]/gi, "")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <polyline
          fill={fill}
          stroke="none"
          points={area}
        />

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          points={line}
        />
      </svg>
    </div>
  );
}

function Metric({ label, value, accent }){
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: 12,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        marginBottom: 10
      }}
    >
      <div style={{ opacity: 0.82, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: accent || "white" }}>
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
        gap: 8,
        padding: "5px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        fontSize: 11,
        marginRight: 8,
        marginBottom: 8
      }}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      <strong style={{ color: statusTone(value) }}>{String(value || "unk").toUpperCase()}</strong>
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
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
          {item?.name || item?.id || "Ethernet"}
        </div>

        <div style={{ opacity: 0.68, marginBottom: 14, fontSize: 12 }}>
          {item?.ip || "—"} {item?.ifName ? `• ${item.ifName}` : ""} {item?.ifIndex ? `• ifIndex ${item.ifIndex}` : ""}
        </div>

        <div style={{ marginBottom: 8 }}>
          <StatusPill label="Status" value={item?.status} />
          <StatusPill label="Admin" value={item?.admin} />
        </div>

        <Metric label="RX" value={fmtMbps(rx)} accent="#00f5d4" />
        <Metric label="TX" value={fmtMbps(tx)} accent="#7aa2ff" />
        <Metric label="Total" value={fmtMbps(total)} accent="#ffb84d" />
        <Metric label="Link Speed" value={fmtSpeed(item?.speedMb)} accent="#ffffff" />

        <MiniSpark values={hist?.total || []} color="#00f5d4" fill="rgba(0,255,212,.12)" />
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

          for(const it of arr){
            const id = String(it?.id || it?.name || it?.ip || Math.random());
            const rx = num(it?.rxMbps);
            const tx = num(it?.txMbps);
            const total = rx + tx;

            if(!next[id]){
              next[id] = { rx: [], tx: [], total: [] };
            }

            next[id] = {
              rx: [...next[id].rx, rx].slice(-WINDOW),
              tx: [...next[id].tx, tx].slice(-WINDOW),
              total: [...next[id].total, total].slice(-WINDOW)
            };
          }

          return next;
        });
      } catch(e){
        if(!alive) return;
        setErr(String(e?.message || e || "Unknown error"));
      }
    }

    load();
    const t = setInterval(load, 7000);

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
    <div style={{ padding: 14 }}>      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          padding: 14,
          background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 18px 40px rgba(0,0,0,.22)",
          marginBottom: 14,
          maxWidth: 560
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
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
            Global Ethernet Overview
          </div>

          <div style={{ opacity: 0.68, marginBottom: 14, fontSize: 12 }}>
            Aggregated live values across all targets
          </div>

          <Metric label="RX" value={fmtMbps(totals.rx)} accent="#00f5d4" />
          <Metric label="TX" value={fmtMbps(totals.tx)} accent="#7aa2ff" />
          <Metric label="Total" value={fmtMbps(totals.total)} accent="#ffb84d" />

          {err ? (
            <div
              style={{
                marginTop: 8,
                color: "#ff7272",
                background: "rgba(255,90,90,.08)",
                border: "1px solid rgba(255,90,90,.18)",
                borderRadius: 12,
                padding: 12,
                whiteSpace: "pre-wrap"
              }}
            >
              Error: {String(err)}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
          maxWidth: 1400
        }}
      >
        {data.map((it, idx) => {
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




