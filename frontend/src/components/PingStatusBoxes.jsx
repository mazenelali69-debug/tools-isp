import React, { useEffect, useState } from "react";

const TARGETS = [
  { name: "Facebook", host: "www.fb.com" },
  { name: "Google", host: "www.google.com" },
  { name: "TikTok", host: "www.tiktok.com" },
  { name: "Yahoo", host: "www.yahoo.com" },
  { name: "PUBG Mobile", host: "www.pubgmobile.com" }
];

const HISTORY_LEN = 18;

function latencyColor(ms){
  if(ms == null) return "rgba(255,255,255,.08)";
  if(ms < 20) return "#19ff9c";
  if(ms < 40) return "#c8f169";
  if(ms < 80) return "#ffb84d";
  if(ms < 140) return "#ff7a59";
  return "#ff4d4d";
}

function valueColor(ms){
  if(ms == null) return "rgba(255,255,255,.45)";
  if(ms < 20) return "#19ff9c";
  if(ms < 40) return "#c8f169";
  if(ms < 80) return "#ffb84d";
  if(ms < 140) return "#ff7a59";
  return "#ff4d4d";
}

export default function PingStatusBoxes(){
  const [history, setHistory] = useState(() => {
    const base = {};
    for(const t of TARGETS){
      base[t.host] = [];
    }
    return base;
  });

  const [latest, setLatest] = useState({});

  async function ping(host){
    try{
      const r = await fetch("/api/ping?ip=" + encodeURIComponent(host), { cache: "no-store" });
      const j = await r.json();
      if(!j || j.ok === false) return null;
      return (typeof j.timeMs === "number") ? j.timeMs : ((typeof j.ms === "number") ? j.ms : null);
    }catch{
      return null;
    }
  }

  async function updateNow(){
    const nextLatest = {};
    const nextValues = {};

    for(const t of TARGETS){
      const ms = await ping(t.host);
      nextLatest[t.host] = ms;
      nextValues[t.host] = ms;
    }

    setLatest(nextLatest);

    setHistory(prev => {
      const copy = { ...prev };
      for(const t of TARGETS){
        const arr = Array.isArray(copy[t.host]) ? copy[t.host].slice() : [];
        arr.push(nextValues[t.host]);
        copy[t.host] = arr.slice(-HISTORY_LEN);
      }
      return copy;
    });
  }

  useEffect(() => {
    updateNow();
    const timer = setInterval(updateNow, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: "linear-gradient(180deg, rgba(12,16,26,.92), rgba(8,11,18,.88))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 10px 28px rgba(0,0,0,.20)",
        marginTop: 10,
        marginBottom: 14,
        maxWidth: 760
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "150px 1fr 72px",
          gap: 10,
          alignItems: "center",
          marginBottom: 8,
          fontSize: 11,
          opacity: 0.58,
          fontWeight: 700,
          letterSpacing: ".2px"
        }}
      >
        <div>Target</div>
        <div>Latency history</div>
        <div style={{ textAlign: "right" }}>Now</div>
      </div>

      {TARGETS.map((t, idx) => {
        const arr = history[t.host] || [];
        const ms = latest[t.host];

        return (
          <div
            key={t.host}
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr 72px",
              gap: 10,
              alignItems: "center",
              padding: "7px 0",
              borderTop: idx === 0 ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(255,255,255,.05)"
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(255,255,255,.88)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={t.host}
            >
              {t.name}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${HISTORY_LEN}, 1fr)`,
                gap: 2,
                alignItems: "center",
                minHeight: 16
              }}
            >
              {Array.from({ length: HISTORY_LEN }, (_, i) => {
                const v = arr[i] ?? null;
                return (
                  <div
                    key={i}
                    title={v == null ? "No data" : `${v} ms`}
                    style={{
                      height:22,
                      borderRadius: 2,
                      background: latencyColor(v),
                      boxShadow: v == null ? "none" : "inset 0 0 0 1px rgba(255,255,255,.05)"
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                fontWeight: 900,
                color: valueColor(ms),
                whiteSpace: "nowrap"
              }}
            >
              {ms == null ? "--" : `${ms} ms`}
            </div>
          </div>
        );
      })}
    </div>
  );
}






