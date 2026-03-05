import React, { useEffect, useMemo, useRef, useState } from "react";


import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from "recharts";

/* MINI-THROUGHPUT-CHART-V4-START */
const MiniThroughputChart = ({ series, height=84, maxMbps=null, kind="RX" }) => {
  const arr = Array.isArray(series) ? series : [];
  const vals = arr.map(v => (Number.isFinite(Number(v)) ? Number(v) : null));
  const finite = vals.filter(v => typeof v === "number" && isFinite(v));

  const localMax = finite.length ? Math.max(...finite) : 0;
  const localAvg = finite.length ? (finite.reduce((a,b)=>a+b,0) / finite.length) : 0;
  const m = Math.max(1, Number(maxMbps) || Math.max(10, localMax));

  const rows = vals.map((v, i) => ({
    i,
    mbps: (typeof v === "number") ? v : null,
    p: (typeof v === "number") ? Math.max(0, Math.min(100, (v / m) * 100)) : null,
  }));

  // last finite value
  let last = null;
  for(let i=rows.length-1;i>=0;i--){
    if(typeof rows[i].mbps === "number"){ last = rows[i].mbps; break; }
  }

  const Tip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const mb = payload[0] && payload[0].payload ? payload[0].payload.mbps : null;
    const shown = (typeof mb === "number") ? mb.toFixed(2) : "-";
    return (
      <div style={{
        padding:"8px 10px",
        borderRadius:12,
        background:"rgba(12,16,26,.78)",
        border:"1px solid rgba(255,255,255,.10)",
        boxShadow:"0 10px 30px rgba(0,0,0,.35)",
        backdropFilter:"blur(10px)",
        fontSize:12,
        color:"rgba(255,255,255,.94)"
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
          <div style={{opacity:.9, fontWeight:950, letterSpacing:.3}}>{kind}</div>
          <div style={{
            fontSize:11,
            fontWeight:900,
            padding:"2px 8px",
            borderRadius:999,
            background:"rgba(120,200,255,.14)",
            border:"1px solid rgba(120,200,255,.20)",
            color:"rgba(200,245,255,.92)"
          }}>
            {m ? ("max " + Math.round(m) + " Mb") : "max"}
          </div>
        </div>
        <div style={{marginTop:4, fontWeight:950, fontSize:14}}>{shown} Mbps</div>
      </div>
    );
  };

  const gid = React.useMemo(() => "g_" + kind + "_" + Math.random().toString(16).slice(2), []);
  const fid = React.useMemo(() => "f_" + kind + "_" + Math.random().toString(16).slice(2), []);
  const bgid = React.useMemo(() => "bg_" + kind + "_" + Math.random().toString(16).slice(2), []);

  const lastText = (typeof last === "number") ? (last.toFixed(1) + " Mbps") : "--";
  const avgP = (localAvg && m) ? Math.max(0, Math.min(100, (localAvg / m) * 100)) : null;

  return (
    <div style={{
      position:"relative",
      height,
      borderRadius:18,
      overflow:"hidden",
      background:"radial-gradient(900px 220px at 20% 0%, rgba(120,200,255,.18), rgba(0,0,0,0)), linear-gradient(180deg, rgba(22,30,48,.62), rgba(10,14,22,.38))",
      border:"1px solid rgba(255,255,255,.07)",
      boxShadow:"0 18px 40px rgba(0,0,0,.35), inset 0 0 0 1px rgba(0,0,0,.25)"
    }}>
      {/* top glow line */}
      <div style={{
        position:"absolute", left:0, right:0, top:0, height:1,
        background:"linear-gradient(90deg, rgba(120,200,255,0), rgba(120,200,255,.55), rgba(120,200,255,0))",
        opacity:.55
      }} />

      {/* last badge */}
      <div style={{
        position:"absolute",
        top:10,
        right:10,
        zIndex:5,
        padding:"6px 10px",
        borderRadius:999,
        background:"rgba(12,16,26,.55)",
        border:"1px solid rgba(255,255,255,.10)",
        backdropFilter:"blur(10px)",
        color:"rgba(255,255,255,.92)",
        fontSize:12,
        fontWeight:950,
        letterSpacing:.2
      }}>
        {kind}: {lastText}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, bottom: 6, left: 12 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(140,220,255,.85)" />
              <stop offset="55%" stopColor="rgba(140,220,255,.18)" />
              <stop offset="100%" stopColor="rgba(140,220,255,0)" />
            </linearGradient>

            <linearGradient id={bgid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,.06)" />
              <stop offset="50%" stopColor="rgba(255,255,255,.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,.06)" />
            </linearGradient>

            <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <YAxis hide domain={[0, 100]} />
          <Tooltip content={<Tip />} cursor={{ stroke:"rgba(255,255,255,.12)", strokeWidth:1 }} />

          {/* subtle grid feel (fake via background rect using defs) */}
          <rect x="0" y="0" width="100%" height="100%" fill={"url(#" + bgid + ")"} opacity="0.25" />

          {/* average reference line (very subtle) */}
          {typeof avgP === "number" ? (
            <line x1="0" x2="100%" y1={avgP} y2={avgP} />
          ) : null}

          <Area
            type="monotone"
            dataKey="p"
            connectNulls={false}
            stroke="rgba(175,240,255,.98)"
            strokeWidth={2.4}
            fill={"url(#" + gid + ")"}
            dot={false}
            isAnimationActive={false}
            filter={"url(#" + fid + ")"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
/* MINI-THROUGHPUT-CHART-V4-END */
const API_BASE = import.meta.env?.VITE_API_BASE || "";

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

function MiniChart({ series, height=48 }){
  const w=260, h=height;
  const vals = series.filter(v => typeof v === "number" && isFinite(v));
  const minV = vals.length ? Math.min(...vals) : 0;
  const maxV = vals.length ? Math.max(...vals) : 100;
  const span = Math.max(1, maxV-minV);
  const step = series.length>1 ? (w/(series.length-1)) : w;

  const pts = series.map((v,i) => {
    const x=i*step;
    const y = (v==null) ? (h-2) : (h-2) - (((v-minV)/span)*(h-10));
    return {x,y,v};
  });

  const d = (() => {
    if(!pts.length) return "";
    let p = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1], b=pts[i];
      const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
      p += ` Q ${a.x.toFixed(1)} ${a.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }
    const last=pts[pts.length-1];
    p += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return p;
  })();

  const area = d ? `${d} L ${w} ${h} L 0 ${h} Z` : "";
  const [hover, setHover] = useState(null);
  const gid = useMemo(()=>`ethGrad_${Math.random().toString(16).slice(2)}`,[]);

  function onMove(e){
    if(series.length===0) return;
    const rect=e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX-rect.left;
    const xSvg = clamp((xPx/rect.width)*w,0,w);
    const idx = clamp(Math.round(xSvg/step),0,series.length-1);
    const p = pts[idx];
    setHover({x:p.x,y:p.y,val:(typeof p.v==="number"?p.v:null)});
  }

  return (
    <svg className="ethSpark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      onMouseMove={onMove} onMouseLeave={()=>setHover(null)}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(150,245,255,.55)" />
          <stop offset="70%" stopColor="rgba(150,245,255,.10)" />
          <stop offset="100%" stopColor="rgba(150,245,255,0)" />
        </linearGradient>
      </defs>
      {area ? <path className="ethArea" d={area} fill={`url(#${gid})`} /> : null}
      {d ? <path className="ethLine" d={d} fill="none" strokeWidth="2.2" /> : null}
      {hover && hover.val!=null ? (
        <g>
          <line x1={hover.x} x2={hover.x} y1="0" y2={h} stroke="rgba(255,255,255,.18)" strokeDasharray="4 4" />
          <circle cx={hover.x} cy={hover.y} r="3.6" fill="rgba(150,245,255,.95)" />
          <g transform={`translate(${Math.min(hover.x + 8, w - 70)}, ${Math.max(hover.y - 18, 12)})`}>
            <rect x="0" y="-12" rx="6" ry="6" width="66" height="18" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.10)" />
            <text x="8" y="1" fill="rgba(255,255,255,.95)" fontSize="11" fontWeight="800">
              {Math.round(hover.val)} Mbps
            </text>
          </g>
        </g>
      ) : null}
    </svg>
  );
}

function useInterval(cb, ms){
  const ref = useRef(cb);
  useEffect(()=>{ ref.current = cb; },[cb]);
  useEffect(()=>{
    if(ms==null) return;
    const t=setInterval(()=>ref.current(), ms);
    return ()=>clearInterval(t);
  },[ms]);
}

export default function EthernetTrafficPage(){
  const WINDOW = 60;
  const [data, setData] = useState([]);
  const [hist, setHist] = useState({}); // id -> {rx:[], tx:[]}

  useInterval(async ()=>{
    try{
      const r = await fetch(`${API_BASE}/api/eth/snapshot`, { cache:"no-store" });
      const j = await r.json();
      if(!j?.ok) throw new Error(j?.error || "snapshot failed");
      const arr = j.data || [];
      setData(arr);

      setHist(prev=>{
        const next = { ...prev };
        for(const it of arr){
          const id = it.id || it.name;
          if(!next[id]) next[id] = { rx:[], tx:[] };
          const rx = (typeof it.rxMbps === "number") ? it.rxMbps : null;
          const tx = (typeof it.txMbps === "number") ? it.txMbps : null;
          next[id] = {
            rx: [...next[id].rx, rx].slice(-WINDOW),
            tx: [...next[id].tx, tx].slice(-WINDOW),
          };
        }
        return next;
      });

    } catch(e){
      // keep last data; show errors inside cards (from backend)
    }
  }, 1000);

  return (
    <div className="ethWrap">
      <div className="ethTop">
        <div className="ethTitle">Ethernet Speed + Traffic</div>
      </div>

      <div className="ethGrid">
        {data.map(it=>{
          const id = it.id || it.name;
          const h = hist[id] || { rx:[], tx:[] };
          const up = it.ok && it.status === "up" && it.admin === "up";
          const speed = (typeof it.speedMb === "number" && it.speedMb>0) ? `${it.speedMb} Mbps` : "—";
          const rx = (typeof it.rxMbps === "number") ? it.rxMbps.toFixed(2) : "—";
          const tx = (typeof it.txMbps === "number") ? it.txMbps.toFixed(2) : "—";

          return (
            <div key={id} className={"ethCard " + (up ? "ok" : "down")}>
              <div className="ethHead">
                <div>
                  <div className="ethName">{it.name}</div>
                  <div className="ethSub">{it.ip ? it.ip : "IP: (missing)"} {it.ifName ? `• ${it.ifName}` : ""}</div>
                </div>

                <div className="ethPill">
                  <span className="ethDot"></span>
                  {up ? "UP" : (it.error === "CONFIG_MISSING" ? "CONFIG" : "DOWN")}
                </div>
              </div>

              <div className="ethMeta">
                <div className="ethStat">
                  <div className="ethLbl">Link</div>
                  <div className="ethVal">{speed}</div>
                </div>
                <div className="ethStat">
                  <div className="ethLbl">RX</div>
                  <div className="ethVal">{rx} Mbps</div>
                </div>
                <div className="ethStat">
                  <div className="ethLbl">TX</div>
                  <div className="ethVal">{tx} Mbps</div>
                </div>
              </div>

              <div className="ethCharts">
                <div className="ethChartBox">
                  <div className="ethChartLbl">RX (hover)</div>
                  <MiniThroughputChart series={h.rx} kind={"RX"} />
                </div>
                <div className="ethChartBox">
                  <div className="ethChartLbl">TX (hover)</div>
                  <MiniThroughputChart series={h.tx} kind={"TX"} />
                </div>
              </div>

              {!it.ok && it.error && it.error !== "CONFIG_MISSING" ? (
                <div className="ethErr">⚠ {it.error}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
