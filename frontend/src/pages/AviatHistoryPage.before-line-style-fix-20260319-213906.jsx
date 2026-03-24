import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

const RANGES = ["5m", "30m", "1h", "1d", "30d"];
const VIEWS = ["all", "uplink", "switchB", "switchA"];

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

function fmtCompact(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(1) + " G";
  return n.toFixed(0) + " M";
}

function fmtTime(ts) {
  const d = new Date(Number(ts));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtLabel(ts, range) {
  const d = new Date(Number(ts));
  if (range === "1d" || range === "30d") {
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function calcStats(list, key) {
  const vals = list.map(x => num(x[key]));
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
  if (range === "1h") return 280;
  if (range === "1d") return 320;
  return 360;
}

function healthColor(v) {
  if (v >= 800) return "#ff7b72";
  if (v >= 500) return "#ffd166";
  return "#58f7c2";
}

function cardStyle(extra) {
  return {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(180deg, rgba(9,14,24,.97), rgba(6,10,17,.96))",
    boxShadow: "0 20px 45px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04)",
    ...extra
  };
}

function RangeBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 13px",
        borderRadius: 12,
        border: active ? "1px solid rgba(110,168,255,.52)" : "1px solid rgba(255,255,255,.10)",
        background: active
          ? "linear-gradient(180deg, rgba(55,105,255,.30), rgba(55,105,255,.17))"
          : "rgba(255,255,255,.03)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 900,
        fontSize: 11,
        letterSpacing: ".04em",
        minWidth: 48,
        boxShadow: active ? "0 0 0 1px rgba(120,170,255,.08), 0 8px 22px rgba(55,105,255,.18)" : "none"
      }}
    >
      {children}
    </button>
  );
}

function ViewBtn({ active, children, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        border: active ? `1px solid ${accent}` : "1px solid rgba(255,255,255,.10)",
        background: active ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.03)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 12,
        minWidth: 88,
        boxShadow: active ? `0 0 0 1px ${accent}22, 0 10px 24px ${accent}18` : "none"
      }}
    >
      {children}
    </button>
  );
}

function KPI({ label, value, sub, accent }) {
  return (
    <div
      style={cardStyle({
        padding: "14px 16px",
        minHeight: 92,
        position: "relative",
        overflow: "hidden"
      })}
    >
      <div
        style={{
          position: "absolute",
          inset: "auto -20px -20px auto",
          width: 80,
          height: 80,
          borderRadius: 999,
          background: `${accent}22`,
          filter: "blur(18px)"
        }}
      />
      <div style={{ fontSize: 10, opacity: 0.58, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 950, color: "#fff", lineHeight: 1.02, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: accent, fontWeight: 800 }}>
        {sub}
      </div>
    </div>
  );
}

function StatusPill({ ok, text }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        padding: "7px 12px",
        background: ok ? "rgba(33,208,122,.10)" : "rgba(255,107,107,.10)",
        border: ok ? "1px solid rgba(33,208,122,.22)" : "1px solid rgba(255,107,107,.22)",
        color: ok ? "#58f7c2" : "#ff8a80",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: ".06em",
        textTransform: "uppercase"
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: ok ? "#58f7c2" : "#ff8a80",
          boxShadow: ok ? "0 0 12px #58f7c2" : "0 0 12px #ff8a80"
        }}
      />
      {text}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div
      style={{
        background: "rgba(6,10,16,.97)",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 14,
        padding: 12,
        color: "#fff",
        minWidth: 170,
        boxShadow: "0 12px 30px rgba(0,0,0,.28)"
      }}
    >
      <div style={{ fontSize: 10, marginBottom: 9, opacity: 0.75 }}>{label}</div>
      {row.uplinkTotal !== undefined ? (
        <>
          <div style={{ color: "#63e6ff", fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Uplink: {fmtMbps(row.uplinkTotal)}</div>
          <div style={{ color: "#8dff8a", fontWeight: 900, fontSize: 11, marginBottom: 5 }}>Switch B: {fmtMbps(row.switchBTotal)}</div>
          <div style={{ color: "#ffbf66", fontWeight: 900, fontSize: 11 }}>Switch A: {fmtMbps(row.switchATotal)}</div>
        </>
      ) : (
        <>
          <div style={{ color: "#63e6ff", fontWeight: 900, fontSize: 11, marginBottom: 5 }}>RX: {fmtMbps(row.rxMbps)}</div>
          <div style={{ color: "#58f7c2", fontWeight: 900, fontSize: 11, marginBottom: 5 }}>TX: {fmtMbps(row.txMbps)}</div>
          <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 11 }}>TOTAL: {fmtMbps(row.totalMbps)}</div>
        </>
      )}
    </div>
  );
}

