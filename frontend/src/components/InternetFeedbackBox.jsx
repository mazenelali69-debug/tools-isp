import React, { useEffect, useMemo, useState } from "react";

const TARGETS = [
  { name: "Facebook", host: "www.fb.com" },
  { name: "Google", host: "www.google.com" },
  { name: "Yahoo", host: "www.yahoo.com" },
  { name: "TikTok", host: "www.tiktok.com" },
  { name: "PUBG Mobile", host: "www.pubgmobile.com" }
];

const HISTORY_LEN = 20;

function num(v){
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function lineColor(ms){
  if(ms == null) return "rgba(255,255,255,.22)";
  if(ms < 70) return "#19ff9c";
  if(ms < 140) return "#ffd166";
  return "#ff6b6b";
}

function toneText(ms){
  if(ms == null) return "Timeout";
  if(ms < 70) return "Healthy";
  if(ms < 140) return "Moderate";
  return "Slow";
}

function Sparkline({ values = [] }){
  const pts = values.map(v => num(v));
  const clean = pts.filter(v => v != null);
  const w = 220;
  const h = 34;
  const pad = 4;

  if(!clean.length){
    return (
      <div style={{ height: h, opacity: .45, fontSize: 11, display: "flex", alignItems: "center" }}>
        No data yet
      </div>
    );
  }

  const minV = Math.min(...clean);
  const maxV = Math.max(...clean);
  const span = Math.max(1, maxV - minV);

  const coords = pts.map((v, i) => {
    const x = pts.length <= 1 ? pad : pad + (i * (w - pad * 2)) / Math.max(1, pts.length - 1);
    const vv = v == null ? maxV : v;
    const y = h - pad - (((vv - minV) / span) * (h - pad * 2));
    return { x, y, v };
  });

  const line = coords.map(p => `${p.x},${p.y}`).join(" ");
  const last = coords[coords.length - 1];
  const color = lineColor(last?.v ?? null);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h }}>
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InternetFeedbackBox(){
  const [latest, setLatest] = useState({});
  const [history, setHistory] = useState(() => {
    const obj = {};
    for(const t of TARGETS) obj[t.host] = [];
    return obj;
  });

  async function ping(host){
    try{
      const r = await fetch("/api/ping?ip=" + encodeURIComponent(host), { cache: "no-store" });
      const j = await r.json();
      if(!j || j.ok === false) return null;
      return num(j.timeMs ?? j.ms);
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
    const vals = Object.values(latest).filter(v => typeof v === "number");
    if(!vals.length) return null;
    return Math.round(vals.reduce((a,b) => a + b, 0) / vals.length);
  }, [latest]);

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: "linear-gradient(180deg, rgba(12,16,26,.92), rgba(8,11,18,.88))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 10px 28px rgba(0,0,0,.20)"
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, gap:10 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Internet Feedback</div>
        <div style={{ fontSize: 12, opacity: .74 }}>
          Avg: {avg == null ? "--" : `${avg} ms`}
        </div>
      </div>

      <div style={{ display:"grid", gap:8 }}>
        {TARGETS.map((t) => {
          const ms = latest[t.host] ?? null;
          return (
            <div
              key={t.host}
              style={{
                display:"grid",
                gridTemplateColumns:"120px 1fr 74px",
                gap:10,
                alignItems:"center",
                padding:"6px 0",
                borderTop:"1px solid rgba(255,255,255,.05)"
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{t.name}</div>
                <div style={{ fontSize: 10, opacity: .55 }}>{toneText(ms)}</div>
              </div>

              <Sparkline values={history[t.host] || []} />

              <div style={{ textAlign:"right", fontSize:12, fontWeight:900, color: lineColor(ms) }}>
                {ms == null ? "--" : `${ms} ms`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
