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
  { id: "speedtest",   name: "Speedtest",   host: "speedtest.net" },
  { id: "google",    name: "Google",    host: "google.com" },
  { id: "cnn",       name: "CNN",       host: "cnn.com" }
];

const SERVICE_WINDOW = 24;

function pingTone(ms, alive) {
  if (!alive) return "critical";
  const n = num(ms);
  if (n >= 220) return "critical";
  if (n >= 120) return "high";
  if (n >= 60) return "warn";
  return "healthy";
}

function fmtPingMs(ms, alive, loss = 0) {
  if (!alive && loss >= 100) return "timeout";
  if (!alive) return "down";
  const n = num(ms);
  if (loss > 0) return `${Math.round(n)} ms • PL ${Math.round(loss)}%`;
  return `${Math.round(n)} ms`;
}

function pingLineTone(v) {
  const n = num(v);
  if (n < 60) return "#7dff7a";
  if (n < 120) return "#ffb347";
  return "#ff5f6d";
}

function pingGaugeColorByRatio(r) {
  if (r < 0.30) return "#7dff7a";
  if (r < 0.55) return "#b8d84e";
  if (r < 0.75) return "#ffb347";
  return "#ff5f6d";
}

function polarPing(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a)
  };
}

function PingSparkline({ values = [], label = "" }) {
  const pts = (Array.isArray(values) ? values : []).map(x => num(x));
  const len = Math.max(pts.length, 2);
  const w = 240;
  const h = 28;
  const pad = 4;
  const maxValue = Math.max(1, ...pts, 1);

  const [hover, setHover] = useState(null);

  const coords = Array.from({ length: len }, (_, i) => {
    const v = num(pts[i] ?? 0);
    const x = len <= 1 ? pad : pad + (i * (w - pad * 2)) / (len - 1);
    const y = h - (((v / maxValue) * (h - pad * 2)) + pad);
    return { x, y, v };
  });

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(len - 1, Math.round((x / rect.width) * (len - 1))));
    setHover(idx);
  }

  const line = coords.map(p => `${p.x},${p.y}`).join(" ");
  const last = coords[coords.length - 1];
  const tone = pingLineTone(last?.v ?? 0);

  return (
    <div
      style={{ position: "relative", height: h }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      title={label}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h }}>
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
          style={{ filter: `drop-shadow(0 0 4px ${tone})` }}
        />
        <circle cx={last.x} cy={last.y} r="2.1" fill={tone} />
      </svg>

      {hover !== null ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: -18,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 8,
            background: "rgba(8,10,18,.92)",
            border: "1px solid rgba(255,255,255,.10)",
            color: "#fff",
            whiteSpace: "nowrap"
          }}
        >
          {Math.round(coords[hover]?.v ?? 0)} ms
        </div>
      ) : null}
    </div>
  );
}

function PingSegmentedGauge({ valueMs, name, totalText }) {
  const total = num(valueMs);
  const maxGaugeMs = 260;
  const ratio = Math.max(0, Math.min(1, total / maxGaugeMs));

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
    { text: "230", angle: 92,   r: 134, dx:  6, dy:  4 },
    { text: "260", angle: 118,  r: 132, dx:  5, dy:  8 }
  ];

  const mainColor = pingGaugeColorByRatio(ratio);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ width: 314, position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 232, display: "block" }}>
          {Array.from({ length: segments }, (_, i) => {
            const a1 = start + (i * step) + 1.4;
            const a2 = start + ((i + 1) * step) - 1.4;

            const p1 = polarPing(cx, cy, rOuter, a1);
            const p2 = polarPing(cx, cy, rOuter, a2);
            const p3 = polarPing(cx, cy, rInner, a2);
            const p4 = polarPing(cx, cy, rInner, a1);

            const fill = i < activeCount
              ? pingGaugeColorByRatio((i + 1) / segments)
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
            const p = polarPing(cx, cy, lab.r, lab.angle);
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
            position: "absolute",
            left: 0,
            right: 0,
            top: 128,
            textAlign: "center",
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: mainColor,
              lineHeight: 1.12,
              maxWidth: 136,
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
              textWrap: "balance",
              letterSpacing: ".15px",
              textShadow: `0 0 10px ${mainColor}22`
            }}
          >
            {name}
          </div>
        </div>

        <div
          style={{
            marginTop: 6,
            textAlign: "center",
            fontSize: 17,
            fontWeight: 700,
            color: mainColor,
            letterSpacing: ".2px",
            textShadow: `0 0 10px ${mainColor}22`
          }}
          title={totalText}
        >
          {totalText}
        </div>
      </div>
    </div>
  );
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

  const [hist, setHist] = useState(() => {
    const out = {};
    for (const t of SERVICE_PING_TARGETS) {
      out[t.id] = [];
    }
    return out;
  });

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

      setHist(prev => {
        const out = { ...prev };
        for (const row of next) {
          const v = row.alive ? num(row.pingMs) : 260;
          out[row.id] = [...(out[row.id] || []), v].slice(-SERVICE_WINDOW);
        }
        return out;
      });
    }

    loadPing();
    const t = setInterval(loadPing, 3000);

    return () => {
      dead = true;
      clearInterval(t);
    };
  }, []);

  return { rows, hist };
}

function ServicePingGaugeCard({ row, hist }) {
  const loss = num(row.packetLoss);
  const totalText = row.alive ? `${Math.round(num(row.pingMs))} ms` : "timeout";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        padding: 16,
        background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border: loss > 0
          ? "1px solid rgba(255,120,145,.22)"
          : "1px solid rgba(255,255,255,.08)",
        boxShadow: loss > 0
          ? "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025), 0 0 0 1px rgba(255,120,145,.06)"
          : "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: loss > 0
            ? "radial-gradient(circle at top right, rgba(255,90,120,.08), transparent 30%), radial-gradient(circle at bottom left, rgba(95,110,255,.06), transparent 35%)"
            : "radial-gradient(circle at top right, rgba(0,255,220,.05), transparent 30%), radial-gradient(circle at bottom left, rgba(95,110,255,.06), transparent 35%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <PingSegmentedGauge
          valueMs={row.alive ? num(row.pingMs) : 260}
          name={row.name}
          totalText={totalText}
        />

        <div style={{ marginTop: 8 }}>
          <PingSparkline
            values={hist || []}
            label={`${row.name} • ${fmtPingMs(row.pingMs, row.alive, loss)}`}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 10
          }}
        >
          <div style={{ fontSize: 10, opacity: .74 }}>
            Status<br />
            <strong style={{ color: row.alive ? "#7dff7a" : "#ff8a9f", fontSize: 12 }}>
              {row.alive ? "UP" : "DOWN"}
            </strong>
          </div>
          <div style={{ fontSize: 10, opacity: .74, textAlign: "center" }}>
            Loss<br />
            <strong style={{ color: "#7aa2ff", fontSize: 12 }}>
              {Math.round(loss)}%
            </strong>
          </div>
          <div style={{ fontSize: 10, opacity: .74, textAlign: "right" }}>
            Host<br />
            <strong style={{ color: "#fff", fontSize: 12 }}>
              {row.host}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicePingSection() {
  const { rows, hist } = useServicePingData();

  return (
    <section style={{ marginTop: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="dashx-blockTitle">Service ping gauges</div>
        <div className="dashx-blockSub">8 public services • same uplink gauge style • live latency</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          maxWidth: 1500
        }}
      >
        {rows.map(row => (
          <ServicePingGaugeCard
            key={row.id}
            row={row}
            hist={hist[row.id] || []}
          />
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


    
      <ServicePingSection />

    </div>
  );
}


