import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

const RANGES = ["5m", "30m", "1h", "1d", "30d"];
const VIEWS = [
  { key: "all", label: "UNIFIED", accent: "#a78bfa" },
  { key: "uplink", label: "UPLINK", accent: "#53e3ff" },
  { key: "switchB", label: "SWITCH B", accent: "#86ff84" },
  { key: "switchA", label: "SWITCH A", accent: "#ffbf66" }
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtShort(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + "G";
  return n.toFixed(0) + "M";
}

function fmtAxis(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(1) + "G";
  return n.toFixed(0) + "M";
}

function fmtLabel(ts, range) {
  const d = new Date(Number(ts));
  if (range === "1d" || range === "30d") {
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtClock(ts) {
  const d = new Date(Number(ts));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function calcStats(list, key) {
  const vals = list.map((x) => num(x[key]));
  const current = vals.length ? vals[vals.length - 1] : 0;
  const peak = vals.length ? Math.max(...vals) : 0;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  return { current, peak, avg };
}

function capPoints(list, maxPoints) {
  if (!Array.isArray(list)) return [];
  if (list.length <= maxPoints) return list;
  const step = Math.ceil(list.length / maxPoints);
  const out = [];
  for (let i = 0; i < list.length; i += step) out.push(list[i]);
  if (out[out.length - 1] !== list[list.length - 1]) out.push(list[list.length - 1]);
  return out;
}

function pollingMsForRange(range) {
  if (range === "5m") return 10000;
  if (range === "30m") return 15000;
  if (range === "1h") return 20000;
  if (range === "1d") return 60000;
  return 0;
}

function maxPointsForRange(range) {
  if (range === "5m") return 240;
  if (range === "30m") return 260;
  if (range === "1h") return 300;
  if (range === "1d") return 340;
  return 380;
}

function shell(extra) {
  return {
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(180deg, rgba(3,7,13,.98), rgba(4,9,17,.97))",
    boxShadow: "0 20px 40px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.03)",
    ...extra
  };
}

function Button({ active, onClick, children, accent = "#4f7cff", minWidth = 74 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth,
        height: 36,
        padding: "0 14px",
        borderRadius: 11,
        border: active ? `1px solid ${accent}` : "1px solid rgba(255,255,255,.10)",
        background: active ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.025)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: ".08em",
        cursor: "pointer",
        boxShadow: active ? `0 0 0 1px ${accent}22, 0 0 28px ${accent}14 inset` : "none"
      }}
    >
      {children}
    </button>
  );
}

function MetricBox({ label, value, accent, sub }) {
  return (
    <div
      style={{
        ...shell({
          borderRadius: 16,
          padding: 14,
          position: "relative",
          overflow: "hidden"
        })
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -16,
          top: -16,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: `${accent}20`,
          filter: "blur(16px)"
        }}
      />
      <div style={{ fontSize: 10, opacity: 0.54, marginBottom: 8, letterSpacing: ".14em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, lineHeight: .95, marginBottom: 7 }}>{value}</div>
      <div style={{ fontSize: 11, color: accent, fontWeight: 900 }}>{sub}</div>
    </div>
  );
}

function RailStat({ label, value, accent }) {
  return (
    <div
      style={{
        ...shell({
          borderRadius: 14,
          padding: "12px 14px"
        })
      }}
    >
      <div style={{ fontSize: 10, opacity: .5, marginBottom: 6, letterSpacing: ".10em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 950, color: "#fff" }}>{value}</div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
        <div style={{ width: "100%", height: "100%", background: accent, boxShadow: `0 0 18px ${accent}` }} />
      </div>
    </div>
  );
}

function SmallTag({ text, ok }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 30,
        padding: "0 12px",
        borderRadius: 999,
        border: ok ? "1px solid rgba(40,220,120,.20)" : "1px solid rgba(255,90,90,.20)",
        background: ok ? "rgba(40,220,120,.08)" : "rgba(255,90,90,.08)",
        fontSize: 11,
        fontWeight: 900,
        color: ok ? "#67ffb1" : "#ff8a80",
        letterSpacing: ".08em"
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: ok ? "#67ffb1" : "#ff8a80",
          boxShadow: ok ? "0 0 10px #67ffb1" : "0 0 10px #ff8a80"
        }}
      />
      {text}
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
        height: 34,
        padding: "0 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
        fontSize: 11,
        fontWeight: 900,
        color: "#fff"
      }}
    >
      <span
        style={{
          width: 18,
          height: 0,
          borderTop: `3px ${dashed ? "dashed" : "solid"} ${color}`,
          boxShadow: `0 0 10px ${color}`
        }}
      />
      {label}
    </div>
  );
}

