import React, { useEffect, useMemo, useRef, useState } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtPct(v) {
  const n = num(v);
  return n.toFixed(2) + "%";
}

function parseTs(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  const ms = new Date(v).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function fmtTime(v) {
  const ms = parseTs(v);
  if (!ms) return "-";
  const d = new Date(ms);
  return d.toLocaleString();
}

function shortTime(v, range) {
  const ms = parseTs(v);
  if (!ms) return "";
  const d = new Date(ms);
  if (range === "24h" || range === "30d") {
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function minSpanMsForRange(range) {
  switch (String(range || "").trim()) {
    case "5m": return 5 * 60 * 1000;
    case "30m": return 30 * 60 * 1000;
    case "60m": return 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    default: return 5 * 60 * 1000;
  }
}
function bucketTs(ms, range) {
  const n = parseTs(ms);
  if (!n) return 0;
  let size = 30000;
  if (range === "30m") size = 60000;
  else if (range === "60m") size = 120000;
  else if (range === "24h") size = 900000;
  else if (range === "30d") size = 6 * 60 * 60 * 1000;
  return Math.floor(n / size) * size;
}

function sourceTone(source) {
  if (source === "uplink") return "#63ffa3";
  if (source === "monitor") return "#78a9ff";
  if (source === "aviat") return "#ffd76a";
  return "#ffffff";
}

function targetTone(key) {
  const str = String(key || "");
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  const tones = ["#63ffa3", "#78a9ff", "#ffd76a", "#ff9f7a", "#d395ff", "#7ce7ff", "#f36ca6", "#b6f06d"];
  return tones[h % tones.length];
}

function SummaryCard({ label, value, sub, color = "#ffffff" }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 12px 28px rgba(0,0,0,0.22)"
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color }}>{value}</div>
      <div style={{ marginTop: 8, opacity: 0.72, fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function buildSeries(rows, range, targetFilter) {
  const src = Array.isArray(rows) ? rows : [];
  const withTs = src
    .map((r) => ({
      ...r,
      __ts: parseTs(r?.ts),
      __bucket: bucketTs(r?.ts, range),
      __rx: num(r?.rx),
      __tx: num(r?.tx)
    }))
    .filter((r) => r.__ts > 0);

  if (targetFilter && targetFilter !== "all") {
    const grouped = new Map();
    for (const r of withTs) {
      const key = r.__bucket;
      const prev = grouped.get(key) || {
        ts: r.__bucket,
        label: shortTime(r.__bucket, range),
        rxSum: 0,
        txSum: 0,
        count: 0,
        rx: 0,
        tx: 0
      };
      prev.rxSum += r.__rx;
      prev.txSum += r.__tx;
      prev.count += 1;
      prev.rx = prev.count > 0 ? (prev.rxSum / prev.count) : 0;
      prev.tx = prev.count > 0 ? (prev.txSum / prev.count) : 0;
      grouped.set(key, prev);
    }
    return [{
      key: targetFilter,
      label: src[0]?.target || targetFilter,
      color: targetTone(targetFilter),
      source: src[0]?.source || "mixed",
      points: [...grouped.values()].sort((a, b) => a.ts - b.ts)
    }];
  }

  const scoreMap = new Map();
  for (const r of withTs) {
    const key = r?.targetId || r?.target || "unknown";
    const prev = scoreMap.get(key) || {
      key,
      label: r?.target || key,
      score: 0,
      source: r?.source || "mixed"
    };
    prev.score += r.__rx + r.__tx;
    scoreMap.set(key, prev);
  }

  const topKeys = [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, range === "24h" || range === "30d" ? 6 : 4)
    .map((x) => x.key);

  const keep = new Set(topKeys);
  const byTarget = new Map();

  for (const r of withTs) {
    const key = r?.targetId || r?.target || "unknown";
    if (!keep.has(key)) continue;

    if (!byTarget.has(key)) {
      byTarget.set(key, {
        key,
        label: r?.target || key,
        color: targetTone(key),
        source: r?.source || "mixed",
        pointsMap: new Map()
      });
    }

    const series = byTarget.get(key);
    const point = series.pointsMap.get(r.__bucket) || {
      ts: r.__bucket,
      label: shortTime(r.__bucket, range),
      rxSum: 0,
      txSum: 0,
      count: 0,
      rx: 0,
      tx: 0
    };
    point.rxSum += r.__rx;
    point.txSum += r.__tx;
    point.count += 1;
    point.rx = point.count > 0 ? (point.rxSum / point.count) : 0;
    point.tx = point.count > 0 ? (point.txSum / point.count) : 0;
    series.pointsMap.set(r.__bucket, point);
  }

  return [...byTarget.values()]
    .map((s) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      source: s.source,
      points: [...s.pointsMap.values()].sort((a, b) => a.ts - b.ts)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function HistoryChart({ rows, range, selectedTarget, hiddenSeries, onToggleSeries }) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const rawSeries = useMemo(() => buildSeries(rows, range, selectedTarget), [rows, range, selectedTarget]);
  const series = useMemo(() => rawSeries.filter((s) => !hiddenSeries?.[s.key]), [rawSeries, hiddenSeries]);

  const width = 1200;
  const height = 330;
  const padL = 54;
  const padR = 24;
  const padT = 20;
  const padB = 40;

  const allPoints = series.flatMap((s) => s.points.map((p) => ({ ...p, seriesKey: s.key, color: s.color, labelName: s.label })));
  const maxVal = Math.max(1, ...allPoints.map((p) => Math.max(num(p.rx), num(p.tx))));
  const tsValues = allPoints.map((p) => p.ts).filter((v) => Number.isFinite(v) && v > 0);
  const rawMinTs = tsValues.length ? Math.min(...tsValues) : 0;
  const rawMaxTs = tsValues.length ? Math.max(...tsValues) : 1;

  const minSpan = minSpanMsForRange(range);
  let minTs = rawMinTs;
  let maxTs = rawMaxTs;

  if ((maxTs - minTs) < minSpan) {
    maxTs = rawMaxTs;
    minTs = Math.max(0, maxTs - minSpan);
  }

  function x(ts) {
    const span = Math.max(1, Number(maxTs || 0) - Number(minTs || 0));
    return padL + ((ts - minTs) / span) * (width - padL - padR);
  }

  function y(v) {
    return padT + (1 - (num(v) / maxVal)) * (height - padT - padB);
  }

  function linePath(points, keyName) {
    return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.ts).toFixed(2)} ${y(keyName === "rx" ? p.rx : p.tx).toFixed(2)}`).join(" ");
  }

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((r) => Number((maxVal * r).toFixed(2)));

  if (!allPoints.length) {
    return (
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 18,
          padding: 24
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900 }}>No rows for this filter</div>
        <div style={{ opacity: 0.72, marginTop: 10 }}>Try another range, target, source, or search.</div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        borderRadius: 18,
        padding: 18,
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Unified Traffic Timeline</div>
          <div style={{ opacity: 0.72, marginTop: 4 }}>
            {selectedTarget !== "all"
              ? "Selected target history with RX/TX lines"
              : "Top targets across the selected chart mode with clean multi-series lines"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {rawSeries.map((s) => {
            const hidden = !!hiddenSeries?.[s.key];
            return (
              <button
                key={s.key}
                onClick={() => onToggleSeries && onToggleSeries(s.key)}
                title={hidden ? "Show series" : "Hide series"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: hidden ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: hidden ? "rgba(255,255,255,0.45)" : "#fff",
                  cursor: "pointer",
                  opacity: hidden ? 0.55 : 1
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color, display: "inline-block", opacity: hidden ? 0.45 : 1 }} />
                <span style={{ textDecoration: hidden ? "line-through" : "none" }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", display: "block" }}>
        {gridVals.map((gv, idx) => {
          const yy = y(gv);
          return (
            <g key={idx}>
              <line x1={padL} x2={width - padR} y1={yy} y2={yy} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
              <text x={8} y={yy + 4} fill="rgba(255,255,255,0.60)" fontSize="12" fontWeight="700">
                {fmtMbps(gv)}
              </text>
            </g>
          );
        })}

        {series.map((s) => (
          <g key={s.key}>
            <path d={linePath(s.points, "rx")} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" style={{ transition: "all 320ms ease" }} />
            <path d={linePath(s.points, "tx")} fill="none" stroke={s.color} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" style={{ transition: "all 320ms ease" }} />
            {s.points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={x(p.ts)}
                  cy={y(p.rx)}
                  r="5" fill={s.color} style={{ transition: "all 220ms ease", cursor: "pointer" }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                    setHover({
                      left: e.clientX - rect.left + 16,
                      top: e.clientY - rect.top + 16,
                      target: s.label,
                      source: s.source,
                      time: fmtTime(p.ts),
                      rx: p.rx,
                      tx: p.tx
                    });
                  }}                  onMouseLeave={() => setHover(null)}
                />
              </g>
            ))}
          </g>
        ))}

        {(() => {
          const xTicks = [...new Set(allPoints.map((p) => p.ts))].sort((a, b) => a - b);
          const step = Math.max(1, Math.ceil(xTicks.length / 8));
          return xTicks.filter((_, idx) => idx % step === 0).map((ts, idx) => (
            <g key={idx}>
              <line x1={x(ts)} x2={x(ts)} y1={padT} y2={height - padB} stroke="rgba(255,255,255,0.04)" />
              <text x={x(ts)} y={height - 12} textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize="11" fontWeight="700">
                {shortTime(ts, range)}
              </text>
            </g>
          ));
        })()}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", opacity: 0.72, fontSize: 12 }}>
        <div><strong>Solid</strong> = RX</div>
        <div><strong>Dashed</strong> = TX</div>
      </div>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: hover.left,
            top: hover.top,
            minWidth: 250,
            pointerEvents: "none",
            borderRadius: 14,
            padding: 12,
            background: "rgba(10,14,22,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
            backdropFilter: "blur(8px)"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 15 }}>{hover.target}</div>
          <div style={{ marginTop: 4, opacity: 0.7 }}>{hover.source}</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>{hover.time}</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "auto auto", gap: 8 }}>
            <div>RX</div><div><strong style={{ color: "#63ffa3" }}>{fmtMbps(hover.rx)}</strong></div>
            <div>TX</div><div><strong style={{ color: "#78a9ff" }}>{fmtMbps(hover.tx)}</strong></div>
            <div>Total</div><div><strong style={{ color: "#ffd76a" }}>{fmtMbps(num(hover.rx) + num(hover.tx))}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100%",
  padding: 16,
  color: "#fff",
  background: "radial-gradient(circle at top left, rgba(90,120,255,0.16), transparent 32%), radial-gradient(circle at top right, rgba(99,255,163,0.12), transparent 28%), #0b1020"
};

const panel = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  borderRadius: 18,
  boxShadow: "0 12px 28px rgba(0,0,0,0.22)"
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  opacity: 0.7,
  marginBottom: 8
};

function normalizeRows(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((r) => ({
    ...r,
    ts: parseTs(r?.ts),
    rx: num(r?.rx),
    tx: num(r?.tx),
    source: String(r?.source || ""),
    type: String(r?.type || ""),
    target: String(r?.target || ""),
    targetId: String(r?.targetId || r?.target || "")
  })).filter((r) => r.ts > 0);
}

export default function HistoryPage() {
  const [range, setRange] = useState("5m");
  const [source, setSource] = useState("all");
const [chartMode, setChartMode] = useState("unified");
const [hiddenSeries, setHiddenSeries] = useState({});
  const [target, setTarget] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
const [autoRefresh, setAutoRefresh] = useState(true);
const [refreshMs, setRefreshMs] = useState(10000);
const [lastRefreshAt, setLastRefreshAt] = useState(0);

  async function loadData(currentRange, currentSource, currentQ) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("range", currentRange);
      params.set("source", currentSource || "all");
      params.set("q", currentQ || "");
      params.set("limit", currentRange === "30d" ? "50000" : "12000");

      const r = await fetch(`/api/history/unified?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Unified history failed");

      const items = normalizeRows(j?.items);
      setRows(items);
    } catch (e) {
      setRows([]);
      setErr(String(e?.message || e || "Unknown history error"));
    } finally {
      setLoading(false);
      setLastRefreshAt(Date.now());
    }
  }

  useEffect(() => {
    loadData(range, source, appliedSearch);
  }, [range, source, appliedSearch]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      loadData(range, source, appliedSearch);
    }, Math.max(3000, Number(refreshMs || 10000)));
    return () => clearInterval(id);
  }, [autoRefresh, refreshMs, range, source, appliedSearch]);

  useEffect(() => {
    setPage(1);
  }, [range, source, target, appliedSearch]);

  useEffect(() => {
    setHiddenSeries({});
  }, [range, source, target, appliedSearch, chartMode]);

  const targetItems = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.targetId)) {
        const sourceRank = r.source === "monitor" ? 1 : r.source === "uplink" ? 2 : r.source === "aviat" ? 3 : 9;
        map.set(r.targetId, {
          value: r.targetId,
          label: `${r.target} • ${r.source} • ${r.type}`,
          target: r.target || "",
          source: r.source || "",
          type: r.type || "",
          sourceRank
        });
      }
    }

    const sorted = [...map.values()].sort((a, b) => {
      if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
      if (a.source !== b.source) return a.source.localeCompare(b.source);
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.target.localeCompare(b.target);
    });

    return [{ value: "all", label: "All targets", target: "All targets", source: "all", type: "", sourceRank: 0 }, ...sorted];
  }, [rows]);

  useEffect(() => {
    if (!targetItems.some((x) => x.value === target)) {
      setTarget("all");
    }
  }, [targetItems, target]);

  const filteredRows = useMemo(() => {
  let out = Array.isArray(rows) ? rows.slice() : [];

  if (target !== "all") {
    out = out.filter((r) => r.targetId === target);
  }

  out.sort((a, b) => a.ts - b.ts);
  return out;
}, [rows, target]);

