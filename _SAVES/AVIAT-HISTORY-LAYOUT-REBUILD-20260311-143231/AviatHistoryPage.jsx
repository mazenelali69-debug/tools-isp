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

function fmtShort(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + "G";
  return n.toFixed(0) + "M";
}

function fmtLabel(ts, range) {
  const d = new Date(Number(ts));
  if (range === "1d" || range === "30d") {
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function RangeBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 12,
        border: active ? "1px solid rgba(130,170,255,.42)" : "1px solid rgba(255,255,255,.10)",
        background: active ? "rgba(80,140,255,.18)" : "rgba(255,255,255,.03)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 13,
        minWidth: 52
      }}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        padding: "9px 12px",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        minWidth: 0
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.68, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: color || "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};
  return (
    <div
      style={{
        background: "rgba(8,12,18,.96)",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 12,
        padding: 10,
        color: "#fff",
        minWidth: 130
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.8 }}>{label}</div>
      <div style={{ color: "#67e8f9", fontWeight: 800, fontSize: 12, marginBottom: 4 }}>RX: {fmtMbps(row.rxMbps)}</div>
      <div style={{ color: "#34d399", fontWeight: 800, fontSize: 12, marginBottom: 4 }}>TX: {fmtMbps(row.txMbps)}</div>
      <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12 }}>TOTAL: {fmtMbps(row.totalMbps)}</div>
    </div>
  );
}

function CompactPanel({ title, subtitle, rows, rxColor, txColor, totalColor }) {
  const rx = calcStats(rows, "rxMbps");
  const tx = calcStats(rows, "txMbps");
  const total = calcStats(rows, "totalMbps");

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.08)",
        background: "linear-gradient(180deg, rgba(10,15,24,.95), rgba(7,11,18,.95))",
        boxShadow: "0 16px 36px rgba(0,0,0,.22)",
        padding: 12,
        minWidth: 0
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 10, opacity: 0.68, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
          marginBottom: 10
        }}
      >
        <MiniStat
          label="RX Cur / Peak / Avg"
          value={`${fmtShort(rx.current)} / ${fmtShort(rx.peak)} / ${fmtShort(rx.avg)}`}
          color={rxColor}
        />
        <MiniStat
          label="TX Cur / Peak / Avg"
          value={`${fmtShort(tx.current)} / ${fmtShort(tx.peak)} / ${fmtShort(tx.avg)}`}
          color={txColor}
        />
        <MiniStat
          label="TOTAL Cur / Peak / Avg"
          value={`${fmtShort(total.current)} / ${fmtShort(total.peak)} / ${fmtShort(total.avg)}`}
          color={totalColor}
        />
      </div>

      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
              width={34}
              axisLine={{ stroke: "rgba(255,255,255,.08)" }}
              tickLine={{ stroke: "rgba(255,255,255,.08)" }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="rxMbps" stroke={rxColor} strokeWidth={2} dot={false} isAnimationActive={false} name="RX" />
            <Line type="monotone" dataKey="txMbps" stroke={txColor} strokeWidth={2} dot={false} isAnimationActive={false} name="TX" />
            <Line type="monotone" dataKey="totalMbps" stroke={totalColor} strokeWidth={2.3} dot={false} isAnimationActive={false} name="TOTAL" />
          </LineChart>
        </ResponsiveContainer>
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
    label: x.label,
    rxMbps: x.uplinkRx,
    txMbps: x.uplinkTx,
    totalMbps: x.uplinkTotal
  })), [rows]);

  const switchBRows = useMemo(() => rows.map(x => ({
    label: x.label,
    rxMbps: x.switchBRx,
    txMbps: x.switchBTx,
    totalMbps: x.switchBTotal
  })), [rows]);

  const switchARows = useMemo(() => rows.map(x => ({
    label: x.label,
    rxMbps: x.switchARx,
    txMbps: x.switchATx,
    totalMbps: x.switchATotal
  })), [rows]);

  const latest = items.length ? items[items.length - 1] : null;

  return (
    <div style={{ padding: 14, minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
          Aviat History
        </div>
        <div style={{ opacity: 0.68, fontSize: 12 }}>
          10-second sampling • compact 3-panel view
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {RANGES.map(rg => (
          <RangeBtn key={rg} active={rg === range} onClick={() => setRange(rg)}>
            {rg}
          </RangeBtn>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 1fr 1fr",
          gap: 10,
          marginBottom: 12
        }}
      >
        <MiniStat label="Samples" value={String(items.length)} color="#8fe9ff" />
        <MiniStat label="Latest UPLINK" value={fmtMbps(latest?.uplink?.totalMbps || 0)} color="#67e8f9" />
        <MiniStat label="Latest Switch B" value={fmtMbps(latest?.switchB?.totalMbps || 0)} color="#7dff7a" />
        <MiniStat label="Latest Switch A" value={fmtMbps(latest?.switchA?.totalMbps || 0)} color="#ffb347" />
      </div>

      {err ? (
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            borderRadius: 12,
            color:"#ff8a80",
            background:"rgba(255,90,90,.08)",
            border:"1px solid rgba(255,90,90,.18)"
          }}
        >
          {err}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          alignItems: "start"
        }}
      >
        <CompactPanel
          title="UPLINK"
          subtitle="Radio1 • Main Internet Source • 3 Gbps"
          rows={uplinkRows}
          rxColor="#67e8f9"
          txColor="#34d399"
          totalColor="#a78bfa"
        />

        <CompactPanel
          title="Switch B"
          subtitle="88.88.88.254 • VLAN1559 • TenGigE1/1 • 1 Gbps"
          rows={switchBRows}
          rxColor="#7dff7a"
          txColor="#b8d84e"
          totalColor="#ffe082"
        />

        <CompactPanel
          title="Switch A"
          subtitle="10.88.88.254 • VLAN2430 • TenGigE1/2 • 1 Gbps"
          rows={switchARows}
          rxColor="#7aa2ff"
          txColor="#ff9f43"
          totalColor="#ffb347"
        />
      </div>
    </div>
  );
}