function BrutalTooltip({ active, payload, label, mode }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};

  return (
    <div
      style={{
        minWidth: 180,
        borderRadius: 14,
        background: "rgba(2,5,10,.98)",
        border: "1px solid rgba(255,255,255,.14)",
        boxShadow: "0 20px 36px rgba(0,0,0,.45)",
        padding: 12,
        color: "#fff"
      }}
    >
      <div style={{ fontSize: 10, opacity: .66, marginBottom: 8 }}>{label}</div>

      {mode === "all" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#53e3ff", fontWeight: 900 }}>UPLINK</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.uplinkTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#86ff84", fontWeight: 900 }}>SWITCH B</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.switchBTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#ffbf66", fontWeight: 900 }}>SWITCH A</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.switchATotal)}</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#53e3ff", fontWeight: 900 }}>RX</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.rxMbps)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#57ffc9", fontWeight: 900 }}>TX</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.txMbps)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#a78bfa", fontWeight: 900 }}>TOTAL</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.totalMbps)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AviatHistoryPage() {
  const [range, setRange] = useState("5m");
  const [view, setView] = useState("all");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadHistory(rg, silent = false) {
    try {
      if (!silent) setLoading(true);
      setErr("");
      const r = await fetch("/api/aviat/history?range=" + encodeURIComponent(rg), { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "aviat history failed");
      setItems(Array.isArray(j?.data) ? j.data : []);
      setLastUpdated(Date.now());
    } catch (e) {
      setItems([]);
      setErr(String(e?.message || e || "Unknown history error"));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(range, false);
  }, [range]);

  useEffect(() => {
    const ms = pollingMsForRange(range);
    if (!ms) return;
    const t = setInterval(() => loadHistory(range, true), ms);
    return () => clearInterval(t);
  }, [range]);

  const baseRows = useMemo(() => {
    const mapped = (items || []).map((p) => ({
      ts: Number(p.ts),
      label: fmtLabel(p.ts, range),

      uplinkRx: num(p?.uplink?.rxMbps),
      uplinkTx: num(p?.uplink?.txMbps),
      uplinkTotal: num(p?.uplink?.totalMbps),

      switchBRx: num(p?.switchB?.rxMbps),
      switchBTx: num(p?.switchB?.txMbps),
      switchBTotal: num(p?.switchB?.totalMbps),

      switchARx: num(p?.switchA?.rxMbps),
      switchATx: num(p?.switchA?.txMbps),
      switchATotal: num(p?.switchA?.totalMbps)
    }));

    return capPoints(mapped, maxPointsForRange(range));
  }, [items, range]);

  const uplinkRows = useMemo(() => baseRows.map((x) => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.uplinkRx,
    txMbps: x.uplinkTx,
    totalMbps: x.uplinkTotal
  })), [baseRows]);

  const switchBRows = useMemo(() => baseRows.map((x) => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.switchBRx,
    txMbps: x.switchBTx,
    totalMbps: x.switchBTotal
  })), [baseRows]);

  const switchARows = useMemo(() => baseRows.map((x) => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.switchARx,
    txMbps: x.switchATx,
    totalMbps: x.switchATotal
  })), [baseRows]);

  const combinedRows = useMemo(() => baseRows.map((x) => ({
    ts: x.ts,
    label: x.label,
    uplinkTotal: x.uplinkTotal,
    switchBTotal: x.switchBTotal,
    switchATotal: x.switchATotal
  })), [baseRows]);

  const activeRows = useMemo(() => {
    if (view === "uplink") return uplinkRows;
    if (view === "switchB") return switchBRows;
    if (view === "switchA") return switchARows;
    return combinedRows;
  }, [view, uplinkRows, switchBRows, switchARows, combinedRows]);

  const currentStats = useMemo(() => {
    if (view === "uplink") return calcStats(uplinkRows, "totalMbps");
    if (view === "switchB") return calcStats(switchBRows, "totalMbps");
    if (view === "switchA") return calcStats(switchARows, "totalMbps");
    const vals = combinedRows.map(r => num(r.uplinkTotal) + num(r.switchBTotal) + num(r.switchATotal));
    return {
      current: vals.length ? vals[vals.length - 1] : 0,
      peak: vals.length ? Math.max(...vals) : 0,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    };
  }, [view, uplinkRows, switchBRows, switchARows, combinedRows]);

  const latest = items.length ? items[items.length - 1] : null;
  const livePolling = pollingMsForRange(range) > 0;
  const currentViewLabel = VIEWS.find((v) => v.key === view)?.label || view;

  const railTop = [
    { label: "UPLINK NOW", value: fmtShort(latest?.uplink?.totalMbps || 0), accent: "#53e3ff" },
    { label: "SWITCH B NOW", value: fmtShort(latest?.switchB?.totalMbps || 0), accent: "#86ff84" },
    { label: "SWITCH A NOW", value: fmtShort(latest?.switchA?.totalMbps || 0), accent: "#ffbf66" }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 14,
        color: "#fff",
        background:
          "radial-gradient(circle at 80% 0%, rgba(60,88,255,.15), transparent 18%)," +
          "linear-gradient(180deg, #010306 0%, #03070d 40%, #03060b 100%)"
      }}
    >
      <div
        style={{
          ...shell({
            borderRadius: 18,
            padding: 14,
            marginBottom: 12
          })
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".18em", color: "#6ddcff", fontWeight: 900, marginBottom: 6 }}>
              BRUTAL DATA EDITION
            </div>
            <div style={{ fontSize: 30, fontWeight: 1000, letterSpacing: "-.04em", lineHeight: .95 }}>
              AVIAT HISTORY
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {RANGES.map((rg) => (
              <Button key={rg} active={range === rg} onClick={() => setRange(rg)} accent="#4d7bff" minWidth={58}>
                {rg}
              </Button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {VIEWS.map((v) => (
              <Button key={v.key} active={view === v.key} onClick={() => setView(v.key)} accent={v.accent} minWidth={92}>
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <SmallTag ok={!err} text={!err ? (livePolling ? "LIVE ACTIVE" : "LONG RANGE STATIC") : "DATA ERROR"} />
          <div style={{ height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 900 }}>
            LAST UPDATE: {lastUpdated ? fmtClock(lastUpdated) : "--:--:--"}
          </div>
          <div style={{ height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 900 }}>
            POINT CAP: {maxPointsForRange(range)}
          </div>
          <div style={{ height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 900 }}>
            STATE: {loading ? "LOADING" : "READY"}
          </div>
        </div>
      </div>

      {err ? (
        <div
          style={{
            ...shell({
              borderRadius: 16,
              padding: 12,
              marginBottom: 12,
              color: "#ff8a80",
              border: "1px solid rgba(255,90,90,.24)",
              background: "rgba(60,5,8,.70)"
            })
          }}
        >
          {err}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 12,
          alignItems: "stretch"
        }}
      >
        <div
          style={{
            ...shell({
              borderRadius: 20,
              padding: 14,
              minHeight: 690
            })
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 12 }}>
            <MetricBox label="CURRENT" value={fmtMbps(currentStats.current)} sub={currentViewLabel} accent="#53e3ff" />
            <MetricBox label="PEAK" value={fmtMbps(currentStats.peak)} sub="RANGE HIGH" accent="#ffbf66" />
            <MetricBox label="AVERAGE" value={fmtMbps(currentStats.avg)} sub="RANGE MEAN" accent="#57ffc9" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 1000, letterSpacing: "-.03em", lineHeight: .95 }}>
                TRAFFIC CORE
              </div>
              <div style={{ fontSize: 11, opacity: .58, marginTop: 5 }}>
                {view === "all" ? "Unified source timeline" : `Focused source inspection — ${currentViewLabel}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {view === "all" ? (
                <>
                  <LegendChip color="#53e3ff" label="UPLINK" />
                  <LegendChip color="#86ff84" label="SWITCH B" />
                  <LegendChip color="#ffbf66" label="SWITCH A" />
                </>
              ) : (
                <>
                  <LegendChip color="#53e3ff" label="RX" />
                  <LegendChip color="#57ffc9" label="TX" dashed={true} />
                  <LegendChip color="#a78bfa" label="TOTAL" />
                </>
              )}
            </div>
          </div>

          <div style={{ width: "100%", height: 560 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeRows} margin={{ top: 10, right: 14, left: -10, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="label"
                  minTickGap={24}
                  tick={{ fill: "rgba(255,255,255,.50)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                  tickLine={{ stroke: "rgba(255,255,255,.08)" }}
                />
                <YAxis
                  width={58}
                  tick={{ fill: "rgba(255,255,255,.54)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                  tickLine={{ stroke: "rgba(255,255,255,.08)" }}
                  tickFormatter={fmtAxis}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,.14)" />
                <Tooltip content={<BrutalTooltip mode={view} />} />

                {view === "all" ? (
                  <>
                    <Line type="monotone" dataKey="uplinkTotal" stroke="#53e3ff" strokeWidth={3.3} dot={false} activeDot={{ r: 5, stroke: "#53e3ff", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="switchBTotal" stroke="#86ff84" strokeWidth={3.1} dot={false} activeDot={{ r: 5, stroke: "#86ff84", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="switchATotal" stroke="#ffbf66" strokeWidth={3.1} dot={false} activeDot={{ r: 5, stroke: "#ffbf66", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                  </>
                ) : (
                  <>
                    <Line type="monotone" dataKey="rxMbps" stroke="#53e3ff" strokeWidth={3.2} dot={false} activeDot={{ r: 5, stroke: "#53e3ff", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="txMbps" stroke="#57ffc9" strokeWidth={2.4} strokeDasharray="8 6" dot={false} activeDot={{ r: 4, stroke: "#57ffc9", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="totalMbps" stroke="#a78bfa" strokeWidth={3.5} dot={false} activeDot={{ r: 5, stroke: "#a78bfa", strokeWidth: 2, fill: "#06101a" }} isAnimationActive={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              ...shell({
                borderRadius: 20,
                padding: 14
              })
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: ".18em", color: "#7ee5ff", fontWeight: 900, marginBottom: 12 }}>
              LIVE RAIL
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {railTop.map((r) => (
                <RailStat key={r.label} label={r.label} value={r.value} accent={r.accent} />
              ))}
            </div>
          </div>

          <div
            style={{
              ...shell({
                borderRadius: 20,
                padding: 14
              })
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: ".18em", color: "#7ee5ff", fontWeight: 900, marginBottom: 12 }}>
              SESSION
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <RailStat label="RAW LOADED" value={String(items.length)} accent="#53e3ff" />
              <RailStat label="RENDERED" value={String(baseRows.length)} accent="#a78bfa" />
              <RailStat label="POLLING" value={livePolling ? `${pollingMsForRange(range) / 1000}s` : "OFF"} accent="#57ffc9" />
              <RailStat label="CLOCK" value={lastUpdated ? fmtClock(lastUpdated) : "--:--:--"} accent="#ffbf66" />
            </div>
          </div>

          <div
            style={{
              ...shell({
                borderRadius: 20,
                padding: 14
              })
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: ".18em", color: "#7ee5ff", fontWeight: 900, marginBottom: 12 }}>
              SOURCE
            </div>
            <div style={{ fontSize: 11, opacity: .62, marginBottom: 10 }}>API</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>/api/aviat/history</div>

            <div style={{ fontSize: 11, opacity: .62, marginBottom: 10 }}>MODE</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>{currentViewLabel}</div>

            <div style={{ fontSize: 11, opacity: .62, marginBottom: 10 }}>RANGE</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{range}</div>
          </div>
        </div>
      </div>
    </div>
  );
}




