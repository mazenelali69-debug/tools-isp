import React, { useEffect, useMemo, useState } from "react";

const RANGES = ["5m", "30m", "1h", "1d", "30d"];
const VIEWS = [
  { key: "all", label: "Unified" },
  { key: "uplink", label: "Uplink" },
  { key: "switchB", label: "Switch B" },
  { key: "switchA", label: "Switch A" }
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseTs(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  const ms = new Date(v).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtTime(v) {
  const ms = parseTs(v);
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

function shortLabel(v, range) {
  const ms = parseTs(v);
  if (!ms) return "";
  const d = new Date(ms);

  if (range === "1d" || range === "30d") {
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function bucketTs(ms, range) {
  const n = parseTs(ms);
  if (!n) return 0;

  let size = 30000;
  if (range === "30m") size = 60000;
  else if (range === "1h") size = 120000;
  else if (range === "1d") size = 900000;
  else if (range === "30d") size = 6 * 60 * 60 * 1000;

  return Math.floor(n / size) * size;
}

function pollingMsForRange(range) {
  if (range === "5m") return 10000;
  if (range === "30m") return 15000;
  if (range === "1h") return 20000;
  if (range === "1d") return 60000;
  return 0;
}

function maxPointsForRange(range) {
  if (range === "5m") return 120;
  if (range === "30m") return 140;
  if (range === "1h") return 160;
  if (range === "1d") return 180;
  return 220;
}

function capPoints(list, maxPoints) {
  if (!Array.isArray(list)) return [];
  if (list.length <= maxPoints) return list;

  const step = Math.ceil(list.length / maxPoints);
  const out = [];

  for (let i = 0; i < list.length; i += step) {
    out.push(list[i]);
  }

  if (out[out.length - 1] !== list[list.length - 1]) {
    out.push(list[list.length - 1]);
  }

  return out;
}

function pageStyle() {
  return {
    minHeight: "100vh",
    padding: 16,
    color: "#fff",
    background:
      "radial-gradient(circle at top left, rgba(90,120,255,0.16), transparent 32%), radial-gradient(circle at top right, rgba(99,255,163,0.12), transparent 28%), #0b1020"
  };
}

function panelStyle() {
  return {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
    borderRadius: 18,
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)"
  };
}

function summaryColor(view) {
  if (view === "uplink") return "#78a9ff";
  if (view === "switchB") return "#ff9f7a";
  if (view === "switchA") return "#ffd76a";
  return "#63ffa3";
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
      <div style={{ opacity: 0.7, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color }}>
        {value}
      </div>
      <div style={{ marginTop: 8, opacity: 0.72, fontSize: 13 }}>
        {sub}
      </div>
    </div>
  );
}

function LegendChip({ color, label, dashed }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: 12,
        fontWeight: 700,
        color: "#fff"
      }}
    >
      <span
        style={{
          width: 18,
          height: 0,
          borderTop: `3px ${dashed ? "dashed" : "solid"} ${color}`
        }}
      />
      {label}
    </div>
  );
}

