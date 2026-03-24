import React, { useEffect, useMemo, useState } from "react";

const PUBLIC_TARGETS = [
  { name: "Facebook", host: "www.fb.com" },
  { name: "Google", host: "www.google.com" },
  { name: "Yahoo", host: "www.yahoo.com" },
  { name: "TikTok", host: "www.tiktok.com" },
  { name: "PUBG Mobile", host: "www.pubgmobile.com" }
];

const CORE_TARGETS = [
  { name: "DNS",   host: "10.0.25.10" },
  { name: "ROUTE", host: "192.168.99.1" },
  { name: "GGC",   host: "185.89.85.162" }
];

function asNum(v){
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function tone(avg, timeouts){
  if(timeouts >= 2) return { label: "BAD", color: "#ff6b6b" };
  if(avg == null) return { label: "UNKNOWN", color: "rgba(255,255,255,.55)" };
  if(avg < 70) return { label: "GOOD", color: "#19ff9c" };
  if(avg < 140) return { label: "DEGRADED", color: "#ffd166" };
  return { label: "BAD", color: "#ff6b6b" };
}

function gaugeTone(ms){
  if(ms == null) return { color: "#9aa4b2", glow: "rgba(154,164,178,.16)" };
  if(ms < 70) return { color: "#19ff9c", glow: "rgba(25,255,156,.18)" };
  if(ms < 140) return { color: "#ffd166", glow: "rgba(255,209,102,.18)" };
  return { color: "#ff6b6b", glow: "rgba(255,107,107,.18)" };
}

function Gauge({ name, ip, value }){
  const size = 102;
  const cx = 51;
  const cy = 53;
  const r = 34;
  const stroke = 7;

  const maxMs = 220;
  const pct = value == null ? 0 : Math.max(0, Math.min(1, value / maxMs));
  const arc = 240;
  const start = 150;
  const end = start + arc;
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

  const bgPath = arcPath(start, end);
  const fgPath = pct > 0 ? arcPath(start, valEnd) : "";
  const t = gaugeTone(value);

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 6,
        background: "linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,.015))",
        border: "1px solid rgba(255,255,255,.06)",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: 'flex-start'
      }}
    >
      <div style={{ width: 102, height: 102, position: "relative" }}>
        <svg
          viewBox="0 0 102 102"
          style={{ width: "102px", height: "102px", display: "block" }}
        >
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255,255,255,.10)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {fgPath ? (
            <path
              d={fgPath}
              fill="none"
              stroke={t.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${t.glow})` }}
            />
          ) : null}
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: 'flex-start',
            pointerEvents: "none",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: t.color, lineHeight: 1 }}>
            {value == null ? "--" : `${value}`}
            <span style={{ fontSize: 9, marginLeft: 3, opacity: .95 }}>ms</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, marginTop: 5, letterSpacing: .2 }}>
            {name}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 2,
          fontSize: 9,
          opacity: .62,
          textAlign: "center",
          maxWidth: '100%',
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
        title={ip}
      >
        {ip}
      </div>
    </div>
  );
}

export default function InternetHealthBox(){
  const [publicLatest, setPublicLatest] = useState({});
  const [coreLatest, setCoreLatest] = useState({});

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
    const nextPublic = {};
    const nextCore = {};

    for(const t of PUBLIC_TARGETS){
      nextPublic[t.host] = await ping(t.host);
    }

    for(const t of CORE_TARGETS){
      nextCore[t.host] = await ping(t.host);
    }

    setPublicLatest(nextPublic);
    setCoreLatest(nextCore);
  }

  useEffect(() => {
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  const summary = useMemo(() => {
    const vals = Object.values(publicLatest).map(asNum);
    const good = vals.filter(v => v != null);
    const timeouts = vals.filter(v => v == null).length;
    const avg = good.length ? Math.round(good.reduce((a,b)=>a+b,0) / good.length) : null;
    const slow = good.filter(v => v >= 70).length;
    const t = tone(avg, timeouts);

    return {
      avg,
      slow,
      timeouts,
      status: t.label,
      color: t.color
    };
  }, [publicLatest]);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 10,
        background: "linear-gradient(180deg, rgba(10,14,24,.96), rgba(7,10,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 14px 34px rgba(0,0,0,.24)",
        minHeight: 0
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontWeight:900, fontSize:18 }}>Internet Health</div>
        <div style={{ fontSize:12, fontWeight:900, color: summary.color }}>
          {summary.status}
        </div>
      </div>

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(4, minmax(100px, 1fr))",
          gap:8,
          marginBottom:10
        }}
      >
        <div style={{ padding:"8px 10px", borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:11, opacity:.68, marginBottom:4 }}>Status</div>
          <div style={{ fontSize:16, fontWeight:900, color: summary.color }}>{summary.status}</div>
        </div>

        <div style={{ padding:"8px 10px", borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:11, opacity:.68, marginBottom:4 }}>Avg Latency</div>
          <div style={{ fontSize:16, fontWeight:900, color:"#8cd2ff" }}>
            {summary.avg == null ? "--" : `${summary.avg} ms`}
          </div>
        </div>

        <div style={{ padding:"8px 10px", borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:11, opacity:.68, marginBottom:4 }}>Slow Servers</div>
          <div style={{ fontSize:16, fontWeight:900, color:"#ffd166" }}>{summary.slow}</div>
        </div>

        <div style={{ padding:"8px 10px", borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:11, opacity:.68, marginBottom:4 }}>Timeouts</div>
          <div style={{ fontSize:16, fontWeight:900, color:"#ff6b6b" }}>{summary.timeouts}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
          gap: 10
        }}
      >
        {CORE_TARGETS.map((t) => (
          <Gauge
            key={t.host}
            name={t.name}
            ip={t.host}
            value={coreLatest[t.host] ?? null}
          />
        ))}
      </div>
    </div>
  );
}







