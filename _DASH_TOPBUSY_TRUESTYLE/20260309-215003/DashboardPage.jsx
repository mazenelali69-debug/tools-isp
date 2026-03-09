import React, { useEffect, useMemo, useState } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function getPressureStatus(total) {
  const n = num(total);
  if (n >= 700) return "critical";
  if (n >= 350) return "high";
  if (n >= 120) return "warn";
  return "healthy";
}

function statusLabel(status) {
  if (status === "critical") return "Critical";
  if (status === "high") return "High";
  if (status === "warn") return "Warning";
  return "Healthy";
}

function MetricCard({ title, value, sub, tone = "neutral" }) {
  return (
    <div className={"dashx-metric is-" + tone}>
      <div className="dashx-metric__title">{title}</div>
      <div className="dashx-metric__value">{value}</div>
      <div className="dashx-metric__sub">{sub}</div>
    </div>
  );
}


function HeatBar({ value }) {
  const blocks = 24;
  const max = 320;
  const safe = Math.max(0, num(value));
  const active = Math.max(0, Math.min(blocks, Math.round((safe / max) * blocks)));

  return (
    <div className="dashx-heat">
      {Array.from({ length: blocks }, (_, i) => {
        let cls = "dashx-heat__cell";

        if (i < active) {
          const p = i / Math.max(1, blocks - 1);
          if (p < 0.45) cls += " is-hot";
          else if (p < 0.82) cls += " is-warn";
          else cls += " is-good";
        } else {
          cls += " is-off";
        }

        return <span key={i} className={cls} />;
      })}
    </div>
  );
}

