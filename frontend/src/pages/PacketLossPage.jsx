import React, { useEffect, useMemo, useState } from "react";

const LIVE_MS = 3000;
const HISTORY_MS = 9000;
const SERIES_MS = 15000;

const SERVICE_ORDER = [
  "www.facebook.com",
  "www.youtube.com",
  "www.cnn.com",
  "www.tiktok.com",
  "www.whatsapp.com",
  "mail.google.com",
  "x.com",
  "discord.com"
];

function fmtMs(v) {
  return v == null || Number.isNaN(Number(v)) ? "--" : `${Math.round(Number(v))} ms`;
}

function fmtPct(v) {
  return v == null || Number.isNaN(Number(v)) ? "--" : `${Math.round(Number(v))}%`;
}

function fmtTs(v) {
  if (!v) return "--";
  try {
    return new Date(Number(v)).toLocaleTimeString();
  } catch {
    return "--";
  }
}

function fmtDuration(ms) {
  const n = Number(ms || 0);
  if (!Number.isFinite(n) || n <= 0) return "--";
  const s = Math.round(n / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function isIp(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(String(host || "").trim());
}

function domainFromHost(host) {
  const s = String(host || "").trim().toLowerCase();
  if (!s || isIp(s)) return "";
  return s.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function displayName(host) {
  const map = {
    "www.facebook.com": "Facebook",
    "www.youtube.com": "YouTube",
    "www.cnn.com": "CNN",
    "www.tiktok.com": "TikTok",
    "www.whatsapp.com": "WhatsApp",
    "mail.google.com": "Gmail",
    "x.com": "X (Twitter)",
    "discord.com": "Discord"
  };
  return map[host] || host;
}

function iconUrlForHost(host) {
  if (isIp(host)) return "";
  const map = {
    "www.facebook.com": "https://cdn.simpleicons.org/facebook/1877F2",
    "www.youtube.com": "https://cdn.simpleicons.org/youtube/FF0000",
    "www.cnn.com": "https://cdn.simpleicons.org/cnn/E50914",
    "www.tiktok.com": "https://cdn.simpleicons.org/tiktok/000000",
    "www.whatsapp.com": "https://cdn.simpleicons.org/whatsapp/25D366",
    "mail.google.com": "https://cdn.simpleicons.org/gmail/EA4335",
    "x.com": "https://cdn.simpleicons.org/x/111111",
    "discord.com": "https://cdn.simpleicons.org/discord/5865F2"
  };
  const d = domainFromHost(host);
  return map[d] || "";
}

function getLoss(item) {
  return Number(item?.last?.loss ?? 0);
}

function getPing(item) {
  const n = Number(item?.last?.ping);
  return Number.isFinite(n) ? n : null;
}

function getStatus(item) {
  const loss = getLoss(item);
  if (item?.inLoss || loss >= 50) return "CRITICAL";
  if (loss > 0) return "DEGRADED";
  return "HEALTHY";
}

function statusColor(item) {
  const s = getStatus(item);
  if (s === "CRITICAL") return "#ff6488";
  if (s === "DEGRADED") return "#ffbf57";
  return "#2ed47a";
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: "linear-gradient(180deg, rgba(11,18,31,0.98), rgba(7,12,22,0.99))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.20)"
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(220,228,240,0.56)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function TileSpark({ points, item }) {
  const width = 320;
  const height = 64;
  const pad = 4;
  const safe = Array.isArray(points) ? points.slice(-60) : [];
  const color = statusColor(item);

  if (!safe.length) {
    return (
      <div
        style={{
          height: 64,
          borderRadius: 10,
          background: "rgba(0,0,0,0.04)"
        }}
      />
    );
  }

  const vals = safe.map((p) => Number(p?.loss ?? 0));
  const max = Math.max(5, ...vals);

  const x = (i) => pad + (i * (width - pad * 2)) / Math.max(1, safe.length - 1);
  const y = (v) => height - pad - (Math.max(0, Number(v || 0)) * (height - pad * 2)) / max;
  const path = safe.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.loss)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="64" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceLogo({ host }) {
  const url = iconUrlForHost(host);

  if (!url) {
    return (
      <div
        style={{
          width: 116,
          height: 116,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          border: "3px solid rgba(0,0,0,0.10)",
          color: "#f5f8ff",
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: "0.10em"
        }}
      >
        DNS
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      style={{
        width: 116,
        height: 116,
        objectFit: "contain",
        borderRadius: 20,
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.14))"
      }}
    />
  );
}

function ServiceTile({ host, item, series, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(host)}
      style={{
        width: "100%",
        textAlign: "center",
        cursor: "pointer",
        background: "#ececec",
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 16,
        padding: "10px 14px 12px",
        boxShadow: "0 14px 24px rgba(0,0,0,0.18)"
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: "#2f2f2f",
          fontWeight: 500,
          marginBottom: 10
        }}
      >
        {displayName(host)}
      </div>

      <div
        style={{
          minHeight: 156,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10
        }}
      >
        <ServiceLogo host={host} />
      </div>

      <TileSpark points={series} item={item} />

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 12,
          color: "#222",
          fontWeight: 700
        }}
      >
        <span>{fmtPct(item?.last?.loss)}</span>
        <span>{fmtMs(item?.last?.ping)}</span>
      </div>
    </button>
  );
}

