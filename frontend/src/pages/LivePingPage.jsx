import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function Sparkline({ points, height = 78 }){
  const w = 320;
  const h = height;

  const [hover, setHover] = useState(null);

  const vals = points.filter(v => typeof v === "number" && isFinite(v));
  const minV = vals.length ? Math.min(...vals) : 0;
  const maxV = vals.length ? Math.max(...vals) : 100;
  const span = Math.max(1, (maxV - minV));

  const step = points.length > 1 ? (w / (points.length - 1)) : w;

  const pts = points.map((v,i) => {
    const x = i * step;
    const y = (v == null)
      ? (h - 4)
      : (h - 4) - (((v - minV) / span) * (h - 14));
    return { x, y, v };
  });

  const linePath = (() => {
    if(pts.length === 0) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for(let i=1;i<pts.length;i++){
      const p0 = pts[i-1];
      const p1 = pts[i];
      const cx = ((p0.x + p1.x) / 2);
      const cy = ((p0.y + p1.y) / 2);
      d += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }
    const last = pts[pts.length-1];
    d += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
  })();

  const areaPath = linePath ? `${linePath} L ${w} ${h} L 0 ${h} Z` : "";
  const gid = useMemo(() => `lpGrad_${Math.random().toString(16).slice(2)}`, []);

  function onMove(e){
    if(points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const xSvg = clamp((xPx / rect.width) * w, 0, w);
    const idx = clamp(Math.round(xSvg / step), 0, points.length - 1);
    const p = pts[idx];

    setHover({
      idx,
      x: p.x,
      y: p.y,
      val: (typeof p.v === "number" ? Math.round(p.v) : null)
    });
  }

  return (
    <svg
      className="lpSpark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      style={{
        width: "100%",
        height,
        display: "block"
      }}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(140,210,255,.55)" />
          <stop offset="65%" stopColor="rgba(140,210,255,.10)" />
          <stop offset="100%" stopColor="rgba(140,210,255,0)" />
        </linearGradient>
      </defs>

      {areaPath ? <path d={areaPath} fill={`url(#${gid})`} /> : null}
      {linePath ? <path d={linePath} fill="none" stroke="rgba(140,210,255,.95)" strokeWidth="2.2" /> : null}

      {hover ? (
        <g>
          <line
            x1={hover.x} x2={hover.x}
            y1="0" y2={h}
            stroke="rgba(255,255,255,.22)"
            strokeDasharray="4 4"
          />
          <circle cx={hover.x} cy={hover.y} r="3.6" fill="rgba(140,210,255,.95)" />
          <circle cx={hover.x} cy={hover.y} r="7" fill="rgba(140,210,255,.18)" />

          {hover.val != null ? (
            <g transform={`translate(${Math.min(hover.x + 8, w - 66)}, ${Math.max(hover.y - 18, 14)})`}>
              <rect x="0" y="-12" rx="6" ry="6" width="60" height="18" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.10)" />
              <text x="8" y="1" fill="rgba(255,255,255,.95)" fontSize="11" fontWeight="800">
                {hover.val} ms
              </text>
            </g>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

function pctLoss(points){
  if(!points.length) return 0;
  const total = points.length;
  const lost = points.filter(v => v == null).length;
  return Math.round((lost / total) * 100);
}

async function pingOnce(ip){
  const url = `${API_BASE}/api/ping/once?ip=${encodeURIComponent(ip)}`;
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json();
  if(!j || !j.ok) throw new Error(j?.error || "Ping failed");
  return j;
}

function useInterval(cb, ms){
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    if(ms == null) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [ms]);
}

function statusTone(up){
  return up ? "#00f5d4" : "#ff8a80";
}

function cardBorder(up){
  return up
    ? "1px solid rgba(255,255,255,.10)"
    : "1px solid rgba(255,120,120,.16)";
}

export default function LivePingPage(){
  const TARGETS = useMemo(() => ([
    { ip: "10.0.25.10",    name: "DNS-THGV" },
    { ip: "192.168.99.1",  name: "GETWAY-THGV" },
    { ip: "155.15.59.1",   name: "VLAN-CCR1036-12G-4S-THGV" },
    { ip: "155.15.59.4",   name: "AviatWTM4200-nocomment" },
    { ip: "112.24.30.1",   name: "VLAN-2-CCR1036-12G-4S-THGV" },
    { ip: "88.88.88.254",  name: "JetStream managed Switch" },
  ]), []);

  const WINDOW = 60;
  const [state, setState] = useState(() => {
    const obj = {};
    for(const t of TARGETS){
      obj[t.ip] = { points: [], last: null, err: null };
    }
    return obj;
  });

  const [running, setRunning] = useState(true);

  useInterval(async () => {
    if(!running) return;

    for(const t of TARGETS){
      try{
        const res = await pingOnce(t.ip);
        const val = (res.alive && typeof res.timeMs === "number") ? res.timeMs : null;

        setState(prev => {
          const cur = prev[t.ip] || { points: [], last: null, err: null };
          const nextPts = [...cur.points, val].slice(-WINDOW);
          return {
            ...prev,
            [t.ip]: { points: nextPts, last: res, err: null }
          };
        });
      } catch(e){
        setState(prev => {
          const cur = prev[t.ip] || { points: [], last: null, err: null };
          const nextPts = [...cur.points, null].slice(-WINDOW);
          return {
            ...prev,
            [t.ip]: { points: nextPts, last: null, err: String(e?.message || e) }
          };
        });
      }
    }
  }, 1000);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          Live Ping
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          Real-time latency and packet loss for selected targets
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
          maxWidth: '100%',
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.10)"
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: running ? "#00f5d4" : "#ffd166",
              boxShadow: running ? "0 0 10px rgba(0,245,212,.6)" : "0 0 10px rgba(255,209,102,.45)"
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            {running ? "LIVE RUNNING" : "PAUSED"}
          </div>
        </div>

        <button
          onClick={() => setRunning(v => !v)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(255,255,255,.04)",
            color: "white",
            cursor: "pointer",
            fontWeight: 800
          }}
        >
          {running ? "Pause" : "Resume"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 18,
          maxWidth: '100%'
        }}
      >
        {TARGETS.map(t => {
          const s = state[t.ip] || { points: [], last: null, err: null };
          const lastAlive = s.last?.alive === true;
          const lastMs = (typeof s.last?.timeMs === "number") ? s.last.timeMs : null;
          const loss = pctLoss(s.points);

          return (
            <div
              key={t.ip}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                padding: 18,
                background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
                border: cardBorder(lastAlive),
                boxShadow: "0 18px 40px rgba(0,0,0,.22)",
                minHeight: 290
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
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    {t.name}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>
                    {t.ip}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.08)",
                      fontSize: 12
                    }}
                  >
                    <span style={{ opacity: 0.75 }}>Status</span>
                    <strong style={{ color: statusTone(lastAlive) }}>
                      {lastAlive ? "UP" : "DOWN"}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.08)",
                      fontSize: 12
                    }}
                  >
                    <span style={{ opacity: 0.75 }}>Packet Loss</span>
                    <strong style={{ color: loss > 0 ? "#ffb84d" : "#00f5d4" }}>
                      {loss}%
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: 14,
                    alignItems: "stretch"
                  }}
                >
                  <div>
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.06)",
                        marginBottom: 10
                      }}
                    >
                      <div style={{ opacity: 0.78, fontSize: 12, marginBottom: 4 }}>Latency</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#8cd2ff" }}>
                        {lastMs != null ? `${Math.round(lastMs)} ms` : "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.06)"
                      }}
                    >
                      <div style={{ opacity: 0.78, fontSize: 12, marginBottom: 4 }}>Window</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>
                        {WINDOW}s
                      </div>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.74,
                        marginBottom: 8,
                        fontWeight: 700
                      }}
                    >
                      Latency Timeline
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.07)",
                        padding: 8
                      }}
                    >
                      <Sparkline points={s.points} />
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        height: 8,
                        borderRadius: 999,
                        overflow: "hidden",
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(255,255,255,.06)"
                      }}
                    >
                      <div
                        className={
                          "lpLossFill " +
                          (loss === 0 ? "ok" : loss <= 10 ? "warn" : "bad")
                        }
                        style={{ width: `${loss}%` }}
                      />
                    </div>
                  </div>
                </div>

                {s.err ? (
                  <div
                    style={{
                      marginTop: 12,
                      color: "#ff7272",
                      background: "rgba(255,90,90,.08)",
                      border: "1px solid rgba(255,90,90,.18)",
                      borderRadius: 12,
                      padding: 10,
                      whiteSpace: "pre-wrap",
                      fontSize: 12
                    }}
                  >
                    ? {s.err}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}