function MiniPanel({ title, subtitle, rows, accent, areaColor }) {
  const stats = calcStats(rows, "totalMbps");
  const utilization = Math.min(100, (num(stats.current) / 1000) * 100);

  return (
    <div style={cardStyle({ padding: 16 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950, color: "#fff", lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 10, opacity: 0.56, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 900,
            color: accent,
            border: `1px solid ${accent}33`,
            background: `${accent}11`
          }}
        >
          {fmtShort(stats.current)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 9, opacity: 0.56, marginBottom: 4 }}>Current</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{fmtShort(stats.current)}</div>
        </div>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 9, opacity: 0.56, marginBottom: 4 }}>Peak</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{fmtShort(stats.peak)}</div>
        </div>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 9, opacity: 0.56, marginBottom: 4 }}>Average</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{fmtShort(stats.avg)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 10, opacity: 0.56 }}>Utilization</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: healthColor(stats.current) }}>
            {utilization.toFixed(0)}%
          </div>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.05)", overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
          <div
            style={{
              width: utilization + "%",
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accent}, ${areaColor})`,
              boxShadow: `0 0 18px ${accent}55`
            }}
          />
        </div>
      </div>

      <div style={{ width: "100%", height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g_${title.replace(/\s+/g, "_")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalMbps"
              stroke={accent}
              strokeWidth={2.3}
              fill={`url(#g_${title.replace(/\s+/g, "_")})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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

  const latest = items.length ? items[items.length - 1] : null;
  const currentTotal =
    view === "uplink" ? num(latest?.uplink?.totalMbps) :
    view === "switchB" ? num(latest?.switchB?.totalMbps) :
    view === "switchA" ? num(latest?.switchA?.totalMbps) :
    num(latest?.uplink?.totalMbps) + num(latest?.switchB?.totalMbps) + num(latest?.switchA?.totalMbps);

  const allTotals = useMemo(() => {
    return combinedRows.map(r => num(r.uplinkTotal) + num(r.switchBTotal) + num(r.switchATotal));
  }, [combinedRows]);

  const peakTotal = allTotals.length ? Math.max(...allTotals) : 0;
  const avgTotal = allTotals.length ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;

  const livePolling = pollingMsForRange(range) > 0;
  const statusOk = !err;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        color: "#fff",
        background:
          "radial-gradient(circle at top right, rgba(74,114,255,.18), transparent 22%)," +
          "radial-gradient(circle at top left, rgba(0,200,255,.10), transparent 18%)," +
          "linear-gradient(180deg, #05070b 0%, #08101a 44%, #05080d 100%)"
      }}
    >
      <div style={cardStyle({ padding: 20, marginBottom: 14, position: "relative", overflow: "hidden" })}>
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 180,
            height: 180,
            borderRadius: 999,
            background: "rgba(95,125,255,.16)",
            filter: "blur(28px)"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 280 }}>
            <div style={{ fontSize: 11, color: "#7ddfff", fontWeight: 900, letterSpacing: ".18em", marginBottom: 10 }}>
              NOC LUXURY EDITION
            </div>
            <div style={{ fontSize: 34, fontWeight: 1000, lineHeight: .95, letterSpacing: "-.03em", marginBottom: 8 }}>
              AVIAT HISTORY V2
            </div>
            <div style={{ fontSize: 13, opacity: .68, maxWidth: '100%' }}>
              Radio backbone traffic intelligence panel with premium long-range visibility, lighter rendering, and cleaner operational focus.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <StatusPill ok={statusOk} text={statusOk ? (livePolling ? "Live Monitoring" : "Manual Long Range") : "Data Error"} />
              <div style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 800 }}>
                Last Update: {lastUpdated ? fmtTime(lastUpdated) : "--:--:--"}
              </div>
              <div style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 800 }}>
                Refresh: {livePolling ? `${pollingMsForRange(range) / 1000}s` : "Off"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {RANGES.map((rg) => (
                <RangeBtn key={rg} active={rg === range} onClick={() => setRange(rg)}>
                  {rg}
                </RangeBtn>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ViewBtn active={view === "all"} onClick={() => setView("all")} accent="#a78bfa">All</ViewBtn>
              <ViewBtn active={view === "uplink"} onClick={() => setView("uplink")} accent="#63e6ff">Uplink</ViewBtn>
              <ViewBtn active={view === "switchB"} onClick={() => setView("switchB")} accent="#8dff8a">Switch B</ViewBtn>
              <ViewBtn active={view === "switchA"} onClick={() => setView("switchA")} accent="#ffbf66">Switch A</ViewBtn>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 14
        }}
      >
        <KPI label="Samples Loaded" value={String(baseRows.length)} sub={`Raw: ${items.length}`} accent="#63e6ff" />
        <KPI label="Current View Total" value={fmtMbps(currentTotal)} sub={view.toUpperCase()} accent={healthColor(currentTotal)} />
        <KPI label="Range Peak" value={fmtMbps(peakTotal)} sub="Combined Max" accent="#ffbf66" />
        <KPI label="Range Average" value={fmtMbps(avgTotal)} sub="Combined Avg" accent="#58f7c2" />
        <KPI label="Latest Uplink" value={fmtCompact(latest?.uplink?.totalMbps || 0)} sub="Radio1 Backbone" accent="#63e6ff" />
        <KPI label="Latest Switches" value={`${fmtCompact(latest?.switchB?.totalMbps || 0)} / ${fmtCompact(latest?.switchA?.totalMbps || 0)}`} sub="B / A" accent="#a78bfa" />
      </div>

      {err ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 14,
            color: "#ff8a80",
            background: "rgba(255,90,90,.08)",
            border: "1px solid rgba(255,90,90,.18)",
            fontWeight: 700
          }}
        >
          {err}
        </div>
      ) : null}

      <div style={cardStyle({ padding: 18, marginBottom: 14 })}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 950, lineHeight: 1 }}>Traffic Intelligence Core</div>
            <div style={{ fontSize: 11, opacity: 0.58, marginTop: 5 }}>
              {view === "all" ? "Combined visibility across backbone and both switch paths." : `Focused view for ${view}.`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 800 }}>
              Point Cap: {maxPointsForRange(range)}
            </div>
            <div style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 800 }}>
              State: {loading ? "Loading" : "Ready"}
            </div>
          </div>
        </div>

        <div style={{ width: "100%", height: 390 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeRows} margin={{ top: 8, right: 18, left: -8, bottom: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis
                dataKey="label"
                minTickGap={28}
                tick={{ fill: "rgba(255,255,255,.55)", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,.08)" }}
                tickLine={{ stroke: "rgba(255,255,255,.08)" }}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,.50)", fontSize: 10 }}
                width={50}
                axisLine={{ stroke: "rgba(255,255,255,.08)" }}
                tickLine={{ stroke: "rgba(255,255,255,.08)" }}
                tickFormatter={(v) => fmtShort(v)}
              />
              <Tooltip content={<CustomTooltip />} />

              {view === "all" ? (
                <>
                  <Line type="monotone" dataKey="uplinkTotal" stroke="#63e6ff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="switchBTotal" stroke="#8dff8a" strokeWidth={2.3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="switchATotal" stroke="#ffbf66" strokeWidth={2.3} dot={false} isAnimationActive={false} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="rxMbps" stroke="#63e6ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="txMbps" stroke="#58f7c2" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="totalMbps" stroke="#a78bfa" strokeWidth={2.6} dot={false} isAnimationActive={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 14
        }}
      >
        <MiniPanel
          title="UPLINK"
          subtitle="Radio1 • Main Internet Source • 3 Gbps"
          rows={uplinkRows}
          accent="#63e6ff"
          areaColor="#1e90ff"
        />
        <MiniPanel
          title="SWITCH B"
          subtitle="88.88.88.254 • VLAN1559 • TenGigE1/1"
          rows={switchBRows}
          accent="#8dff8a"
          areaColor="#58f7c2"
        />
        <MiniPanel
          title="SWITCH A"
          subtitle="10.88.88.254 • VLAN2430 • TenGigE1/2"
          rows={switchARows}
          accent="#ffbf66"
          areaColor="#ff8a66"
        />
      </div>

      <div style={cardStyle({ padding: 14 })}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, opacity: 0.56, marginBottom: 5 }}>Source</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>/api/aviat/history</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, opacity: 0.56, marginBottom: 5 }}>Range Mode</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>{range}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, opacity: 0.56, marginBottom: 5 }}>Polling</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>{livePolling ? "Adaptive" : "Disabled"}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, opacity: 0.56, marginBottom: 5 }}>Render Mode</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Point-Capped Luxury</div>
          </div>
        </div>
      </div>
    </div>
  );
}