function PressureList({ rows }) {
  return (
    <div className="dashx-rankList dashx-rankList--heat">
      {rows.map((row, idx) => {
        const tone = getPressureStatus(row.totalMbps);

        return (
          <div key={row.id} className="dashx-rankRow dashx-rankRow--heat">
            <div className="dashx-rankRow__top dashx-rankRow__top--heat">
              <div className="dashx-rankRow__left dashx-rankRow__left--heat">
                <div className={"dashx-rankDot is-" + tone} />
                <div className="dashx-rankIndex">#{idx + 1}</div>
                <div className="dashx-rankRow__name">{row.name || row.id}</div>
              </div>

              <div className="dashx-rankRow__right dashx-rankRow__right--heat">
                <div className="dashx-rankRow__value">{fmtMbps(row.totalMbps)}</div>
              </div>
            </div>

            <div className="dashx-rankRow__barWrap dashx-rankRow__barWrap--heat">
              <HeatBar value={row.totalMbps} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ items }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of items) {
      const ts = String(row?.ts || "");
      if (!ts) continue;
      const rx = num(row?.rxMbps);
      const tx = num(row?.txMbps);
      const prev = map.get(ts) || { ts, rx: 0, tx: 0 };
      prev.rx += rx;
      prev.tx += tx;
      map.set(ts, prev);
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      .slice(-20);
  }, [items]);

  const width = 920;
  const height = 220;
  const padL = 26;
  const padR = 18;
  const padT = 14;
  const padB = 28;

  const rxVals = grouped.map(x => num(x.rx));
  const txVals = grouped.map(x => num(x.tx));
  const maxVal = Math.max(1, ...rxVals, ...txVals, 1);

  function makeCoords(values) {
    return values.map((v, i) => {
      const x = values.length <= 1
        ? padL
        : padL + (i * (width - padL - padR)) / (values.length - 1);
      const y = height - padB - ((v / maxVal) * (height - padT - padB));
      return { x, y, v };
    });
  }

  function areaPath(points) {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map(p => `${p.x},${p.y}`).join(" L ");
    return `M ${first.x} ${height - padB} L ${line} L ${last.x} ${height - padB} Z`;
  }

  const rxPts = makeCoords(rxVals);
  const txPts = makeCoords(txVals);

  const rxLine = rxPts.map(p => `${p.x},${p.y}`).join(" ");
  const txLine = txPts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="dashx-chart">
      <div className="dashx-chart__head">
        <div>
          <div className="dashx-blockTitle">Traffic history</div>
          <div className="dashx-blockSub">Recent combined uplink RX / TX trend</div>
        </div>

        <div className="dashx-chart__legend">
          <span className="is-rx">RX</span>
          <span className="is-tx">TX</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="dashx-chart__svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashxAreaRx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(103,232,122,0.22)" />
            <stop offset="100%" stopColor="rgba(103,232,122,0.01)" />
          </linearGradient>
          <linearGradient id="dashxAreaTx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(120,168,255,0.20)" />
            <stop offset="100%" stopColor="rgba(120,168,255,0.01)" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = height - padB - ((height - padT - padB) * r);
          return (
            <line
              key={i}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        <path d={areaPath(txPts)} fill="url(#dashxAreaTx)" />
        <path d={areaPath(rxPts)} fill="url(#dashxAreaRx)" />

        <polyline
          points={txLine}
          fill="none"
          stroke="#78a8ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={rxLine}
          fill="none"
          stroke="#67e87a"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {txPts.length ? (
          <circle cx={txPts[txPts.length - 1].x} cy={txPts[txPts.length - 1].y} r="3.5" fill="#78a8ff" />
        ) : null}

        {rxPts.length ? (
          <circle cx={rxPts[rxPts.length - 1].x} cy={rxPts[rxPts.length - 1].y} r="3.2" fill="#67e87a" />
        ) : null}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const [snapRes, histRes] = await Promise.all([
          fetch("/api/eth/snapshot", { cache: "no-store" }),
          fetch("/api/history/uplink?range=1h&limit=200", { cache: "no-store" })
        ]);

        const snapJson = await snapRes.json();
        const histJson = await histRes.json();

        if (!snapRes.ok || !snapJson?.ok) {
          throw new Error(snapJson?.error || `Snapshot HTTP ${snapRes.status}`);
        }
        if (!histRes.ok || !histJson?.ok) {
          throw new Error(histJson?.error || `History HTTP ${histRes.status}`);
        }

        if (!dead) {
          setSnapshot(Array.isArray(snapJson?.data) ? snapJson.data : []);
          setHistory(Array.isArray(histJson?.items) ? histJson.items : []);
          setError("");
        }
      } catch (err) {
        if (!dead) setError(err?.message || "Dashboard load failed");
      }
    }

    load();
    const t = setInterval(load, 10000);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, []);

  const uplinks = useMemo(() => {
    return snapshot.filter(x => String(x?.id || "").startsWith("uplink_"));
  }, [snapshot]);

  const totals = useMemo(() => {
    const rx = uplinks.reduce((s, x) => s + num(x?.rxMbps), 0);
    const tx = uplinks.reduce((s, x) => s + num(x?.txMbps), 0);
    return { rx, tx, total: rx + tx };
  }, [uplinks]);

  const pressure = getPressureStatus(totals.total);

  const ranked = useMemo(() => {
    return [...uplinks]
      .map(x => ({ ...x, totalMbps: num(x?.rxMbps) + num(x?.txMbps) }))
      .sort((a, b) => b.totalMbps - a.totalMbps)
      .slice(0, 6);
  }, [uplinks]);

  const counts = useMemo(() => {
    const out = { healthy: 0, warn: 0, high: 0, critical: 0 };
    for (const row of uplinks) {
      const total = num(row?.rxMbps) + num(row?.txMbps);
      out[getPressureStatus(total)] += 1;
    }
    return out;
  }, [uplinks]);

  const latest = ranked[0] || null;

  return (
    <div className="dashx-page">
      <section className="dashx-hero">
        <div>
          <div className="dashx-hero__eyebrow">Operations overview</div>
          <div className="dashx-hero__title">Network Command Dashboard</div>
          <div className="dashx-hero__sub">
            Clean live overview for uplink pressure, top busy links, and recent traffic trend.
          </div>
        </div>

        <div className={"dashx-hero__status is-" + pressure}>
          <div className="dashx-hero__statusLabel">Network pressure</div>
          <div className="dashx-hero__statusValue">{statusLabel(pressure)}</div>
        </div>
      </section>

      {error ? <div className="dashx-errorBox">{error}</div> : null}

      <section className="dashx-metrics">
        <MetricCard title="Total traffic now" value={fmtMbps(totals.total)} sub="Combined RX + TX" tone={pressure} />
        <MetricCard title="Total RX" value={fmtMbps(totals.rx)} sub="Live receive load" tone="healthy" />
        <MetricCard title="Total TX" value={fmtMbps(totals.tx)} sub="Live transmit load" tone="high" />
        <MetricCard title="Tracked uplinks" value={String(uplinks.length)} sub="Current uplink rows" tone="neutral" />
      </section>

      <section className="dashx-row">
        <div className="dashx-panel">
          <div className="dashx-blockTitle">Health distribution</div>
          <div className="dashx-blockSub">Current uplink state by live pressure</div>

          <div className="dashx-health">
            <div className="dashx-health__item is-healthy">
              <strong>{counts.healthy}</strong>
              <span>Healthy</span>
            </div>
            <div className="dashx-health__item is-warn">
              <strong>{counts.warn}</strong>
              <span>Warning</span>
            </div>
            <div className="dashx-health__item is-high">
              <strong>{counts.high}</strong>
              <span>High</span>
            </div>
            <div className="dashx-health__item is-critical">
              <strong>{counts.critical}</strong>
              <span>Critical</span>
            </div>
          </div>
        </div>

        <div className="dashx-panel">
          <div className="dashx-blockTitle">Top busy uplinks</div>
          <div className="dashx-blockSub">Ranked by live combined load</div>

          {ranked.length ? (
            <PressureList rows={ranked} />
          ) : (
            <div className="dashx-emptyState">No uplink data available.</div>
          )}
        </div>
      </section>


    </div>
  );
}








