import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "";
const WINDOW = 24;

const UPLINK_IDS = [
  "uplink_dragon_club",
  "uplink_c5c_jabal",
  "uplink_to_office",
  "uplink_pharmacy",
  "uplink_abou_taher",
  "uplink_fast_web",
  "uplink_daraj_arid",
  "uplink_rawda"
];

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v){
  const n = num(v);
  if(n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function lineTone(v){
  const n = num(v);
  if(n < 20) return "#19ff9c";
  if(n < 80) return "#ffd166";
  return "#ff6b6b";
}

function gaugeTone(v){
  const n = num(v);
  if(n < 20) return "#19ff9c";
  if(n < 80) return "#ffd166";
  return "#ff6b6b";
}

function Sparkline({ values = [], label = "" }){
  const pts = (Array.isArray(values) ? values : []).map(x => num(x));
  const len = Math.max(pts.length, 2);
  const w = 230;
  const h = 34;
  const pad = 4;
  const max = Math.max(1, ...pts, 1);

  const [hover, setHover] = useState(null);

  const coords = Array.from({ length: len }, (_, i) => {
    const v = num(pts[i] ?? 0);
    const x = len <= 1 ? pad : pad + (i * (w - pad * 2)) / (len - 1);
    const y = h - (((v / max) * (h - pad * 2)) + pad);
    return { x, y, v };
  });

  function pathLine(list){
    return list.map(p => `${p.x},${p.y}`).join(" ");
  }

  function onMove(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(len - 1, Math.round((x / rect.width) * (len - 1))));
    setHover(idx);
  }

  const line = pathLine(coords);
  const last = coords[coords.length - 1];
  const tone = lineTone(last?.v ?? 0);

  return (
    <div
      style={{ position:"relative", height:h }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      title={label}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:"100%", height:h }}>
        <line
          x1="0" y1={h - 2}
          x2={w} y2={h - 2}
          stroke="rgba(255,255,255,.06)"
          strokeWidth="1"
        />
        <polyline
          points={line}
          fill="none"
          stroke={tone}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter:`drop-shadow(0 0 3px ${tone})` }}
        />
        <circle cx={last.x} cy={last.y} r="2.1" fill={tone} />
      </svg>

      <div
        style={{
          position:"absolute",
          left:"50%",
          top:"50%",
          width:"74%",
          height:"2px",
          transform:"translate(-50%, -50%) scaleX(0.08)",
          transformOrigin:"center center",
          borderRadius:"999px",
          background:`linear-gradient(90deg, transparent 0%, ${tone}33 18%, ${tone} 50%, ${tone}33 82%, transparent 100%)`,
          filter:`blur(1px) drop-shadow(0 0 14px ${tone})`,
          animation:"uplinkPulse 3.2s ease-in-out infinite",
          pointerEvents:"none",
          opacity:.78
        }}
      />

      {hover !== null ? (
        <div
          style={{
            position:"absolute",
            right:0,
            top:-18,
            fontSize:11,
            fontWeight:800,
            padding:"3px 7px",
            borderRadius:8,
            background:"rgba(8,10,18,.92)",
            border:"1px solid rgba(255,255,255,.10)",
            color:"#fff",
            whiteSpace:"nowrap"
          }}
        >
          {fmtMbps(coords[hover]?.v ?? 0)}
        </div>
      ) : null}
    </div>
  );
}

