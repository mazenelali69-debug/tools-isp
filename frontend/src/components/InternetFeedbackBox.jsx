import React, { useEffect, useMemo, useState } from "react";

const TARGETS = [
  { name: "Facebook", host: "www.fb.com" },
  { name: "Google", host: "www.google.com" },
  { name: "Yahoo", host: "www.yahoo.com" },
  { name: "TikTok", host: "www.tiktok.com" },
  { name: "PUBG Mobile", host: "www.pubgmobile.com" }
];

const HISTORY_LEN = 18;

function asNum(v){
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function tone(ms){
  if(ms == null) return {
    label: "Timeout",
    color: "rgba(190,200,215,.70)",
    glow: "rgba(190,200,215,.12)"
  };
  if(ms < 70) return {
    label: "Healthy",
    color: "#19ff9c",
    glow: "rgba(25,255,156,.16)"
  };
  if(ms < 140) return {
    label: "Moderate",
    color: "#ffd166",
    glow: "rgba(255,209,102,.14)"
  };
  return {
    label: "Slow",
    color: "#ff6b6b",
    glow: "rgba(255,107,107,.14)"
  };
}

function trendText(values){
  const clean = (values || []).map(asNum).filter(v => v != null);
  if(clean.length < 2) return "stable";
  const a = clean[clean.length - 2];
  const b = clean[clean.length - 1];
  const d = b - a;
  if(Math.abs(d) < 3) return "stable";
  return d < 0 ? "improving" : "rising";
}

function MiniLine({ values = [], delay = "0s" }){
  const pts = (values || []).map(asNum);
  const clean = pts.filter(v => v != null);

  const w = 240;
  const h = 26;
  const px = 4;
  const py = 4;

  if(!clean.length){
    return (
      <div style={{ position:"relative", height: h, opacity: .22, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,.08)" }} />
      </div>
    );
  }

  const minV = Math.min(...clean);
  const maxV = Math.max(...clean);
  const span = Math.max(10, maxV - minV);

  const coords = pts.map((v, i) => {
    const x = pts.length <= 1 ? px : px + (i * (w - px * 2)) / Math.max(1, pts.length - 1);
    const vv = v == null ? maxV : v;
    const y = h - py - (((vv - minV) / span) * (h - py * 2));
    return { x, y, v };
  });

  const d = coords.map(p => `${p.x},${p.y}`).join(" ");
  const last = coords[coords.length - 1];
  const info = tone(last?.v ?? null);

  return (
    <div style={{ position:"relative", height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, overflow: "visible", display:"block", position:"relative", zIndex:2 }}>
        <line
          x1="0" y1={h - 3}
          x2={w} y2={h - 3}
          stroke="rgba(255,255,255,.06)"
          strokeWidth="1"
        />
        <polyline
          points={d}
          fill="none"
          stroke={info.color}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${info.glow})` }}
        />
        <circle cx={last.x} cy={last.y} r="2.1" fill={info.color} />
        <circle cx={last.x} cy={last.y} r="4.5" fill={info.glow} />
      </svg>

      <div
        style={{
          position:"absolute",
          left:"50%",
          top:"50%",
          width:"72%",
          height:"2px",
          transform:"translate(-50%, -50%) scaleX(0.08)",
          transformOrigin:"center center",
          borderRadius:"999px",
          background:`linear-gradient(90deg, transparent 0%, ${info.glow} 16%, ${info.color} 50%, ${info.glow} 84%, transparent 100%)`,
          filter:`blur(1px) drop-shadow(0 0 6px ${info.glow})`,
          animation:"netPulseCenter 3.4s ease-in-out infinite",
          animationDelay: delay,
          pointerEvents:"none",
          zIndex:1,
          opacity:.85
        }}
      />
    </div>
  );
}

export default function InternetFeedbackBox(){
  const [latest, setLatest] = useState({});
  const [history, setHistory] = useState(() => {
    const o = {};
    for(const t of TARGETS) o[t.host] = [];
    return o;
  });

  async function ping(host){
    try{
      const r = await fetch("/api/ping?ip=" + encodeURIComponent(host), { cache: "no-store" });
      const j = await r.json();
      if(!j || j.ok === false) return null;
      return asNum(j.timeMs ?? j.ms);
    }catch{
      return null;
    }
  }

  async function tick(){
    const next = {};
    for(const t of TARGETS){
      next[t.host] = await ping(t.host);
    }

    setLatest(next);

    setHistory(prev => {
      const copy = { ...prev };
      for(const t of TARGETS){
        const arr = Array.isArray(copy[t.host]) ? copy[t.host].slice() : [];
        arr.push(next[t.host]);
        copy[t.host] = arr.slice(-HISTORY_LEN);
      }
      return copy;
    });
  }

  useEffect(() => {
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  const avg = useMemo(() => {
    const vals = Object.values(latest).map(asNum).filter(v => v != null);
    if(!vals.length) return null;
    return Math.round(vals.reduce((a,b) => a + b, 0) / vals.length);
  }, [latest]);

  return (
    <>
      <style>{`
        @keyframes netPulseCenter {
          0%   { transform: translate(-50%, -50%) scaleX(0.08); opacity: 0; }
          12%  { opacity: .95; }
          48%  { transform: translate(-50%, -50%) scaleX(1); opacity: .9; }
          78%  { opacity: .30; }
          100% { transform: translate(-50%, -50%) scaleX(1.12); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          borderRadius: 14,
          padding: 10,
          background: "linear-gradient(180deg, rgba(9,13,22,.94), rgba(7,10,18,.90))",
          border: "1px solid rgba(255,255,255,.06)",
          boxShadow: "0 10px 24px rgba(0,0,0,.20)"
        }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:14 }}>Internet Feedback</div>
            <div style={{ fontSize:10, opacity:.50, marginTop:2 }}>Live network feel</div>
          </div>
          <div style={{ fontSize:11, opacity:.68 }}>
            Avg: <span style={{ color:"#8cd2ff", fontWeight:800 }}>{avg == null ? "--" : `${avg} ms`}</span>
          </div>
        </div>

        <div style={{ display:"grid", gap:4 }}>
          {TARGETS.map((t, idx) => {
            const ms = latest[t.host] ?? null;
            const values = history[t.host] || [];
            const info = tone(ms);

            return (
              <div
                key={t.host}
                style={{
                  display:"grid",
                  gridTemplateColumns:"94px 1fr 88px",
                  gap:10,
                  alignItems:"center",
                  minHeight: 66,
                  padding:"5px 6px",
                  borderRadius:10,
                  background:"rgba(255,255,255,.015)",
                  border:"1px solid rgba(255,255,255,.035)"
                }}
              >
                <div>
                  <div style={{ fontSize:11, fontWeight:800, lineHeight:1.1 }}>{t.name}</div>
                  <div style={{ fontSize:9, color:info.color, opacity:.88, marginTop:2 }}>{info.label}</div>
                </div>

                <MiniLine values={values} delay={`${idx * 0.22}s`} />

                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:900, color:info.color, lineHeight:1 }}>
                    {ms == null ? "--" : `${ms}ms`}
                  </div>
                  <div style={{ fontSize:9, opacity:.48, marginTop:3 }}>
                    {trendText(values)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}




