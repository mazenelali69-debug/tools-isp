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

function MetricCard({ title, value, sub, tone = "neutral" }) {
  return (
    <div className={"dashx-metric is-" + tone}>
      <div className="dashx-metric__title">{title}</div>
      <div className="dashx-metric__value">{value}</div>
      <div className="dashx-metric__sub">{sub}</div>
    </div>
  );
}

function TopBusyPanel({ rows }) {
  const maxValue = Math.max(1, ...rows.map(x => num(x.totalMbps)), 1);

  return (
    <div
      className="dashx-panel"
      style={{
        width: "100%",
        minHeight: 360,
        padding: 14,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.02)"
      }}
    >
      <div className="dashx-blockTitle">Top busy uplinks</div>
      <div className="dashx-blockSub" style={{ marginBottom: 12 }}>
        Ranked by live combined load
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((row, idx) => {
          const ratio = Math.max(0, Math.min(1, num(row.totalMbps) / maxValue));
          const fillWidth = `${(ratio * 100).toFixed(2)}%`;

          return (
            <div key={row.id}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8
                }}
              >
                <div style={{ color: "#7dff7a", fontWeight: 900, fontSize: 10 }}>
                  #{idx + 1}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: "rgba(255,255,255,.94)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                  title={row.name || row.id}
                >
                  {row.name || row.id}
                </div>

                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 11,
                    color: "rgba(255,255,255,.92)"
                  }}
                >
                  {fmtMbps(row.totalMbps)}
                </div>
              </div>

              <div
                style={{
                  height: 18,
                  width: "100%",
                  borderRadius: 3,
                  background: "rgba(35,50,82,.75)",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)"
                }}
              >
                <div
                  style={{
                    width: fillWidth,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #47d96b 0%, #b9da48 52%, #efb14a 78%, #ef6969 100%)"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SERVICE_PING_TARGETS = [
  { id: "facebook",  name: "FB",        host: "facebook.com" },
  { id: "whatsapp",  name: "WhatsApp",  host: "web.whatsapp.com" },
  { id: "instagram", name: "Instagram", host: "instagram.com" },
  { id: "tiktok",    name: "TikTok",    host: "tiktok.com" },
  { id: "google",    name: "Google",    host: "google.com" }
];

const SERVICE_WINDOW = 24;

function fmtPingMs(ms, alive, loss = 0) {
  if (!alive && loss >= 100) return "timeout";
  if (!alive) return "down";
  const n = num(ms);
  if (loss > 0) return `${Math.round(n)} ms ? PL ${Math.round(loss)}%`;
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
            fontSize: 9,
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

  const width = 270;
  const height = 198;
  const cx = 135;
  const cy = 150;
  const rOuter = 96;
  const rInner = 72;

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
    <div style={{ display: "flex", justifyContent: 'flex-start' }}>
      <div style={{ width: 270, position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 198, display: "block" }}>
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
            top: 108,
            textAlign: "center",
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: mainColor,
              lineHeight: 1.12,
              
              
              
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
            fontSize: 15,
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
        borderRadius: 18,
        padding: 12,
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

        <div style={{ marginTop: 4 }}>
          <PingSparkline
            values={hist || []}
            label={`${row.name} ? ${fmtPingMs(row.pingMs, row.alive, loss)}`}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
            marginTop: 6
          }}
        >
          <div style={{ fontSize: 9, opacity: .74 }}>
            Status<br />
            <strong style={{ color: row.alive ? "#7dff7a" : "#ff8a9f", fontSize: 10 }}>
              {row.alive ? "UP" : "DOWN"}
            </strong>
          </div>
          <div style={{ fontSize: 9, opacity: .74, textAlign: "center" }}>
            Loss<br />
            <strong style={{ color: "#7aa2ff", fontSize: 10 }}>
              {Math.round(loss)}%
            </strong>
          </div>
          <div style={{ fontSize: 9, opacity: .74, textAlign: "right" }}>
            Host<br />
            <strong style={{ color: "#fff", fontSize: 10 }}>
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
    <section style={{ marginTop: 28 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
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
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const snapRes = await fetch("/api/eth/snapshot", { cache: "no-store" });
        const snapJson = await snapRes.json();

        if (!snapRes.ok || !snapJson?.ok) {
          throw new Error(snapJson?.error || `Snapshot HTTP ${snapRes.status}`);
        }

        if (!dead) {
          setSnapshot(Array.isArray(snapJson?.data) ? snapJson.data : []);
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

  return (
    <div className="dashx-page">
      {error ? <div className="dashx-errorBox">{error}</div> : null}

      <section className="dashx-metrics">
        <MetricCard title="Total traffic now" value={fmtMbps(totals.total)} sub="Combined RX + TX" tone={pressure} />
        <MetricCard title="Total RX" value={fmtMbps(totals.rx)} sub="Live receive load" tone="healthy" />
        <MetricCard title="Total TX" value={fmtMbps(totals.tx)} sub="Live transmit load" tone="high" />
        <MetricCard title="Tracked uplinks" value={String(uplinks.length)} sub="Current uplink rows" tone="neutral" />
      </section>

      <section style={{ width: "100%", marginTop: 22 }}>
        <TopBusyPanel rows={ranked} />
      </section>

      <ServicePingSection />
    </div>
  );
}











