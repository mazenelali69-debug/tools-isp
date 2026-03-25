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


function HeatBar({ value, maxValue = 220 }) {
  const blocks = 64;
  const safe = Math.max(0, num(value));
  const ratio = Math.max(0, Math.min(1, safe / maxValue));
  const active = Math.max(0, Math.round(blocks * ratio));

  return (
    <div className="dashx-strip">
      {Array.from({ length: blocks }, (_, i) => {
        const p = i / Math.max(1, blocks - 1);
        let cls = "dashx-strip__cell";

        if (i < active) {
          if (p < 0.34) cls += " is-green";
          else if (p < 0.58) cls += " is-lime";
          else if (p < 0.78) cls += " is-amber";
          else cls += " is-red";
        } else {
          cls += " is-off";
        }

        return <span key={i} className={cls} />;
      })}
    </div>
  );
}

function StripMeter({ value, maxValue = 220 }) {
  const totalBlocks = 72;
  const safe = Math.max(0, num(value));
  const ratio = Math.max(0, Math.min(1, safe / maxValue));
  const activeBlocks = Math.max(0, Math.round(totalBlocks * ratio));

  return (
    <div className="gbg-strip">
      {Array.from({ length: totalBlocks }, (_, i) => {
        const p = i / Math.max(1, totalBlocks - 1);
        let cls = "gbg-strip__cell";

        if (i < activeBlocks) {
          if (p < 0.34) cls += " is-green";
          else if (p < 0.58) cls += " is-lime";
          else if (p < 0.80) cls += " is-amber";
          else cls += " is-red";
        } else {
          cls += " is-off";
        }

        return <span key={i} className={cls} />;
      })}
    </div>
  );
}
function FullWidthStrip({ value, maxValue = 220 }) {
  const totalBlocks = 84;
  const safe = Math.max(0, num(value));
  const ratio = Math.max(0, Math.min(1, safe / maxValue));
  const activeBlocks = Math.max(0, Math.round(totalBlocks * ratio));

  return (
    <div className="fwb-strip">
      {Array.from({ length: totalBlocks }, (_, i) => {
        const p = i / Math.max(1, totalBlocks - 1);
        let cls = "fwb-strip__cell";

        if (i < activeBlocks) {
          if (p < 0.34) cls += " is-green";
          else if (p < 0.58) cls += " is-lime";
          else if (p < 0.80) cls += " is-amber";
          else cls += " is-red";
        } else {
          cls += " is-off";
        }

        return <span key={i} className={cls} />;
      })}
    </div>
  );
}
function PressureList({ rows }) {
  const maxValue = Math.max(1, ...rows.map(x => num(x.totalMbps)), 1);

  return (
    <div className="fwb-list">
      {rows.map((row, idx) => {
        const tone = getPressureStatus(row.totalMbps);

        return (
          <div key={row.id} className="fwb-row">
            <div className="fwb-row__head">
              <div className="fwb-row__left">
                <span className={"fwb-dot is-" + tone} />
                <span className="fwb-rank">#{idx + 1}</span>
                <span className="fwb-name">{row.name || row.id}</span>
              </div>

              <div className="fwb-row__right">
                <span className="fwb-value">{fmtMbps(row.totalMbps)}</span>
              </div>
            </div>

            <div className="fwb-row__bar">
              <FullWidthStrip value={row.totalMbps} maxValue={maxValue} />
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

const SERVICE_PING_TARGETS = [
  { id: "facebook",  name: "FB",        host: "facebook.com" },
  { id: "whatsapp",  name: "WhatsApp",  host: "web.whatsapp.com" },
  { id: "instagram", name: "Instagram", host: "instagram.com" },
  { id: "tiktok",    name: "TikTok",    host: "tiktok.com" },
  { id: "yahoo",     name: "Yahoo",     host: "yahoo.com" },
  { id: "netflix",   name: "Netflix",   host: "netflix.com" },
  { id: "google",    name: "Google",    host: "google.com" },
  { id: "cnn",       name: "CNN",       host: "cnn.com" }
];

function pingTone(ms, alive) {
  if (!alive) return "critical";
  const n = num(ms);
  if (n >= 220) return "critical";
  if (n >= 120) return "high";
  if (n >= 60) return "warn";
  return "good";
}

function fmtPingMs(ms, alive, loss) {
  if (!alive && loss >= 100) return "timeout";
  if (!alive) return "down";
  const n = num(ms);
  if (loss > 0) return `${Math.round(n)} ms • PL ${Math.round(loss)}%`;
  return `${Math.round(n)} ms`;
}

function buildPingGauge(ms, alive, maxValue = 260) {
  const value = alive ? Math.max(0, Math.min(maxValue, num(ms))) : maxValue;
  const startDeg = -205;
  const endDeg = 25;
  const span = endDeg - startDeg;

  const segments = 28;
  const activeCount = Math.round((value / maxValue) * segments);

  const r = 86;
  const cx = 120;
  const cy = 118;

  const items = [];

  for (let i = 0; i < segments; i++) {
    const fromDeg = startDeg + (span * i / segments);
    const toDeg = startDeg + (span * (i + 0.58) / segments);

    const a1 = (fromDeg - 90) * Math.PI / 180;
    const a2 = (toDeg - 90) * Math.PI / 180;

    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const x2 = cx + Math.cos(a2) * r;
    const y2 = cy + Math.sin(a2) * r;

    let color = "#72ff7d";
    if (!alive) color = "#ff7995";
    else if (i / segments < 0.55) color = "#72ff7d";
    else if (i / segments < 0.78) color = "#caff59";
    else color = "#ffbe4b";

    items.push({
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      active: i < activeCount,
      color,
      i
    });
  }

  const ticks = [
    { label: "30",  deg: -162 },
    { label: "60",  deg: -129 },
    { label: "90",  deg: -94 },
    { label: "120", deg: -57 },
    { label: "160", deg: -20 },
    { label: "200", deg: 22 },
    { label: "260", deg: 62 }
  ].map((t, idx) => {
    const tr = 108;
    const a = (t.deg - 90) * Math.PI / 180;
    return {
      key: idx,
      x: 120 + Math.cos(a) * tr,
      y: 118 + Math.sin(a) * tr,
      label: t.label
    };
  });

  return { segments: items, ticks };
}

function useServicePingData() {
  const [rows, setRows] = useState(() =>
    SERVICE_PING_TARGETS.map(t => ({
      ...t,
      pingMs: null,
      alive: false,
      packetLoss: 0
    }))
  );

  useEffect(() => {
    let dead = false;
    const stats = new Map();

    async function loadPing() {
      const next = await Promise.all(SERVICE_PING_TARGETS.map(async (t) => {
        try {
          const url = `/api/ping/once?ip=${encodeURIComponent(t.host)}`;
          const res = await fetch(url, { cache: "no-store" });
          const js = await res.json();

          if (!res.ok || !js?.ok) throw new Error(js?.error || `HTTP ${res.status}`);

          const alive = !!js?.alive;
          const timeMs = Number.isFinite(Number(js?.timeMs)) ? Number(js.timeMs) : null;

          const prev = stats.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + (alive ? 0 : 1);
          stats.set(t.id, { total, loss });

          return {
            id: t.id,
            alive,
            pingMs: alive ? timeMs : null,
            packetLoss: total > 0 ? (loss * 100 / total) : 0
          };
        } catch {
          const prev = stats.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + 1;
          stats.set(t.id, { total, loss });

          return {
            id: t.id,
            alive: false,
            pingMs: null,
            packetLoss: total > 0 ? (loss * 100 / total) : 100
          };
        }
      }));

      if (dead) return;

      setRows(prev => prev.map(r => {
        const m = next.find(x => x.id === r.id);
        return m ? { ...r, ...m } : r;
      }));
    }

    loadPing();
    const t = setInterval(loadPing, 3000);

    return () => {
      dead = true;
      clearInterval(t);
    };
  }, []);

  return rows;
}

function ServicePingGaugeCard({ row }) {
  const loss = num(row.packetLoss);
  const tone = pingTone(row.pingMs, row.alive);
  const gauge = useMemo(() => buildPingGauge(row.pingMs, row.alive, 260), [row.pingMs, row.alive]);

  return (
    <div className={`dpg-card is-${tone} ${loss > 0 ? "is-loss" : ""}`}>
      <div className="dpg-card__bg" />

      <div className="dpg-gaugeWrap">
        <svg viewBox="0 0 240 210" className="dpg-gauge" aria-hidden="true">
          {gauge.ticks.map(t => (
            <text
              key={t.key}
              x={t.x}
              y={t.y}
              className="dpg-tick"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {t.label}
            </text>
          ))}

          {gauge.segments.map(seg => (
            <path
              key={seg.i}
              d={seg.d}
              className={`dpg-seg ${seg.active ? "is-active" : ""}`}
              style={seg.active ? { stroke: seg.color } : undefined}
            />
          ))}
        </svg>

        <div className="dpg-center">
          <div className="dpg-name">{row.name}</div>
          <div className={`dpg-ping ${loss > 0 ? "is-loss" : ""}`}>
            {fmtPingMs(row.pingMs, row.alive, loss)}
          </div>
        </div>

        <div className="dpg-total">
          {row.alive ? `${Math.round(num(row.pingMs))} ms` : "timeout"}
        </div>
      </div>

      <div className="dpg-neon">
        <div className="dpg-neon__line" />
        <div className="dpg-neon__dot" />
      </div>

      <div className="dpg-meta">
        <div className="dpg-meta__col">
          <div className="dpg-meta__label">Status</div>
          <div className={`dpg-meta__value ${row.alive ? "is-ok" : "is-bad"}`}>
            {row.alive ? "UP" : "DOWN"}
          </div>
        </div>

        <div className="dpg-meta__col">
          <div className="dpg-meta__label">Loss</div>
          <div className="dpg-meta__value is-mid">{Math.round(loss)}%</div>
        </div>

        <div className="dpg-meta__col is-right">
          <div className="dpg-meta__label">Target</div>
          <div className="dpg-meta__value">Ping</div>
        </div>
      </div>
    </div>
  );
}

function ServicePingSection() {
  const rows = useServicePingData();

  return (
    <section className="dpg-section">
      <div className="dpg-section__head">
        <div>
          <div className="dashx-blockTitle">Service ping gauges</div>
          <div className="dashx-blockSub">Live latency for the 8 public services</div>
        </div>
      </div>

      <div className="dpg-grid">
        {rows.map(row => (
          <ServicePingGaugeCard key={row.id} row={row} />
        ))}
      </div>
    </section>
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

            <section className="dashx-midFull">
        <div className="dashx-midFull__health dashx-panel">
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

        <div className="dashx-midFull__topbusy dashx-panel">
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






















