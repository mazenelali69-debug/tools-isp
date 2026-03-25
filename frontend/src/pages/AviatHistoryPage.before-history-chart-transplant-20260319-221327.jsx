import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const RANGES = ["5m", "30m", "1h", "1d", "30d"];
const VIEWS = [
  { key: "all", label: "UNIFIED", accent: "#6B8CFF" },
  { key: "uplink", label: "UPLINK", accent: "#63F5A3" },
  { key: "switchB", label: "SWITCH B", accent: "#FFA77A" },
  { key: "switchA", label: "SWITCH A", accent: "#F6D35E" }
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
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtLabel(ts, range) {
  const d = new Date(Number(ts));
  if (range === "1d" || range === "30d") {
    return d.toLocaleDateString([], { month: "numeric", day: "numeric" }) + " " +
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
  if (range === "5m") return 120;
  if (range === "30m") return 140;
  if (range === "1h") return 160;
  if (range === "1d") return 180;
  return 220;
}

function shell(extra) {
  return {
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(180deg, rgba(7,12,22,.96), rgba(6,10,18,.96))",
    boxShadow: "0 16px 36px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.03)",
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
        boxShadow: active ? `0 0 0 1px ${accent}22, 0 0 24px ${accent}12 inset` : "none"
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
          background: `${accent}18`,
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

function ChartTooltip({ active, payload, label, mode }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};

  return (
    <div
      style={{
        minWidth: 180,
        borderRadius: 14,
        background: "rgba(9,14,24,.98)",
        border: "1px solid rgba(255,255,255,.14)",
        boxShadow: "0 18px 32px rgba(0,0,0,.35)",
        padding: 12,
        color: "#fff"
      }}
    >
      <div style={{ fontSize: 10, opacity: .66, marginBottom: 8 }}>{label}</div>

      {mode === "all" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#63F5A3", fontWeight: 900 }}>COMBINED</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.combinedTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#F6D35E", fontWeight: 900 }}>SWITCH A</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.switchATotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#FFA77A", fontWeight: 900 }}>SWITCH B</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.switchBTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#6B8CFF", fontWeight: 900 }}>UPLINK</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.uplinkTotal)}</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#6B8CFF", fontWeight: 900 }}>RX</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.rxMbps)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#63F5A3", fontWeight: 900 }}>TX</span>
            <span style={{ fontWeight: 900 }}>{fmtMbps(row.txMbps)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#A78BFA", fontWeight: 900 }}>TOTAL</span>
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
    const mapped = (items || []).map((p) => {
      const uplinkTotal = num(p?.uplink?.totalMbps);
      const switchBTotal = num(p?.switchB?.totalMbps);
      const switchATotal = num(p?.switchA?.totalMbps);

      return {
        ts: Number(p.ts),
        label: fmtLabel(p.ts, range),

        uplinkRx: num(p?.uplink?.rxMbps),
        uplinkTx: num(p?.uplink?.txMbps),
        uplinkTotal,

        switchBRx: num(p?.switchB?.rxMbps),
        switchBTx: num(p?.switchB?.txMbps),
        switchBTotal,

        switchARx: num(p?.switchA?.rxMbps),
        switchATx: num(p?.switchA?.txMbps),
        switchATotal,

        combinedTotal: uplinkTotal + switchBTotal + switchATotal
      };
    });

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
    combinedTotal: x.combinedTotal,
    switchATotal: x.switchATotal,
    switchBTotal: x.switchBTotal,
    uplinkTotal: x.uplinkTotal
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
    return calcStats(combinedRows, "combinedTotal");
  }, [view, uplinkRows, switchBRows, switchARows, combinedRows]);

  const latest = items.length ? items[items.length - 1] : null;
  const livePolling = pollingMsForRange(range) > 0;
  const currentViewLabel = VIEWS.find((v) => v.key === view)?.label || view;

  const railTop = [
    { label: "UPLINK NOW", value: fmtShort(latest?.uplink?.totalMbps || 0), accent: "#6B8CFF" },
    { label: "SWITCH B NOW", value: fmtShort(latest?.switchB?.totalMbps || 0), accent: "#FFA77A" },
    { label: "SWITCH A NOW", value: fmtShort(latest?.switchA?.totalMbps || 0), accent: "#F6D35E" }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 14,
        color: "#fff",
        background:
          "radial-gradient(circle at 80% 0%, rgba(60,88,255,.14), transparent 18%)," +
          "linear-gradient(180deg, #03070d 0%, #06101a 45%, #07101a 100%)"
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
            <div style={{ fontSize: 10, letterSpacing: ".18em", color: "#7adfff", fontWeight: 900, marginBottom: 6 }}>
              CHART DNA TRANSPLANT
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
            <MetricBox label="CURRENT" value={fmtMbps(currentStats.current)} sub={currentViewLabel} accent="#6B8CFF" />
            <MetricBox label="PEAK" value={fmtMbps(currentStats.peak)} sub="RANGE HIGH" accent="#FFA77A" />
            <MetricBox label="AVERAGE" value={fmtMbps(currentStats.avg)} sub="RANGE MEAN" accent="#63F5A3" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 1000, letterSpacing: "-.03em", lineHeight: .95 }}>
                TRAFFIC CORE
              </div>
              <div style={{ fontSize: 11, opacity: .58, marginTop: 5 }}>
                {view === "all" ? "Unified traffic timeline" : `Focused source inspection — ${currentViewLabel}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {view === "all" ? (
                <>
                  <LegendChip color="#63F5A3" label="COMBINED" />
                  <LegendChip color="#F6D35E" label="SWITCH A" />
                  <LegendChip color="#FFA77A" label="SWITCH B" />
                  <LegendChip color="#6B8CFF" label="UPLINK" />
                </>
              ) : (
                <>
                  <LegendChip color="#6B8CFF" label="RX" />
                  <LegendChip color="#63F5A3" label="TX" dashed={true} />
                  <LegendChip color="#A78BFA" label="TOTAL" />
                </>
              )}
            </div>
          </div>

          <div style={{ width: "100%", height: 560 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeRows} margin={{ top: 10, right: 10, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={true} horizontal={true} strokeDasharray="4 6" />
                <XAxis
                  dataKey="label"
                  minTickGap={32}
                  tick={{ fill: "rgba(255,255,255,.72)", fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={110}
                  tick={{ fill: "rgba(255,255,255,.78)", fontSize: 12, fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <Tooltip content={<ChartTooltip mode={view} />} />

                {view === "all" ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="combinedTotal"
                      stroke="#63F5A3"
                      strokeWidth={4.2}
                      dot={{ r: 5, fill: "#63F5A3", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#63F5A3", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="switchATotal"
                      stroke="#F6D35E"
                      strokeWidth={3.6}
                      dot={{ r: 4.5, fill: "#F6D35E", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#F6D35E", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="switchBTotal"
                      stroke="#FFA77A"
                      strokeWidth={3.6}
                      dot={{ r: 4.5, fill: "#FFA77A", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#FFA77A", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="uplinkTotal"
                      stroke="#6B8CFF"
                      strokeWidth={2.6}
                      strokeDasharray="8 6"
                      dot={false}
                      activeDot={{ r: 5, fill: "#6B8CFF", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="totalMbps"
                      stroke="#A78BFA"
                      strokeWidth={4.0}
                      dot={{ r: 4.5, fill: "#A78BFA", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#A78BFA", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="rxMbps"
                      stroke="#6B8CFF"
                      strokeWidth={3.3}
                      dot={{ r: 4, fill: "#6B8CFF", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#6B8CFF", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="txMbps"
                      stroke="#63F5A3"
                      strokeWidth={2.6}
                      strokeDasharray="8 6"
                      dot={false}
                      activeDot={{ r: 5, fill: "#63F5A3", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
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
              <RailStat label="RAW LOADED" value={String(items.length)} accent="#6B8CFF" />
              <RailStat label="RENDERED" value={String(baseRows.length)} accent="#A78BFA" />
              <RailStat label="POLLING" value={livePolling ? `${pollingMsForRange(range) / 1000}s` : "OFF"} accent="#63F5A3" />
              <RailStat label="CLOCK" value={lastUpdated ? fmtClock(lastUpdated) : "--:--:--"} accent="#FFA77A" />
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