function buildAllSeries(rows, range) {
  const grouped = new Map();

  for (const r of rows) {
    const ts = bucketTs(r.ts, range);
    const prev = grouped.get(ts) || {
      ts,
      label: shortLabel(ts, range),
      uplinkTotal: 0,
      switchBTotal: 0,
      switchATotal: 0,
      count: 0
    };

    prev.uplinkTotal += num(r?.uplink?.totalMbps);
    prev.switchBTotal += num(r?.switchB?.totalMbps);
    prev.switchATotal += num(r?.switchA?.totalMbps);
    prev.count += 1;

    grouped.set(ts, prev);
  }

  return [...grouped.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((p) => {
      const uplinkTotal = p.count ? p.uplinkTotal / p.count : 0;
      const switchBTotal = p.count ? p.switchBTotal / p.count : 0;
      const switchATotal = p.count ? p.switchATotal / p.count : 0;

      return {
        ts: p.ts,
        label: p.label,
        uplinkTotal,
        switchBTotal,
        switchATotal,
        combinedTotal: uplinkTotal + switchBTotal + switchATotal
      };
    });
}

function buildSingleSeries(rows, range, key) {
  const grouped = new Map();

  for (const r of rows) {
    const ts = bucketTs(r.ts, range);
    const sourceObj =
      key === "uplink" ? r?.uplink :
      key === "switchB" ? r?.switchB :
      r?.switchA;

    const prev = grouped.get(ts) || {
      ts,
      label: shortLabel(ts, range),
      rxSum: 0,
      txSum: 0,
      count: 0
    };

    prev.rxSum += num(sourceObj?.rxMbps);
    prev.txSum += num(sourceObj?.txMbps);
    prev.count += 1;

    grouped.set(ts, prev);
  }

  return [...grouped.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((p) => {
      const rxMbps = p.count ? p.rxSum / p.count : 0;
      const txMbps = p.count ? p.txSum / p.count : 0;

      return {
        ts: p.ts,
        label: p.label,
        rxMbps,
        txMbps,
        totalMbps: rxMbps + txMbps
      };
    });
}

function nearestIndexFromMouse(clientX, rect, count) {
  if (!rect || count <= 1) return 0;
  const ratio = (clientX - rect.left) / rect.width;
  const idx = Math.round(ratio * (count - 1));
  return Math.max(0, Math.min(count - 1, idx));
}

function ChartSvg({ rows, range, view, onHover, onLeave }) {
  const width = 1200;
  const height = 330;
  const padL = 54;
  const padR = 24;
  const padT = 20;
  const padB = 40;

  const allValues = view === "all"
    ? rows.flatMap((p) => [num(p.combinedTotal), num(p.switchATotal), num(p.switchBTotal), num(p.uplinkTotal)])
    : rows.flatMap((p) => [num(p.rxMbps), num(p.txMbps), num(p.totalMbps)]);

  const maxVal = Math.max(1, ...allValues);
  const tsValues = rows.map((p) => parseTs(p.ts)).filter((v) => Number.isFinite(v) && v > 0);
  const minTs = tsValues.length ? Math.min(...tsValues) : 0;
  const maxTs = tsValues.length ? Math.max(...tsValues) : 1;

  function x(ts) {
    const span = Math.max(1, maxTs - minTs);
    return padL + ((ts - minTs) / span) * (width - padL - padR);
  }

  function y(v) {
    return padT + (1 - (num(v) / maxVal)) * (height - padT - padB);
  }

  function linePath(points, keyName) {
    return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(parseTs(p.ts)).toFixed(2)} ${y(p[keyName]).toFixed(2)}`).join(" ");
  }

  function hoverAt(e, label, color, getter) {
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const idx = nearestIndexFromMouse(e.clientX, svgRect, rows.length);
    const p = rows[idx];
    if (!p) return;

    const data = getter(p);

    onHover({
      left: e.clientX + 14,
      top: e.clientY + 14,
      label,
      color,
      time: fmtTime(p.ts),
      rx: num(data.rx),
      tx: num(data.tx),
      total: num(data.total)
    });
  }

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((r) => Number((maxVal * r).toFixed(2)));
  const step = Math.max(1, Math.ceil(rows.length / 8));
  const xTicks = rows.filter((_, idx) => idx % step === 0);

  return (
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

      {xTicks.map((p, idx) => (
        <g key={idx}>
          <line x1={x(parseTs(p.ts))} x2={x(parseTs(p.ts))} y1={padT} y2={height - padB} stroke="rgba(255,255,255,0.04)" />
          <text x={x(parseTs(p.ts))} y={height - 12} textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize="11" fontWeight="700">
            {p.label}
          </text>
        </g>
      ))}

      {view === "all" ? (
        <>
          <path d={linePath(rows, "combinedTotal")} fill="none" stroke="#63ffa3" strokeWidth="4" strokeLinecap="round" />
          <path d={linePath(rows, "switchATotal")} fill="none" stroke="#ffd76a" strokeWidth="3.4" strokeLinecap="round" />
          <path d={linePath(rows, "switchBTotal")} fill="none" stroke="#ff9f7a" strokeWidth="3.4" strokeLinecap="round" />
          <path d={linePath(rows, "uplinkTotal")} fill="none" stroke="#78a9ff" strokeWidth="2.4" strokeDasharray="8 6" strokeLinecap="round" />

          <path
            d={linePath(rows, "combinedTotal")}
            fill="none"
            stroke="transparent"
            strokeWidth="18"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "Combined", "#63ffa3", (p) => ({ rx: p.combinedTotal, tx: 0, total: p.combinedTotal }))}
            onMouseLeave={onLeave}
          />
          <path
            d={linePath(rows, "switchATotal")}
            fill="none"
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "Switch A", "#ffd76a", (p) => ({ rx: p.switchATotal, tx: 0, total: p.switchATotal }))}
            onMouseLeave={onLeave}
          />
          <path
            d={linePath(rows, "switchBTotal")}
            fill="none"
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "Switch B", "#ff9f7a", (p) => ({ rx: p.switchBTotal, tx: 0, total: p.switchBTotal }))}
            onMouseLeave={onLeave}
          />
          <path
            d={linePath(rows, "uplinkTotal")}
            fill="none"
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "Uplink", "#78a9ff", (p) => ({ rx: p.uplinkTotal, tx: 0, total: p.uplinkTotal }))}
            onMouseLeave={onLeave}
          />

          {rows.map((p, i) => (
            <g key={i}>
              <circle
                cx={x(parseTs(p.ts))}
                cy={y(p.combinedTotal)}
                r="5"
                fill="#63ffa3"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => hoverAt(e, "Combined", "#63ffa3", () => ({ rx: p.combinedTotal, tx: 0, total: p.combinedTotal }))}
                onMouseLeave={onLeave}
              />
              <circle
                cx={x(parseTs(p.ts))}
                cy={y(p.switchATotal)}
                r="4.5"
                fill="#ffd76a"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => hoverAt(e, "Switch A", "#ffd76a", () => ({ rx: p.switchATotal, tx: 0, total: p.switchATotal }))}
                onMouseLeave={onLeave}
              />
              <circle
                cx={x(parseTs(p.ts))}
                cy={y(p.switchBTotal)}
                r="4.5"
                fill="#ff9f7a"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => hoverAt(e, "Switch B", "#ff9f7a", () => ({ rx: p.switchBTotal, tx: 0, total: p.switchBTotal }))}
                onMouseLeave={onLeave}
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <path d={linePath(rows, "totalMbps")} fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
          <path d={linePath(rows, "rxMbps")} fill="none" stroke="#78a9ff" strokeWidth="3.2" strokeLinecap="round" />
          <path d={linePath(rows, "txMbps")} fill="none" stroke="#63ffa3" strokeOpacity="0.85" strokeWidth="2.4" strokeDasharray="8 6" strokeLinecap="round" />

          <path
            d={linePath(rows, "totalMbps")}
            fill="none"
            stroke="transparent"
            strokeWidth="18"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "Total", "#a78bfa", (p) => ({ rx: p.rxMbps, tx: p.txMbps, total: p.totalMbps }))}
            onMouseLeave={onLeave}
          />
          <path
            d={linePath(rows, "rxMbps")}
            fill="none"
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "RX", "#78a9ff", (p) => ({ rx: p.rxMbps, tx: p.txMbps, total: p.totalMbps }))}
            onMouseLeave={onLeave}
          />
          <path
            d={linePath(rows, "txMbps")}
            fill="none"
            stroke="transparent"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseMove={(e) => hoverAt(e, "TX", "#63ffa3", (p) => ({ rx: p.rxMbps, tx: p.txMbps, total: p.totalMbps }))}
            onMouseLeave={onLeave}
          />

          {rows.map((p, i) => (
            <g key={i}>
              <circle
                cx={x(parseTs(p.ts))}
                cy={y(p.totalMbps)}
                r="5"
                fill="#a78bfa"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => hoverAt(e, "Total", "#a78bfa", () => ({ rx: p.rxMbps, tx: p.txMbps, total: p.totalMbps }))}
                onMouseLeave={onLeave}
              />
              <circle
                cx={x(parseTs(p.ts))}
                cy={y(p.rxMbps)}
                r="4.3"
                fill="#78a9ff"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => hoverAt(e, "RX", "#78a9ff", () => ({ rx: p.rxMbps, tx: p.txMbps, total: p.totalMbps }))}
                onMouseLeave={onLeave}
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

export default function AviatHistoryPage() {
  const [range, setRange] = useState("5m");
  const [view, setView] = useState("all");
  const [items, setItems] = useState([]);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState(0);

  async function loadData(currentRange, silent = false) {
    if (!silent) setLoading(true);
    setErr("");

    try {
      const r = await fetch(`/api/aviat/history?range=${encodeURIComponent(currentRange)}`, { cache: "no-store" });
      const j = await r.json();

      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || "Aviat history failed");
      }

      const arr = Array.isArray(j?.data) ? j.data : [];
      setItems(arr.map((r) => ({ ...r, ts: parseTs(r?.ts) })).filter((r) => r.ts > 0));
    } catch (e) {
      setItems([]);
      setErr(String(e?.message || e || "Unknown Aviat history error"));
    } finally {
      if (!silent) setLoading(false);
      setLastRefreshAt(Date.now());
    }
  }

  useEffect(() => {
    loadData(range, false);
  }, [range]);

  useEffect(() => {
    const ms = pollingMsForRange(range);
    if (!ms) return undefined;

    const id = setInterval(() => {
      loadData(range, true);
    }, ms);

    return () => clearInterval(id);
  }, [range]);

  const chartRows = useMemo(() => {
    const built = view === "all"
      ? buildAllSeries(items, range)
      : buildSingleSeries(items, range, view);

    return capPoints(built, maxPointsForRange(range));
  }, [items, range, view]);

  const stats = useMemo(() => {
    const latest = items.length ? items[items.length - 1] : null;

    const current =
      view === "uplink" ? num(latest?.uplink?.totalMbps) :
      view === "switchB" ? num(latest?.switchB?.totalMbps) :
      view === "switchA" ? num(latest?.switchA?.totalMbps) :
      num(latest?.uplink?.totalMbps) + num(latest?.switchB?.totalMbps) + num(latest?.switchA?.totalMbps);

    const totals = view === "all"
      ? chartRows.map((r) => num(r.combinedTotal))
      : chartRows.map((r) => num(r.totalMbps));

    const peak = totals.length ? Math.max(...totals) : 0;
    const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;

    return {
      status: err && chartRows.length === 0 ? "ERROR" : loading ? "LOADING" : "OK",
      rows: chartRows.length,
      current,
      peak,
      avg,
      ts: latest?.ts || 0,
      uplink: num(latest?.uplink?.totalMbps),
      switchB: num(latest?.switchB?.totalMbps),
      switchA: num(latest?.switchA?.totalMbps)
    };
  }, [items, chartRows, view, err, loading]);

  const lastRefreshText = useMemo(() => {
    if (!lastRefreshAt) return "-";
    return new Date(lastRefreshAt).toLocaleTimeString();
  }, [lastRefreshAt]);

  return (
    <div style={pageStyle()}>
      <div style={{ ...panelStyle(), padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em" }}>Aviat History</div>
            <div style={{ opacity: 0.74, marginTop: 6 }}>
              Same chart DNA and same visual language as History page, but focused only on Aviat WTM4200.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {RANGES.map((x) => (
              <button
                key={x}
                onClick={() => setRange(x)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: x === range ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                  background: x === range ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Chart Mode</div>
            <div style={{ opacity: 0.68, marginTop: 4 }}>
              Same chart behavior as History page with unified view and focused source timelines.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {VIEWS.map((x) => (
              <button
                key={x.key}
                onClick={() => setView(x.key)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: x.key === view ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                  background: x.key === view ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
        <SummaryCard label="Status" value={stats.status} sub={err ? err : "Aviat history online"} color={stats.status === "OK" ? "#63ffa3" : stats.status === "LOADING" ? "#ffd76a" : "#ff7f96"} />
        <SummaryCard label="Rows" value={String(stats.rows)} sub="Rendered chart rows" color="#8fe9ff" />
        <SummaryCard label="Current" value={fmtMbps(stats.current)} sub={view === "all" ? "Unified current" : view} color={summaryColor(view)} />
        <SummaryCard label="Peak" value={fmtMbps(stats.peak)} sub="Current range peak" color="#78a9ff" />
        <SummaryCard label="Average" value={fmtMbps(stats.avg)} sub="Current range average" color="#ffd76a" />
        <SummaryCard label="Last Update" value={lastRefreshText} sub={stats.ts ? fmtTime(stats.ts) : "-"} color="#63ffa3" />
      </div>

      <div style={{ ...panelStyle(), padding: 18, marginTop: 16, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Unified Traffic Timeline</div>
            <div style={{ opacity: 0.72, marginTop: 4 }}>
              {view === "all"
                ? "Top Aviat lines in the same calm chart style as History page"
                : "Selected Aviat source with RX and TX lines in the same History page DNA"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {view === "all" ? (
              <>
                <LegendChip color="#63ffa3" label="Combined" />
                <LegendChip color="#ffd76a" label="Switch A" />
                <LegendChip color="#ff9f7a" label="Switch B" />
                <LegendChip color="#78a9ff" label="UPLINK" dashed={true} />
              </>
            ) : (
              <>
                <LegendChip color="#a78bfa" label="Total" />
                <LegendChip color="#78a9ff" label="RX" />
                <LegendChip color="#63ffa3" label="TX" dashed={true} />
              </>
            )}
          </div>
        </div>

        {chartRows.length === 0 ? (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 18,
              padding: 24
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>No rows for this filter</div>
            <div style={{ opacity: 0.72, marginTop: 10 }}>Try another range.</div>
          </div>
        ) : (
          <>
            <ChartSvg
              rows={chartRows}
              range={range}
              view={view}
              onHover={(data) => setHover(data)}
              onLeave={() => setHover(null)}
            />

            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", opacity: 0.72, fontSize: 12 }}>
              <div><strong>Solid</strong> = RX / Main line</div>
              <div><strong>Dashed</strong> = TX / Uplink assist line</div>
            </div>
          </>
        )}

        {hover ? (
          <div
            style={{
              position: "fixed",
              left: hover.left,
              top: hover.top,
              minWidth: 220,
              pointerEvents: "none",
              borderRadius: 14,
              padding: 12,
              background: "rgba(10,14,22,0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              zIndex: 99999,
              color: "#fff"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 15, color: hover.color }}>{hover.label}</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{hover.time}</div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "auto auto", gap: 8 }}>
              <div>RX</div><div><strong>{fmtMbps(hover.rx)}</strong></div>
              <div>TX</div><div><strong>{fmtMbps(hover.tx)}</strong></div>
              <div>Total</div><div><strong>{fmtMbps(hover.total)}</strong></div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 16, marginTop: 16 }}>
        <div style={{ ...panelStyle(), padding: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Top Talkers</div>
          <div style={{ opacity: 0.68, marginTop: 4 }}>
            Aviat focused summary in the same card language as History page.
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[
              { label: "Uplink", source: "aviat", avg: stats.uplink, peak: stats.uplink, total: stats.uplink },
              { label: "Switch B", source: "aviat", avg: stats.switchB, peak: stats.switchB, total: stats.switchB },
              { label: "Switch A", source: "aviat", avg: stats.switchA, peak: stats.switchA, total: stats.switchA }
            ].map((r, idx) => (
              <div
                key={r.label}
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
                  <div style={{ fontWeight: 900 }}>{r.label}</div>
                  <div style={{ opacity: 0.65, marginTop: 4, fontSize: 12 }}>{r.source} • timeline</div>
                </div>
                <div style={{ color: "#63ffa3", fontWeight: 900 }}>Avg {fmtMbps(r.avg)}</div>
                <div style={{ color: "#78a9ff", fontWeight: 900 }}>Peak {fmtMbps(r.peak)}</div>
                <div style={{ color: "#ffd76a", fontWeight: 900 }}>Total {fmtMbps(r.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panelStyle(), padding: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Source Breakdown</div>
          <div style={{ opacity: 0.68, marginTop: 4 }}>
            Current Aviat distribution by line.
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[
              { source: "uplink", rows: chartRows.length, total: stats.uplink, color: "#78a9ff" },
              { source: "switchB", rows: chartRows.length, total: stats.switchB, color: "#ff9f7a" },
              { source: "switchA", rows: chartRows.length, total: stats.switchA, color: "#ffd76a" }
            ].map((r) => (
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
                  <div style={{ fontWeight: 900, color: r.color }}>{r.source}</div>
                  <div style={{ opacity: 0.72 }}>{r.rows} rows</div>
                </div>
                <div style={{ marginTop: 8, fontWeight: 900 }}>{fmtMbps(r.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.7, marginBottom: 8 }}>
          Latest sample
        </div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          {stats.ts ? `${fmtTime(stats.ts)} • uplink ${fmtMbps(stats.uplink)} • switchB ${fmtMbps(stats.switchB)} • switchA ${fmtMbps(stats.switchA)}` : "No sample"}
        </div>
      </div>
    </div>
  );
}






