import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function Sparkline({ points, height=58 }){
  // points: array of numbers or null (null = loss)
  const w = 260;
  const h = height;

  const [hover, setHover] = useState(null); // { idx, x, y, val }

  const vals = points.filter(v => typeof v === "number" && isFinite(v));
  const minV = vals.length ? Math.min(...vals) : 0;
  const maxV = vals.length ? Math.max(...vals) : 100;
  const span = Math.max(1, (maxV - minV));

  const step = points.length > 1 ? (w / (points.length - 1)) : w;

  const pts = points.map((v,i) => {
    const x = i * step;
    const y = (v == null)
      ? (h - 2)
      : (h - 2) - (((v - minV) / span) * (h - 10));
    return { x, y, v };
  });

  // Smooth path (quadratic)
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

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

  function onMove(e){
    if(points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();

    // convert mouse X (px) to SVG viewBox X (0..w)
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
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(140,210,255,.55)" />
          <stop offset="65%" stopColor="rgba(140,210,255,.10)" />
          <stop offset="100%" stopColor="rgba(140,210,255,0)" />
        </linearGradient>
      </defs>

      {areaPath ? <path className="lpArea" d={areaPath} fill={`url(#${gid})`} /> : null}
      {linePath ? <path className="lpLine" d={linePath} fill="none" strokeWidth="2.2" /> : null}

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
            <g transform={`translate(${Math.min(hover.x + 8, w - 56)}, ${Math.max(hover.y - 18, 12)})`}>
              <rect x="0" y="-12" rx="6" ry="6" width="52" height="18" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.10)" />
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
  return Math.round((lost/total)*100);
}

async function pingOnce(ip){
  const url = `${API_BASE}/api/ping/once?ip=${encodeURIComponent(ip)}`;
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json();
  if(!j || !j.ok) throw new Error(j?.error || "Ping failed");
  // j: { ok:true, ip, alive:boolean, timeMs:number|null }
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

export default function LivePingPage(){
  const TARGETS = useMemo(() => ([
    { ip: "10.0.25.10",    name: "DNS-THGV" },
    { ip: "192.168.99.1",  name: "GETWAY-THGV" },
    { ip: "155.15.59.1",   name: "VLAN-CCR1036-12G-4S-THGV" },
    { ip: "155.15.59.4",   name: "AviatWTM4200-nocomment" },

    // إذا بدك يصيرو 6 boxes: شيل التعليق عن هول
    { ip: "112.24.30.1",   name: "VLAN-2-CCR1036-12G-4S-THGV" },
    { ip: "88.88.88.254",  name: "JetStream managed Switch" },
  ]), []);

  const WINDOW = 60; // last 60 seconds
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

    // run sequentially to avoid spamming too hard
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
          const nextPts = [...cur.points, null].slice(-WINDOW); // count as loss
          return {
            ...prev,
            [t.ip]: { points: nextPts, last: null, err: String(e?.message || e) }
          };
        });
      }
    }
  }, 1000);

  return (
    <div className="lpWrap">
      <div className="lpTop">
        <div className="lpTitle">Live Ping</div>
        <div className="lpControls">
          <button className="lpBtn" onClick={() => setRunning(v => !v)}>
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      <div className="lpGrid">
        {TARGETS.map(t => {
          const s = state[t.ip] || { points: [], last: null, err: null };
          const lastAlive = s.last?.alive === true;
          const lastMs = (typeof s.last?.timeMs === "number") ? s.last.timeMs : null;
          const loss = pctLoss(s.points);

          return (
            <div key={t.ip} className={"lpCard" + (lastAlive ? " ok" : " down")}>
              <div className="lpCardHead">
                <div className="lpName">{t.name}</div>
                <div className="lpIp">{t.ip}</div>
              </div>

              <div className="lpMeta">
                <div className="lpStat">
                  <div className="lpLbl">Status</div>
                  <div className="lpVal">
                    <span className="lpPill">
                      <span className="lpDot"></span>
                      {lastAlive ? "UP" : "DOWN"}
                    </span>
                  </div>
                </div>
                <div className="lpStat">
                  <div className="lpLbl">Latency</div>
                  <div className="lpVal">{lastMs != null ? `${Math.round(lastMs)} ms` : "—"}</div>
                </div>
                <div className="lpStat">
                  <div className="lpLbl">Packet Loss</div>
                  <div className="lpVal">{loss}%</div>
                </div>
              </div>

              <div className="lpChartRow">
                <div className="lpChartLabel">Latency (last {WINDOW}s)</div>
                <Sparkline points={s.points} />
              </div>

              <div className="lpLossBar">
                <div className="lpLossFill" style={{ width: `${loss}%` }} />
              </div>

              {s.err ? <div className="lpErr">⚠ {s.err}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}







