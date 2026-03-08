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
  if(n < 20) return "#7dff7a";
  if(n < 80) return "#ffb347";
  return "#ff5f6d";
}

function gaugeColorByRatio(r){
  if(r < 0.30) return "#7dff7a";
  if(r < 0.55) return "#b8d84e";
  if(r < 0.75) return "#ffb347";
  return "#ff5f6d";
}

function polar(cx, cy, r, angleDeg){
  const a = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a)
  };
}

function Sparkline({ values = [], label = "" }){
  const pts = (Array.isArray(values) ? values : []).map(x => num(x));
  const len = Math.max(pts.length, 2);
  const w = 240;
  const h = 28;
  const pad = 4;
  const max = Math.max(1, ...pts, 1);

  const [hover, setHover] = useState(null);

  const coords = Array.from({ length: len }, (_, i) => {
    const v = num(pts[i] ?? 0);
    const x = len <= 1 ? pad : pad + (i * (w - pad * 2)) / (len - 1);
    const y = h - (((v / max) * (h - pad * 2)) + pad);
    return { x, y, v };
  });

  function onMove(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(len - 1, Math.round((x / rect.width) * (len - 1))));
    setHover(idx);
  }

  const line = coords.map(p => `${p.x},${p.y}`).join(" ");
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
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter:`drop-shadow(0 0 4px ${tone})` }}
        />
        <circle cx={last.x} cy={last.y} r="2.1" fill={tone} />
      </svg>

      {hover !== null ? (
        <div
          style={{
            position:"absolute",
            right:0,
            top:-18,
            fontSize:10,
            fontWeight:700,
            padding:"2px 6px",
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

function SegmentedGauge({ valueMbps, name, totalText }){
  const total = num(valueMbps);
  const maxGaugeMbps = 300;
  const ratio = Math.max(0, Math.min(1, total / maxGaugeMbps));

  const width = 314;
  const height = 232;
  const cx = 157;
  const cy = 176;
  const rOuter = 116;
  const rInner = 87;

  const start = -118;
  const end = 118;
  const segments = 34;
  const step = (end - start) / segments;
  const activeCount = Math.round(segments * ratio);

  const labels = [
    { text: "0",   angle: -118, r: 132, dx: -3, dy:  6 },
    { text: "30",  angle: -88,  r: 132, dx: -6, dy: -2 },
    { text: "60",  angle: -58,  r: 132, dx: -5, dy: -4 },
    { text: "90",  angle: -28,  r: 134, dx:  0, dy: -5 },
    { text: "120", angle: 2,    r: 136, dx:  0, dy: -2 },
    { text: "160", angle: 32,   r: 136, dx:  3, dy: -1 },
    { text: "200", angle: 62,   r: 136, dx:  4, dy:  0 },
    { text: "260", angle: 92,   r: 134, dx:  6, dy:  4 },
    { text: "300", angle: 118,  r: 132, dx:  5, dy:  8 }
  ];

  const mainColor = gaugeColorByRatio(ratio);

  return (
    <div style={{ display:"flex", justifyContent:"center" }}>
      <div style={{ width: 314, position:"relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width:"100%", height:232, display:"block" }}>
          {Array.from({ length: segments }, (_, i) => {
            const a1 = start + (i * step) + 1.4;
            const a2 = start + ((i + 1) * step) - 1.4;

            const p1 = polar(cx, cy, rOuter, a1);
            const p2 = polar(cx, cy, rOuter, a2);
            const p3 = polar(cx, cy, rInner, a2);
            const p4 = polar(cx, cy, rInner, a1);

            const fill = i < activeCount
              ? gaugeColorByRatio((i + 1) / segments)
              : "rgba(66,72,86,.72)";

            return (
              <path
                key={i}
                d={`M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 0 ${p4.x} ${p4.y} Z`}
                fill={fill}
                style={{
                  filter: i < activeCount ? `drop-shadow(0 0 5px ${fill})` : "none",
                  transition: "fill .25s ease"
                }}
              />
            );
          })}

          {labels.map((lab, i) => {
            const p = polar(cx, cy, lab.r, lab.angle);
            return (
              <text
                key={i}
                x={p.x + lab.dx}
                y={p.y + lab.dy}
                fill="rgba(255,255,255,.82)"
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ letterSpacing: ".2px" }}
              >
                {lab.text}
              </text>
            );
          })}
        </svg>

        <div
          style={{
            position:"absolute",
            left:0,
            right:0,
            top:128,
            textAlign:"center",
            pointerEvents:"none"
          }}
        >
          <div
            style={{
              fontSize:12,
              fontWeight:700,
              color:mainColor,
              lineHeight:1.12,
              maxWidth:136,
              marginLeft:"auto",
              marginRight:"auto",
              textAlign:"center",
              textWrap:"balance",
              letterSpacing:".15px", textShadow:`0 0 10px ${mainColor}22`
            }}
          >
            {name}
          </div>
        </div>

        <div
          style={{
            marginTop:6,
            textAlign:"center",
            fontSize:17,
            fontWeight:700,
            color:mainColor,
            letterSpacing:".2px",
            textShadow:`0 0 10px ${mainColor}22`
          }}
          title={totalText}
        >
          {totalText}
        </div>
      </div>
    </div>
  );
}

function GaugeCard({ item, hist }){
  const rx = num(item?.rxMbps);
  const tx = num(item?.txMbps);
  const total = rx + tx;

  return (
    <div
      style={{
        position:"relative",
        overflow:"hidden",
        borderRadius:22,
        padding:16,
        background:"linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border:"1px solid rgba(255,255,255,.08)",
        boxShadow:"0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)"
      }}
    >
      <div
        style={{
          position:"absolute",
          inset:0,
          pointerEvents:"none",
          background:"radial-gradient(circle at top right, rgba(0,255,220,.05), transparent 30%), radial-gradient(circle at bottom left, rgba(95,110,255,.06), transparent 35%)"
        }}
      />

      <div style={{ position:"relative", zIndex:1 }}>
        <SegmentedGauge
          valueMbps={total}
          name={item?.name || item?.id || "Uplink"}
          totalText={`${total.toFixed(2)} Mbps`}
        />

        <div style={{ marginTop:8 }}>
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
            marginTop:10
          }}
        >
          <div style={{ fontSize:10, opacity:.74 }}>
            RX<br /><strong style={{ color:"#7dff7a", fontSize:12 }}>{fmtMbps(rx)}</strong>
          </div>
          <div style={{ fontSize:10, opacity:.74, textAlign:"center" }}>
            TX<br /><strong style={{ color:"#7aa2ff", fontSize:12 }}>{fmtMbps(tx)}</strong>
          </div>
          <div style={{ fontSize:10, opacity:.74, textAlign:"right" }}>
            Port<br /><strong style={{ color:"#fff", fontSize:12 }}>{item?.ifName || "—"}</strong>
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
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const totalNow = useMemo(() => data.reduce((s,x) => s + num(x?.rxMbps) + num(x?.txMbps), 0), [data]);

  return (
    <div style={{ padding: 14 }}>
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
          gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",
          gap:16,
          maxWidth: 1500
        }}
      >
        {data.map((it) => {
          const id = String(it?.id || "");
          return (
            <GaugeCard
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