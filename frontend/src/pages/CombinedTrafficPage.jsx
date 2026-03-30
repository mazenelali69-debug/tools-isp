import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE = "";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return `${n.toFixed(0)} Mbps`;
  if (n >= 100) return `${n.toFixed(2)} Mbps`;
  if (n >= 10) return `${n.toFixed(2)} Mbps`;
  return `${n.toFixed(2)} Mbps`;
}

function fmtCompact(v) {
  const n = num(v);
  if (n >= 1000) return `${(n / 1000).toFixed(2)} Gbps`;
  return `${n.toFixed(2)} Mbps`;
}

function fmtTime(ts, range) {
  const d = new Date(Number(ts));
  if (!Number.isFinite(d.getTime())) return "-";
  if (range === "1d" || range === "30d") {
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getRangeWindowMs(range) {
  switch (range) {
    case "5m": return 5 * 60 * 1000;
    case "30m": return 30 * 60 * 1000;
    case "1h": return 60 * 60 * 1000;
    case "1d": return 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    default: return 5 * 60 * 1000;
  }
}

function toneByLoad(total) {
  if (total >= 1000) {
    return {
      text: "#ff8bd8",
      edge: "rgba(255,139,216,.35)",
      glow: "rgba(255,139,216,.18)",
      fill: "linear-gradient(135deg, rgba(255,139,216,.12), rgba(255,95,152,.05))"
    };
  }
  if (total >= 600) {
    return {
      text: "#ffcf66",
      edge: "rgba(255,207,102,.30)",
      glow: "rgba(255,207,102,.15)",
      fill: "linear-gradient(135deg, rgba(255,207,102,.10), rgba(255,160,64,.05))"
    };
  }
  return {
    text: "#7df7ff",
    edge: "rgba(125,247,255,.26)",
    glow: "rgba(125,247,255,.14)",
    fill: "linear-gradient(135deg, rgba(125,247,255,.11), rgba(98,124,255,.05))"
  };
}

function Panel({ title, sub, right, children, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 26,
        border: "1px solid rgba(120,170,255,.12)",
        background:
          "radial-gradient(circle at top right, rgba(0,255,220,.08), transparent 32%), radial-gradient(circle at left bottom, rgba(80,110,255,.09), transparent 30%), linear-gradient(180deg, rgba(7,11,22,.96), rgba(5,9,18,.96))",
        boxShadow: "0 24px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
        padding: 18,
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(162,194,255,.72)", fontWeight: 800 }}>
            {title}
          </div>
          {sub ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.64)" }}>{sub}</div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function HeroMetric({ label, value, sub, color = "#ffffff", wide = false }) {
  return (
    <div
      style={{
        minHeight: 126,
        padding: 18,
        borderRadius: 22,
        border: `1px solid ${color === "#ffffff" ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.08)"}`,
        background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.03), 0 18px 48px rgba(0,0,0,.18)`,
        gridColumn: wide ? "span 2" : "span 1",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,.56)", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 14, fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,.62)" }}>{sub}</div>
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 999,
        border: active ? "1px solid rgba(125,247,255,.30)" : "1px solid rgba(255,255,255,.10)",
        background: active
          ? "linear-gradient(180deg, rgba(125,247,255,.14), rgba(125,247,255,.05))"
          : "rgba(255,255,255,.04)",
        color: active ? "#dffcff" : "rgba(255,255,255,.84)",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: ".03em",
        boxShadow: active ? "0 0 0 1px rgba(125,247,255,.06), 0 10px 24px rgba(0,0,0,.18)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function SideStat({ label, value, sub, valueColor = "#ffffff" }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(120,170,255,.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(162,194,255,.62)", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: valueColor }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.58)", lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

function RangeSummaryCard({ title, value, accent, sub }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.025))",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900, color: accent }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.56)" }}>{sub}</div>
    </div>
  );
}

export default function CombinedTrafficPage() {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);
  const [rx, setRx] = useState(0);
  const [tx, setTx] = useState(0);
  const [error, setError] = useState("");
  const [range, setRange] = useState("5m");
  const [history, setHistory] = useState([]);
  const [histErr, setHistErr] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  async function loadLive() {
    try {
      setError("");
      const r = await fetch(API_BASE + "/api/combined-traffic/live", { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "combined live failed");
      setRx(num(j?.rxMbps));
      setTx(num(j?.txMbps));
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(String(e?.message || e || "Unknown live error"));
      setRx(0);
      setTx(0);
    }
  }

  async function loadHistory(rg) {
    try {
      setHistErr("");
      const r = await fetch(API_BASE + "/api/combined-traffic/history?range=" + encodeURIComponent(rg), { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "history failed");
      setHistory(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      setHistory([]);
      setHistErr(String(e?.message || e || "Unknown history error"));
    }
  }

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadHistory(range);
  }, [range]);

  const rxSafe = num(rx);
  const txSafe = num(tx);
  const totalSafe = rxSafe + txSafe;
  const tone = toneByLoad(totalSafe);

  const chartData = useMemo(() => {
    const now = Date.now();
    const windowMs = getRangeWindowMs(range);
    const cutoff = now - windowMs;

    return (history || [])
      .map((p) => ({
        ts: Number(p.ts),
        rxMbps: num(p.rxMbps),
        txMbps: num(p.txMbps),
        totalMbps: num(p.totalMbps),
      }))
      .filter((p) => Number.isFinite(p.ts) && p.ts >= cutoff && p.ts <= now)
      .sort((a, b) => a.ts - b.ts)
      .map((p) => ({
        ...p,
        label: fmtTime(p.ts, range),
      }));
  }, [history, range]);

  const stats = useMemo(() => {
    const rows = chartData;
    if (!rows.length) {
      return {
        peak: totalSafe,
        avg: totalSafe,
        min: totalSafe,
        peakRx: rxSafe,
        peakTx: txSafe,
        pressure: 0,
      };
    }

    const totals = rows.map((x) => num(x.totalMbps));
    const rxs = rows.map((x) => num(x.rxMbps));
    const txs = rows.map((x) => num(x.txMbps));

    const peak = Math.max(...totals, totalSafe);
    const avg = totals.reduce((a, b) => a + b, 0) / Math.max(1, totals.length);
    const min = Math.min(...totals);
    const peakRx = Math.max(...rxs, rxSafe);
    const peakTx = Math.max(...txs, txSafe);

    return {
      peak,
      avg,
      min,
      peakRx,
      peakTx,
      pressure: peak > 0 ? Math.min(100, (totalSafe / peak) * 100) : 0,
    };
  }, [chartData, totalSafe, rxSafe, txSafe]);

  const lastLabel = chartData.length ? chartData[chartData.length - 1].label : "-";

  return (
    <div style={{ padding: 16, color: "#fff" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(162,194,255,.68)", fontWeight: 900 }}>
          Combined Traffic Core
        </div>
        <div style={{ fontSize: 56, fontWeight: 1000, lineHeight: 1.02, marginTop: 10, letterSpacing: "-0.04em" }}>
          Traffic Command Center
        </div>
        <div style={{ marginTop: 10, fontSize: 16, color: "rgba(255,255,255,.62)", maxWidth: 900 }}>
          Rebuilt live + history surface for the combined transport source. Same real data source, cleaner hierarchy, stronger graph presence, and better NOC feel.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.75fr) minmax(300px, 0.6fr)",
          gap: 18,
          alignItems: "start",
          marginBottom: 18,
        }}
      >
        <Panel
          title="Combined live surface"
          sub="Primary combined throughput feed with live totals and pressure context."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ padding: "0 12px", height: 34, display: "inline-flex", alignItems: "center", borderRadius: 999, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.04)", fontSize: 12, fontWeight: 800 }}>
                Update: {updatedAt || "-"}
              </div>
              <div style={{ padding: "0 12px", height: 34, display: "inline-flex", alignItems: "center", borderRadius: 999, border: `1px solid ${tone.edge}`, background: tone.fill, color: tone.text, fontSize: 12, fontWeight: 900 }}>
                LIVE
              </div>
            </div>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 14,
            }}
          >
            <HeroMetric label="Combined Total" value={fmtCompact(totalSafe)} sub="Primary operational throughput" color={tone.text} wide />
            <HeroMetric label="Combined RX" value={fmtCompact(rxSafe)} sub="Inbound aggregate" color="#00F0FF" />
            <HeroMetric label="Combined TX" value={fmtCompact(txSafe)} sub="Outbound aggregate" color="#FF2E63" />
          </div>

          <div
            style={{
              marginTop: 16,
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
              padding: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              <RangeSummaryCard title="Peak Combined" value={fmtCompact(stats.peak)} accent="#ffd06b" sub="Highest total across selected history window." />
              <RangeSummaryCard title="Average Combined" value={fmtCompact(stats.avg)} accent="#7df7ff" sub="Average sustained traffic for the current range." />
              <RangeSummaryCard title="Pressure" value={`${stats.pressure.toFixed(0)}%`} accent="#a8ffb7" sub="Current load relative to the observed peak." />
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "rgba(255,255,255,.58)", marginBottom: 8 }}>
                <span>Capacity pressure</span>
                <span>{stats.pressure.toFixed(0)}%</span>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max(4, stats.pressure)}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, rgba(125,247,255,.95), rgba(255,208,107,.92), rgba(255,139,216,.92))",
                    boxShadow: "0 0 20px rgba(125,247,255,.18)",
                  }}
                />
              </div>
            </div>

            {error ? (
              <div style={{ marginTop: 14, color: "#ff8ea1", fontSize: 13, fontWeight: 700 }}>
                Live error: {error}
              </div>
            ) : null}
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 14 }}>
          <SideStat label="Session" value="LIVE" sub={`Last update ${updatedAt || "-"}`} valueColor="#FF2E63" />
          <SideStat label="Peak RX" value={fmtCompact(stats.peakRx)} sub="Highest receive throughput in the selected window." valueColor="#00F0FF" />
          <SideStat label="Peak TX" value={fmtCompact(stats.peakTx)} sub="Highest transmit throughput in the selected window." valueColor="#FF2E63" />
          <SideStat label="History range" value={range.toUpperCase()} sub={`Last point ${lastLabel}`} valueColor="#ffd06b" />
        </div>
      </div>

      <Panel
        title={`History matrix — ${range}`}
        sub="Overlay view for total, RX, and TX trends with stronger readability."
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["5m", "30m", "1h", "1d", "30d"].map((r) => (
              <Pill key={r} active={range === r} onClick={() => setRange(r)}>
                {r}
              </Pill>
            ))}
          </div>
        }
      >
        <div style={{ height: 360, borderRadius: 22, overflow: "hidden", background: "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.01))", border: "1px solid rgba(255,255,255,.08)", padding: 10 }}>
            {ready && (
<ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={220} minWidth={300} minHeight={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ctTotalFillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(176,38,255,0.55)" />
                  <stop offset="100%" stopColor="rgba(176,38,255,0.02)" />
                </linearGradient>
                <linearGradient id="ctRxFillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,240,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(0,240,255,0.02)" />
                </linearGradient>
                <linearGradient id="ctTxFillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,46,99,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,46,99,0.02)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.46)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,.08)" }} tickLine={false} minTickGap={18} />
              <YAxis tick={{ fill: "rgba(255,255,255,.46)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,.08)" }} tickLine={false} width={54} />
              <Tooltip
                contentStyle={{
                  background: "rgba(9,14,26,.96)",
                  border: "1px solid rgba(120,170,255,.16)",
                  borderRadius: 16,
                  color: "#fff",
                  boxShadow: "0 18px 40px rgba(0,0,0,.35)",
                }}
                formatter={(value, name) => [fmtMbps(value), name]}
              />
              <Area type="monotone" dataKey="totalMbps" stroke="#B026FF" strokeWidth={4} fill="url(#ctTotalFillNew)" />
              <Area type="monotone" dataKey="rxMbps" stroke="#00F0FF" strokeWidth={2} fill="url(#ctRxFillNew)" />
              <Area type="monotone" dataKey="txMbps" stroke="#FF2E63" strokeWidth={2} fill="url(#ctTxFillNew)" />
            </AreaChart>
          </ResponsiveContainer>)}
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
          <div style={{ height: 180, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))", padding: 10 }}>
            {ready && (
<ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={220} minWidth={220} minHeight={140}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "rgba(9,14,26,.96)",
                    border: "1px solid rgba(120,170,255,.16)",
                    borderRadius: 16,
                    color: "#fff",
                  }}
                  formatter={(value, name) => [fmtMbps(value), name]}
                />
                <Line type="monotone" dataKey="rxMbps" name="RX" stroke="#00F0FF" strokeWidth={4} dot={false} />
                <Line type="monotone" dataKey="txMbps" name="TX" stroke="#ffd06b" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>)}
          </div>

          <div
            style={{
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
              padding: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 800 }}>Minimum observed</div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>{fmtCompact(stats.min)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 800 }}>Range source</div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,.86)" }}>10.88.88.254 + 88.88.88.254</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 800 }}>History status</div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: histErr ? "#ff8ea1" : "#FF2E63" }}>
                {histErr ? "History error" : "History loaded"}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,.56)", lineHeight: 1.4 }}>
                {histErr ? histErr : `${chartData.length} points ready for visual analysis.`}
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}