function Gauge({ item, hist }){
  const rx = num(item?.rxMbps);
  const tx = num(item?.txMbps);
  const total = rx + tx;

  const size = 170;
  const cx = 85;
  const cy = 86;
  const r = 58;
  const stroke = 10;
  const maxGauge = 150;
  const pct = Math.max(0, Math.min(1, total / maxGauge));
  const start = 150;
  const arc = 240;
  const valEnd = start + (arc * pct);

  function polar(angleDeg){
    const a = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a)
    };
  }

  function arcPath(a1, a2){
    const p1 = polar(a1);
    const p2 = polar(a2);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  const bg = arcPath(start, start + arc);
  const fg = pct > 0 ? arcPath(start, valEnd) : "";
  const color = gaugeTone(total);

  return (
    <div
      style={{
        position:"relative",
        overflow:"hidden",
        borderRadius:20,
        padding:14,
        background:"linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border:"1px solid rgba(255,255,255,.08)",
        boxShadow:"0 14px 34px rgba(0,0,0,.22)"
      }}
    >
      <div
        style={{
          position:"absolute",
          inset:0,
          pointerEvents:"none",
          background:"radial-gradient(circle at top right, rgba(0,255,220,.06), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.06), transparent 35%)"
        }}
      />

      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}>
          <div style={{ width:size, height:size, position:"relative" }}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ width:size, height:size, display:"block" }}>
              <path d={bg} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth={stroke} strokeLinecap="round" />
              {fg ? (
                <path
                  d={fg}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  style={{ filter:`drop-shadow(0 0 14px ${color})` }}
                />
              ) : null}
            </svg>

            <div
              style={{
                position:"absolute",
                inset:0,
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                textAlign:"center", pointerEvents:"none", padding:"0 4px"
              }}
            >
              <div style={{ fontSize:22, fontWeight:900, color }}>
                {total.toFixed(1)}
                <span style={{ fontSize:11, marginLeft:3, opacity:.92 }}>Mbps</span>
              </div>
              <div style={{ fontSize:13, fontWeight:800, marginTop:4, lineHeight:1.15, maxWidth:88 }}>
                {item?.name || item?.id || "Uplink"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign:"center",
            fontSize:11,
            opacity:.72,
            marginTop:2,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis"
          }}
          title={item?.ip || ""}
        >
          {item?.ip || "—"}
        </div>

        <div style={{ marginTop:10 }}>
          <Sparkline
            values={hist?.total || []}
            label={`${item?.name || ""} • RX ${fmtMbps(rx)} • TX ${fmtMbps(tx)} • Total ${fmtMbps(total)}`}
          />
        </div>

        <div
          style={{
            display:"grid",
            gridTemplateColumns:"1fr 1fr 1fr",
            gap:8,
            marginTop:8
          }}
        >
          <div style={{ fontSize:11, opacity:.72 }}>
            RX<br /><strong style={{ color:"#19ff9c", fontSize:13 }}>{fmtMbps(rx)}</strong>
          </div>
          <div style={{ fontSize:11, opacity:.72, textAlign:"center" }}>
            TX<br /><strong style={{ color:"#7aa2ff", fontSize:13 }}>{fmtMbps(tx)}</strong>
          </div>
          <div style={{ fontSize:11, opacity:.72, textAlign:"right" }}>
            Port<br /><strong style={{ color:"#fff", fontSize:13 }}>{item?.ifName || "—"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UplinkTrafficPage(){
  const [data, setData] = useState([]);
  const [hist, setHist] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load(){
      try{
        const r = await fetch(`${API_BASE}/api/eth/snapshot`, { cache:"no-store" });
        const j = await r.json();
        if(!j?.ok) throw new Error(j?.error || "snapshot failed");

        const arr = (Array.isArray(j?.data) ? j.data : []).filter(x => UPLINK_IDS.includes(String(x?.id || "")));

        if(!alive) return;

        const sorted = [...arr].sort((a,b) => UPLINK_IDS.indexOf(String(a?.id || "")) - UPLINK_IDS.indexOf(String(b?.id || "")));

        setData(sorted);
        setErr("");

        setHist(prev => {
          const next = { ...prev };
          for(const it of sorted){
            const id = String(it?.id || "");
            const rx = num(it?.rxMbps);
            const tx = num(it?.txMbps);
            if(!next[id]) next[id] = { rx: [], tx: [], total: [] };
            next[id] = {
              rx: [...next[id].rx, rx].slice(-WINDOW),
              tx: [...next[id].tx, tx].slice(-WINDOW),
              total: [...next[id].total, rx + tx].slice(-WINDOW)
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
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const totalNow = useMemo(() => data.reduce((s,x) => s + num(x?.rxMbps) + num(x?.txMbps), 0), [data]);

  return (
    <div style={{ padding: 14 }}>
      <style>{`
        @keyframes uplinkPulse {
          0%   { transform: translate(-50%, -50%) scaleX(0.08); opacity: 0; }
          14%  { opacity: .95; }
          48%  { transform: translate(-50%, -50%) scaleX(1); opacity: .88; }
          78%  { opacity: .28; }
          100% { transform: translate(-50%, -50%) scaleX(1.12); opacity: 0; }
        }
      `}</style>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>UPLINK Traffic</div>
        <div style={{ opacity: .68, fontSize: 13 }}>
          8 core uplinks • live speed gauges • total now <strong style={{ color:"#8cd2ff" }}>{fmtMbps(totalNow)}</strong>
        </div>
      </div>

      {err ? (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 12,
            color:"#ff8a80",
            background:"rgba(255,90,90,.08)",
            border:"1px solid rgba(255,90,90,.18)"
          }}
        >
          {err}
        </div>
      ) : null}

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",
          gap:14,
          maxWidth: 1500
        }}
      >
        {data.map((it) => {
          const id = String(it?.id || "");
          return (
            <Gauge
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