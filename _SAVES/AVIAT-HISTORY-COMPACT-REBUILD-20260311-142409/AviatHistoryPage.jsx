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

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtLabel(ts, range) {
  const d = new Date(Number(ts));
  if (range === "1d" || range === "30d") return d.toLocaleString();
  return d.toLocaleTimeString();
}

function StatCard({ title, value, accent }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 20,
      background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 40px rgba(0,0,0,.22)"
    }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent || "#fff" }}>{value}</div>
    </div>
  );
}

function RangeBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.14)",
        background: active ? "rgba(80,140,255,.22)" : "rgba(255,255,255,.04)",
        color: "white",
        cursor: "pointer",
        fontWeight: 800,
        boxShadow: active ? "0 0 0 1px rgba(130,170,255,.18) inset" : "none"
      }}
    >
      {children}
    </button>
  );
}

function calcStats(list, key) {
  const vals = list.map(x => num(x[key]));
  const current = vals.length ? vals[vals.length - 1] : 0;
  const peak = vals.length ? Math.max(...vals) : 0;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  return { current, peak, avg };
}

function AviatChartCard({ title, subtitle, rows, strokeRx, strokeTx, strokeTotal }) {
  const statsRx = calcStats(rows, "rxMbps");
  const statsTx = calcStats(rows, "txMbps");
  const statsTotal = calcStats(rows, "totalMbps");

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,.10)",
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        boxShadow: "0 18px 40px rgba(0,0,0,.22)",
        padding: 14,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(0,255,220,.08), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.08), transparent 35%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
          <div style={{ opacity: 0.72, fontSize: 13 }}>{subtitle}</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
          gap: 10,
          marginBottom: 12
        }}>
          <StatCard title="RX Current / Peak / Avg" value={`${fmtMbps(statsRx.current)} / ${fmtMbps(statsRx.peak)} / ${fmtMbps(statsRx.avg)}`} accent={strokeRx} />
          <StatCard title="TX Current / Peak / Avg" value={`${fmtMbps(statsTx.current)} / ${fmtMbps(statsTx.peak)} / ${fmtMbps(statsTx.avg)}`} accent={strokeTx} />
          <StatCard title="TOTAL Current / Peak / Avg" value={`${fmtMbps(statsTotal.current)} / ${fmtMbps(statsTotal.peak)} / ${fmtMbps(statsTotal.avg)}`} accent={strokeTotal} />
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} stroke="rgba(255,255,255,.55)" />
              <YAxis stroke="rgba(255,255,255,.55)" />
              <Tooltip
                formatter={(value, name) => [fmtMbps(value), name]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  background: "rgba(10,12,18,.94)",
                  border: "1px solid rgba(255,255,255,.16)",
                  borderRadius: 12,
                  color: "white"
                }}
              />
              <Line type="monotone" dataKey="rxMbps" stroke={strokeRx} strokeWidth={2.4} dot={false} isAnimationActive={false} name="RX" />
              <Line type="monotone" dataKey="txMbps" stroke={strokeTx} strokeWidth={2.4} dot={false} isAnimationActive={false} name="TX" />
              <Line type="monotone" dataKey="totalMbps" stroke={strokeTotal} strokeWidth={2.8} dot={false} isAnimationActive={false} name="TOTAL" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function AviatHistoryPage() {
  const [range, setRange] = useState("5m");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  async function loadHistory(rg) {
    try {
      setErr("");
      const r = await fetch("/api/aviat/history?range=" + encodeURIComponent(rg), { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "aviat history failed");
      setItems(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      setItems([]);
      setErr(String(e?.message || e || "Unknown history error"));
    }
  }

  useEffect(() => {
    loadHistory(range);
  }, [range]);

  useEffect(() => {
    const t = setInterval(() => loadHistory(range), 10000);
    return () => clearInterval(t);
  }, [range]);

  const rows = useMemo(() => {
    return (items || []).map(p => ({
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
  }, [items, range]);

  const uplinkRows = useMemo(() => rows.map(x => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.uplinkRx,
    txMbps: x.uplinkTx,
    totalMbps: x.uplinkTotal
  })), [rows]);

  const switchBRows = useMemo(() => rows.map(x => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.switchBRx,
    txMbps: x.switchBTx,
    totalMbps: x.switchBTotal
  })), [rows]);

  const switchARows = useMemo(() => rows.map(x => ({
    ts: x.ts,
    label: x.label,
    rxMbps: x.switchARx,
    txMbps: x.switchATx,
    totalMbps: x.switchATotal
  })), [rows]);

  const latest = items.length ? items[items.length - 1] : null;

  return (
    <div style={{ padding: 20, minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          Aviat History
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          10-second sampling • UPLINK + Switch B + Switch A • RX / TX / TOTAL
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {RANGES.map(rg => (
          <RangeBtn key={rg} active={rg === range} onClick={() => setRange(rg)}>
            {rg}
          </RangeBtn>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard title="Samples" value={String(items.length)} accent="#8fe9ff" />
        <StatCard title="Latest UPLINK" value={fmtMbps(latest?.uplink?.totalMbps || 0)} accent="#67e8f9" />
        <StatCard title="Latest Switch B" value={fmtMbps(latest?.switchB?.totalMbps || 0)} accent="#7dff7a" />
        <StatCard title="Latest Switch A" value={fmtMbps(latest?.switchA?.totalMbps || 0)} accent="#ffb347" />
      </div>

      {err ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            color:"#ff8a80",
            background:"rgba(255,90,90,.08)",
            border:"1px solid rgba(255,90,90,.18)"
          }}
        >
          {err}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 16 }}>
        <AviatChartCard
          title="UPLINK"
          subtitle="Radio1 • Main Internet Source • 3 Gbps"
          rows={uplinkRows}
          strokeRx="#67e8f9"
          strokeTx="#34d399"
          strokeTotal="#a78bfa"
        />

        <AviatChartCard
          title="Switch B"
          subtitle="88.88.88.254 • VLAN1559 • TenGigE1/1 • 1 Gbps"
          rows={switchBRows}
          strokeRx="#7dff7a"
          strokeTx="#b8d84e"
          strokeTotal="#ffe082"
        />

        <AviatChartCard
          title="Switch A"
          subtitle="10.88.88.254 • VLAN2430 • TenGigE1/2 • 1 Gbps"
          rows={switchARows}
          strokeRx="#7aa2ff"
          strokeTx="#ff9f43"
          strokeTotal="#ffb347"
        />
      </div>
    </div>
  );
}