function IpCard({ host, item, onOpen }) {
  const color = statusColor(item);

  return (
    <button
      type="button"
      onClick={() => onOpen(host)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 22,
        padding: 16,
        background: "linear-gradient(180deg, rgba(14,20,34,0.98), rgba(8,12,22,0.99))",
        border: `1px solid ${color}55`,
        boxShadow: `0 18px 36px ${color}15`
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 999,
            border: `4px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.03)",
            color: "#f4f7ff",
            fontWeight: 900,
            letterSpacing: "0.10em",
            fontSize: 14
          }}
        >
          DNS
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fbff", wordBreak: "break-word" }}>
            {host}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              color: "rgba(220,228,240,0.56)",
              textTransform: "uppercase",
              letterSpacing: "0.14em"
            }}
          >
            Direct IP · {getStatus(item)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div
          style={{
            borderRadius: 16,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(220,228,240,0.54)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Ping
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fbff" }}>{fmtMs(item?.last?.ping)}</div>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(220,228,240,0.54)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Loss
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color }}>{fmtPct(item?.last?.loss)}</div>
        </div>
      </div>
    </button>
  );
}

function SeriesChart({ points }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 760;
  const height = 260;
  const pad = 16;

  if (!Array.isArray(points) || points.length === 0) {
    return <div style={{ padding: 24, color: "rgba(220,228,240,0.64)" }}>No 24h recorder data yet.</div>;
  }

  const safe = points.slice(-420);
  const lossVals = safe.map((p) => Number(p?.loss ?? 0));
  const pingVals = safe.map((p) => Number(p?.ping)).filter((n) => Number.isFinite(n));

  const maxLoss = Math.max(5, ...lossVals);
  const maxPing = Math.max(20, ...(pingVals.length ? pingVals : [20]));

  const x = (i) => pad + (i * (width - pad * 2)) / Math.max(1, safe.length - 1);
  const yLoss = (v) => height - pad - (Math.max(0, Number(v || 0)) * (height - pad * 2)) / maxLoss;
  const yPing = (v) => {
    const n = Number(v);
    const safeN = Number.isFinite(n) ? n : 0;
    return height - pad - (safeN * (height - pad * 2)) / maxPing;
  };

  const lossPath = safe.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yLoss(p.loss)}`).join(" ");
  const pingPath = safe.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yPing(p.ping)}`).join(" ");

  const hoverPoint = hoverIndex == null ? null : safe[hoverIndex];
  const hx = hoverIndex == null ? null : x(hoverIndex);
  const hyLoss = hoverIndex == null ? null : yLoss(hoverPoint?.loss);
  const hyPing = hoverIndex == null ? null : yPing(hoverPoint?.ping);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(220,228,240,0.72)", fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ffbf57", display: "inline-block" }} />
          Loss %
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(220,228,240,0.72)", fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#7ec8ff", display: "inline-block" }} />
          Ping ms
        </div>
        <div style={{ fontSize: 12, color: "rgba(220,228,240,0.58)" }}>
          Window: last {safe.length} samples
        </div>
      </div>

      {hoverPoint ? (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 3,
            borderRadius: 14,
            padding: "10px 12px",
            background: "rgba(9,13,22,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 14px 28px rgba(0,0,0,0.28)"
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(220,228,240,0.70)", marginBottom: 6 }}>
            {fmtTs(hoverPoint.ts)}
          </div>
          <div style={{ fontSize: 12, color: "#ffbf57", fontWeight: 900 }}>Loss: {fmtPct(hoverPoint.loss)}</div>
          <div style={{ fontSize: 12, color: "#7ec8ff", fontWeight: 900, marginTop: 4 }}>Ping: {fmtMs(hoverPoint.ping)}</div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="280"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {safe.map((p, i) => {
          const left = i === 0 ? 0 : (x(i - 1) + x(i)) / 2;
          const right = i === safe.length - 1 ? width : (x(i) + x(i + 1)) / 2;
          return (
            <rect
              key={`hover-${i}`}
              x={left}
              y={0}
              width={Math.max(6, right - left)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseMove={() => setHoverIndex(i)}
            />
          );
        })}

        {hoverIndex != null ? (
          <line x1={hx} y1={pad} x2={hx} y2={height - pad} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
        ) : null}

        <path d={lossPath} fill="none" stroke="#ffbf57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pingPath} fill="none" stroke="#7ec8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {hoverIndex != null ? (
          <>
            <circle cx={hx} cy={hyLoss} r="5" fill="#ffbf57" stroke="rgba(9,13,22,0.95)" strokeWidth="2" />
            <circle cx={hx} cy={hyPing} r="5" fill="#7ec8ff" stroke="rgba(9,13,22,0.95)" strokeWidth="2" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

function LatestSamples({ points }) {
  const rows = Array.isArray(points) ? [...points].slice(-30).reverse() : [];

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 800, color: "#f8fbff" }}>
        Latest samples
      </div>
      <div style={{ maxHeight: 290, overflow: "auto" }}>
        {rows.length ? rows.map((p, idx) => (
          <div
            key={`${p.ts}-${idx}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 90px",
              gap: 12,
              padding: "12px 16px",
              borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <div style={{ color: "#f8fbff" }}>{fmtTs(p.ts)}</div>
            <div style={{ color: "#ffbf57", fontWeight: 900 }}>{fmtPct(p.loss)}</div>
            <div style={{ color: "#7ec8ff", fontWeight: 900 }}>{fmtMs(p.ping)}</div>
          </div>
        )) : (
          <div style={{ padding: 16, color: "rgba(220,228,240,0.64)" }}>No samples yet.</div>
        )}
      </div>
    </div>
  );
}