const chartRows = useMemo(() => {
  let out = Array.isArray(filteredRows) ? filteredRows.slice() : [];

  if (chartMode === "uplink") {
    out = out.filter((r) => r.source === "uplink");
  } else if (chartMode === "monitor") {
    out = out.filter((r) => r.source === "monitor");
  } else if (chartMode === "aviat") {
    out = out.filter((r) => r.source === "aviat");
  }

  out.sort((a, b) => a.ts - b.ts);
  return out;
}, [filteredRows, chartMode]);

  const stats = useMemo(() => {
    const latest = filteredRows.length ? filteredRows[filteredRows.length - 1] : null;
    const latestTotal = latest ? num(latest.rx) + num(latest.tx) : 0;
    return {
      status: err && filteredRows.length === 0 ? "ERROR" : loading ? "LOADING" : "OK",
      rows: filteredRows.length,
      rx: latest ? num(latest.rx) : 0,
      tx: latest ? num(latest.tx) : 0,
      type: latest?.type || "-",
      target: latest?.target || "-",
      source: latest?.source || "-",
      total: latestTotal,
      ts: latest?.ts || 0
    };
  }, [filteredRows, err, loading]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage]);

  const topTalkers = useMemo(() => {
    const map = new Map();
    for (const r of filteredRows) {
      const key = r.targetId || r.target || "unknown";
      const value = num(r.rx) + num(r.tx);
      const prev = map.get(key) || {
        key,
        target: r.target || key,
        source: r.source || "-",
        type: r.type || "-",
        total: 0,
        rx: 0,
        tx: 0,
        peak: 0,
        samples: 0,
        avg: 0
      };
      prev.rx += num(r.rx);
      prev.tx += num(r.tx);
      prev.total += value;
      prev.peak = Math.max(prev.peak, value);
      prev.samples += 1;
      map.set(key, prev);
    }

    return [...map.values()]
      .map((x) => ({
        ...x,
        avg: x.samples > 0 ? (x.total / x.samples) : 0
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [filteredRows]);

  const sourceBreakdown = useMemo(() => {
    const base = [
      { source: "uplink", rows: 0, total: 0 },
      { source: "monitor", rows: 0, total: 0 },
      { source: "aviat", rows: 0, total: 0 }
    ];
    const map = new Map(base.map(x => [x.source, { ...x }]));
    for (const r of filteredRows) {
      const key = r.source || "unknown";
      if (!map.has(key)) map.set(key, { source: key, rows: 0, total: 0 });
      const item = map.get(key);
      item.rows += 1;
      item.total += num(r.rx) + num(r.tx);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const lastRefreshText = useMemo(() => {
    if (!lastRefreshAt) return "-";
    return new Date(lastRefreshAt).toLocaleTimeString();
  }, [lastRefreshAt]);

  return (
    <div style={pageStyle}>
      <div style={{ ...panel, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em" }}>Unified History</div>
            <div style={{ opacity: 0.74, marginTop: 6 }}>
              One clean NOC-level history page for Uplink, Monitor Street, and Aviat WTM4200 with live controls and interactive chart analysis.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { value: "5m", label: "5 Minutes" },
              { value: "30m", label: "30 Minutes" },
              { value: "60m", label: "60 Minutes" },
              { value: "24h", label: "24 Hours" },
              { value: "30d", label: "30 Days" }
            ].map((x) => (
              <button
                key={x.value}
                onClick={() => setRange(x.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: x.value === range ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                  background: x.value === range ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...panel, padding: 18, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Live Controls</div>
            <div style={{ opacity: 0.72, marginTop: 4 }}>
              Auto refresh, interval control, and live status for the NOC timeline.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                background: autoRefresh ? "rgba(99,255,163,0.14)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontWeight: 800
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  display: "inline-block",
                  background: autoRefresh ? "#63ffa3" : "rgba(255,255,255,0.35)",
                  boxShadow: autoRefresh ? "0 0 14px rgba(99,255,163,0.75)" : "none"
                }}
              />
              {autoRefresh ? "LIVE" : "PAUSED"}
            </div>

            <button
              onClick={() => setAutoRefresh((v) => !v)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: autoRefresh ? "rgba(99,255,163,0.14)" : "rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              {autoRefresh ? "Stop Auto Refresh" : "Start Auto Refresh"}
            </button>

            <select
              value={String(refreshMs)}
              onChange={(e) => setRefreshMs(Number(e.target.value || 10000))}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: "10px 12px"
              }}
            >
              <option value="5000" style={{ color: "#000" }}>5s</option>
              <option value="10000" style={{ color: "#000" }}>10s</option>
              <option value="15000" style={{ color: "#000" }}>15s</option>
              <option value="30000" style={{ color: "#000" }}>30s</option>
            </select>

            <button
              onClick={() => loadData(range, source, appliedSearch)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(120,169,255,0.14)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Refresh Now
            </button>

            <div style={{ opacity: 0.72, fontSize: 13 }}>
              Last refresh: <strong>{lastRefreshText}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
        <SummaryCard label="Status" value={stats.status} sub={err ? err : "Unified history online"} color={stats.status === "OK" ? "#63ffa3" : stats.status === "LOADING" ? "#ffd76a" : "#ff7f96"} />
        <SummaryCard label="Rows" value={String(stats.rows)} sub="Filtered rows only" color="#8fe9ff" />
        <SummaryCard label="Latest RX" value={fmtMbps(stats.rx)} sub="Based on current filter" color="#63ffa3" />
        <SummaryCard label="Latest TX" value={fmtMbps(stats.tx)} sub="Based on current filter" color="#78a9ff" />
        <SummaryCard label="Latest Type" value={stats.type} sub={stats.source} color={sourceTone(stats.source)} />
        <SummaryCard label="Latest Target" value={stats.target} sub={stats.ts ? fmtTime(stats.ts) : "-"} color="#ffd76a" />
      </div>

      <div style={{ ...panel, padding: 18, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1.6fr auto auto", gap: 14, alignItems: "end" }}>
          <div>
            <div style={labelStyle}>Source</div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: "12px 14px"
              }}
            >
              <option value="all" style={{ color: "#000" }}>All sources</option>
              <option value="uplink" style={{ color: "#000" }}>Uplink</option>
              <option value="monitor" style={{ color: "#000" }}>Monitor Street</option>
              <option value="aviat" style={{ color: "#000" }}>Aviat</option>
            </select>
          </div>

          <div>
            <div style={labelStyle}>Target</div>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: "12px 14px"
              }}
            >
              {targetItems.map((x) => (
                <option key={x.value} value={x.value} style={{ color: "#000" }}>{x.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Search</div>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search target / IP / type / source / status"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: "12px 14px"
              }}
            />
          </div>

          <button
            onClick={() => setAppliedSearch(searchInput.trim())}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(99,255,163,0.14)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 900
            }}
          >
            Apply
          </button>

          <button
            onClick={() => {
              setSource("all");
              setTarget("all");
              setSearchInput("");
              setAppliedSearch("");
              setRange("5m");
              setChartMode("unified");
            }}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 900
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{ ...panel, padding: 18, marginTop: 16 }}>
  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Chart Mode</div>
      <div style={{ opacity: 0.68, marginTop: 4 }}>
        Switch between unified view and per-source timelines for better scale balance. Click legend pills to hide or show any series.
      </div>
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {[
        { value: "unified", label: "Unified" },
        { value: "uplink", label: "Uplink" },
        { value: "monitor", label: "Monitor" },
        { value: "aviat", label: "Aviat" }
      ].map((x) => (
        <button
          key={x.value}
          onClick={() => setChartMode(x.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: x.value === chartMode ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
            background: x.value === chartMode ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          {x.label}
        </button>
      ))}
    </div>
  </div>
</div>

<div style={{ marginTop: 16 }}>
  <HistoryChart
          rows={chartRows}
          range={range}
          selectedTarget={target}
          hiddenSeries={hiddenSeries}
          onToggleSeries={(key) => setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }))}
        />
</div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 16, marginTop: 16 }}>
        <div style={{ ...panel, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Top Talkers</div>
              <div style={{ opacity: 0.68, marginTop: 4 }}>
                Ranked by average throughput inside the current filter, with peak and total shown for context.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {topTalkers.length === 0 ? (
              <div style={{ opacity: 0.72 }}>No data.</div>
            ) : topTalkers.map((r, idx) => (
              <div
                key={r.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr auto auto auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 900, opacity: 0.72 }}>#{idx + 1}</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{r.target}</div>
                  <div style={{ opacity: 0.65, marginTop: 4, fontSize: 12 }}>{r.source} • {r.type}</div>
                </div>
                <div style={{ color: "#63ffa3", fontWeight: 900 }}>Avg {fmtMbps(r.avg)}</div>
                <div style={{ color: "#78a9ff", fontWeight: 900 }}>Peak {fmtMbps(r.peak)}</div>
                <div style={{ color: "#ffd76a", fontWeight: 900 }}>Total {fmtMbps(r.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panel, padding: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Source Breakdown</div>
          <div style={{ opacity: 0.68, marginTop: 4 }}>
            Current filter distribution by source.
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {sourceBreakdown.map((r) => (
              <div
                key={r.source}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 900, color: sourceTone(r.source) }}>{r.source}</div>
                  <div style={{ opacity: 0.72 }}>{r.rows} rows</div>
                </div>
                <div style={{ marginTop: 8, fontWeight: 900 }}>{fmtMbps(r.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...panel, padding: 18, marginTop: 16 }}>
        <div style={labelStyle}>Latest sample</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          {stats.ts ? `${fmtTime(stats.ts)} • ${stats.source} • ${stats.type} • ${stats.target} • RX ${fmtMbps(stats.rx)} • TX ${fmtMbps(stats.tx)}` : "No sample"}
        </div>
      </div>

      <div style={{ ...panel, padding: 18, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Unified Records Table</div>
            <div style={{ opacity: 0.68, marginTop: 4 }}>
              Smart columns for uplink + monitor + aviat.
            </div>
          </div>
          <div style={{ opacity: 0.75 }}>{loading ? "Loading..." : `${filteredRows.length} row(s)`}</div>
        </div>

        <div style={{ marginTop: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth:0 }}>
            <thead>
              <tr>
                {["Time", "Type", "Target", "RX", "TX", "Source", "IP", "Ping", "Loss", "Capacity", "Utilization", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      opacity: 0.72,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 18, opacity: 0.72 }}>
                    {err ? err : "No rows found for the current filter."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, idx) => (
                  <tr key={`${r.targetId}:${r.ts}:${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{fmtTime(r.ts)}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap", fontWeight: 800 }}>{r.type || "-"}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap", fontWeight: 800 }}>{r.target || "-"}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "#63ffa3", fontWeight: 800 }}>{fmtMbps(r.rx)}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "#78a9ff", fontWeight: 800 }}>{fmtMbps(r.tx)}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: sourceTone(r.source), fontWeight: 800 }}>{r.source || "-"}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.ip || "-"}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.ping == null ? "-" : `${Math.round(num(r.ping))} ms`}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.loss == null ? "-" : `${num(r.loss).toFixed(0)}%`}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.capacity == null ? "-" : fmtMbps(r.capacity)}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.utilization == null ? "-" : fmtPct(r.utilization)}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{r.status || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ opacity: 0.68 }}>
            Showing {filteredRows.length === 0 ? 0 : (((safePage - 1) * pageSize) + 1)} to {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: safePage <= 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: safePage <= 1 ? "not-allowed" : "pointer"
              }}
            >
              Prev
            </button>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
              Page {safePage} / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: safePage >= totalPages ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: safePage >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}