function LossEvents({ host, events }) {
  const rows = Array.isArray(events) ? events.filter((e) => e.host === host).slice(-10).reverse() : [];

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 800, color: "#f8fbff" }}>
        Loss events
      </div>
      <div style={{ maxHeight: 640, overflow: "auto" }}>
        {rows.length ? rows.map((e, idx) => (
          <div
            key={`${e.host}-${e.start}-${idx}`}
            style={{
              padding: "14px 16px",
              borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <div style={{ fontSize: 13, color: "#f8fbff", fontWeight: 900, marginBottom: 8 }}>
              Recovered event
            </div>
            <div style={{ fontSize: 12, color: "rgba(220,228,240,0.72)", marginBottom: 4 }}>
              Start: {fmtTs(e.start)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(220,228,240,0.72)", marginBottom: 4 }}>
              End: {fmtTs(e.end)}
            </div>
            <div style={{ fontSize: 12, color: "#ffbf57", fontWeight: 900 }}>
              Duration: {fmtDuration(e.duration)}
            </div>
          </div>
        )) : (
          <div style={{ padding: 16, color: "rgba(220,228,240,0.64)" }}>No completed events for this target yet.</div>
        )}
      </div>
    </div>
  );
}

function TargetModal({ host, item, series, events, loading, onClose }) {
  if (!host) return null;

  const lossVals = Array.isArray(series) ? series.map((p) => Number(p?.loss ?? 0)).filter((n) => Number.isFinite(n)) : [];
  const pingVals = Array.isArray(series) ? series.map((p) => Number(p?.ping)).filter((n) => Number.isFinite(n)) : [];

  const avgLoss = lossVals.length ? Math.round(lossVals.reduce((a, b) => a + b, 0) / lossVals.length) : 0;
  const avgPing = pingVals.length ? Math.round(pingVals.reduce((a, b) => a + b, 0) / pingVals.length) : 0;
  const maxLoss = lossVals.length ? Math.max(...lossVals) : 0;
  const color = statusColor(item);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5,8,16,0.76)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div
        style={{
          width: "min(1260px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          borderRadius: 28,
          background: "linear-gradient(180deg, rgba(12,18,30,0.995), rgba(8,12,22,0.995))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.40)",
          padding: 24
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0 }}>
            {isIp(host) ? (
              <div
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `5px solid ${color}`,
                  background: "rgba(255,255,255,0.03)",
                  color: "#eef4ff",
                  fontWeight: 900,
                  letterSpacing: "0.10em",
                  fontSize: 18
                }}
              >
                DNS
              </div>
            ) : (
              <img
                src={iconUrlForHost(host)}
                alt=""
                style={{ width: 78, height: 78, objectFit: "contain", borderRadius: 18 }}
              />
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(220,228,240,0.56)", marginBottom: 8 }}>
                Recorder drill-down
              </div>
              <div style={{ fontSize: 38, fontWeight: 950, color: "#f8fbff", lineHeight: 1.02, wordBreak: "break-word" }}>
                {displayName(host)}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "rgba(220,228,240,0.70)" }}>
                {host} · {getStatus(item)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 14,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f8fbff",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 12, marginBottom: 18 }}>
          {[
            ["Current Ping", fmtMs(item?.last?.ping), "#f8fbff"],
            ["Current Loss", fmtPct(item?.last?.loss), color],
            ["State", item?.inLoss ? "open" : "stable", color],
            ["Avg Ping", fmtMs(avgPing), "#7ec8ff"],
            ["Avg Loss", `${avgLoss}%`, "#ffbf57"],
            ["Max Loss", `${maxLoss}%`, "#ff7f97"]
          ].map(([label, value, c]) => (
            <div
              key={label}
              style={{
                borderRadius: 18,
                padding: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}
            >
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(220,228,240,0.54)", marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 950, color: c, lineHeight: 1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 0.9fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: "rgba(220,228,240,0.72)", marginBottom: 10 }}>
              24h graphing recorder
            </div>
            {loading ? (
              <div style={{ padding: 20, color: "rgba(220,228,240,0.65)" }}>Loading series...</div>
            ) : (
              <SeriesChart points={series} />
            )}

            <div style={{ marginTop: 16 }}>
              <LatestSamples points={series} />
            </div>
          </div>

          <div>
            <LossEvents host={host} events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PacketLossPage() {
  const [live, setLive] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [selectedHost, setSelectedHost] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesMap, setSeriesMap] = useState({});

  async function loadLive() {
    const r = await fetch("/api/packetloss/live", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error("packetloss live failed");
    setLive(j || {});
  }

  async function loadHistory() {
    const r = await fetch("/api/packetloss/history", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error("packetloss history failed");
    setHistory(Array.isArray(j) ? j : []);
  }

  async function loadSeries(host) {
    if (!host) return;
    setSeriesLoading(true);
    try {
      const r = await fetch(`/api/packetloss/series?host=${encodeURIComponent(host)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error("packetloss series failed");
      setSelectedSeries(Array.isArray(j) ? j : []);
    } catch (e) {
      setSelectedSeries([]);
      setErr(String(e?.message || e || "series failed"));
    } finally {
      setSeriesLoading(false);
    }
  }

  async function preloadTileSeries(hosts) {
    try {
      const entries = await Promise.all(
        hosts.map(async (host) => {
          const r = await fetch(`/api/packetloss/series?host=${encodeURIComponent(host)}`, { cache: "no-store" });
          const j = await r.json();
          return [host, Array.isArray(j) ? j : []];
        })
      );
      setSeriesMap(Object.fromEntries(entries));
    } catch {}
  }

  useEffect(() => {
    let dead = false;

    const boot = async () => {
      try {
        setErr("");
        await Promise.all([loadLive(), loadHistory()]);
        await preloadTileSeries(SERVICE_ORDER);
      } catch (e) {
        if (!dead) setErr(String(e?.message || e || "load failed"));
      } finally {
        if (!dead) setLoading(false);
      }
    };

    boot();

    const t1 = setInterval(async () => {
      try {
        await loadLive();
      } catch (e) {
        if (!dead) setErr(String(e?.message || e || "live failed"));
      }
    }, LIVE_MS);

    const t2 = setInterval(async () => {
      try {
        await loadHistory();
      } catch (e) {
        if (!dead) setErr(String(e?.message || e || "history failed"));
      }
    }, HISTORY_MS);

    const t3 = setInterval(async () => {
      try {
        await preloadTileSeries(SERVICE_ORDER);
      } catch {}
    }, SERIES_MS);

    return () => {
      dead = true;
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
    };
  }, []);

  useEffect(() => {
    if (!selectedHost) return;
    loadSeries(selectedHost);
    const t = setInterval(() => loadSeries(selectedHost), SERIES_MS);
    return () => clearInterval(t);
  }, [selectedHost]);

  const rows = useMemo(() => {
    return Object.entries(live || {}).map(([host, item]) => ({ host, item }));
  }, [live]);

  const liveMap = useMemo(() => {
    const m = {};
    for (const [host, item] of Object.entries(live || {})) m[host] = item;
    return m;
  }, [live]);

  const serviceTiles = SERVICE_ORDER.filter((h) => liveMap[h]).map((host) => ({
    host,
    item: liveMap[host],
    series: seriesMap[host] || []
  }));

  const ipTiles = rows.filter((x) => isIp(x.host)).sort((a, b) => a.host.localeCompare(b.host));

  const healthyCount = rows.filter((x) => getStatus(x.item) === "HEALTHY").length;
  const degradedCount = rows.filter((x) => getStatus(x.item) === "DEGRADED").length;
  const criticalCount = rows.filter((x) => getStatus(x.item) === "CRITICAL").length;
  const eventsCount = history.length;

  function openHost(host) {
    setSelectedHost(host);
  }

  function closeModal() {
    setSelectedHost(null);
    setSelectedSeries([]);
  }

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 22,
        color: "#f8fbff",
        background: "#03060d"
      }}
    >
      <div
        style={{
          borderRadius: 20,
          padding: 18,
          marginBottom: 18,
          background: "linear-gradient(180deg, rgba(10,16,28,0.98), rgba(6,10,18,0.99))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)"
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.16em", color: "rgba(220,228,240,0.56)", textTransform: "uppercase", marginBottom: 8 }}>
          Global service overview
        </div>
        <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1, marginBottom: 10 }}>
          Packet Loss Service Board
        </div>
        <div style={{ fontSize: 14, color: "rgba(220,228,240,0.70)" }}>
          World-style service tiles for domains, with click-to-open recorder drill-down and real loss event timeline.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
        <StatCard label="Healthy" value={healthyCount} color="#27d980" />
        <StatCard label="Degraded" value={degradedCount} color="#ffbf57" />
        <StatCard label="Critical" value={criticalCount} color="#ff6687" />
        <StatCard label="Events" value={eventsCount} color="#7ec8ff" />
      </div>

      <div
        style={{
          borderRadius: 22,
          padding: 16,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 18
        }}
      >
        <div style={{ fontSize: 13, color: "rgba(220,228,240,0.58)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
          Domain services
        </div>

        {loading ? (
          <div style={{ padding: 20, color: "rgba(220,228,240,0.66)" }}>Loading services...</div>
        ) : err ? (
          <div style={{ padding: 20, color: "#ff9cb2" }}>{err}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
            {serviceTiles.map(({ host, item, series }) => (
              <ServiceTile key={host} host={host} item={item} series={series} onOpen={openHost} />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          borderRadius: 22,
          padding: 16,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        <div style={{ fontSize: 13, color: "rgba(220,228,240,0.58)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
          Direct IP targets
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
          {ipTiles.map(({ host, item }) => (
            <IpCard key={host} host={host} item={item} onOpen={openHost} />
          ))}
        </div>
      </div>

      <TargetModal
        host={selectedHost}
        item={selectedHost ? liveMap[selectedHost] : null}
        series={selectedSeries}
        events={history}
        loading={seriesLoading}
        onClose={closeModal}
      />
    </div>
  );
}
