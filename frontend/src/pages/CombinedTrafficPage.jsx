import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

const API_BASE = "";
const RANGES = ["5m", "30m", "1h", "1d", "30d"];

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v){
  const n = num(v);
  if(n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtTime(ts, range){
  const d = new Date(Number(ts));
  if(range === "1d" || range === "30d"){
    return d.toLocaleString();
  }
  return d.toLocaleTimeString();
}

export default function CombinedTrafficPage(){
  const [rx, setRx] = useState(0);
  const [tx, setTx] = useState(0);
  const [err, setErr] = useState("");
  const [range, setRange] = useState("5m");
  const [history, setHistory] = useState([]);
  const [histErr, setHistErr] = useState("");

  async function loadLive(){
    try{
      setErr("");
      const r = await fetch(API_BASE + "/api/combined-traffic/live", { cache: "no-store" });
      const j = await r.json();
      if(!j?.ok) throw new Error(j?.error || "combined live failed");
      setRx(num(j?.rxMbps));
      setTx(num(j?.txMbps));
    } catch(e){
      setRx(0);
      setTx(0);
      setErr(String(e?.message || e || "Unknown error"));
    }
  }

  async function loadHistory(rg){
    try{
      setHistErr("");
      const r = await fetch(API_BASE + "/api/combined-traffic/history?range=" + encodeURIComponent(rg), { cache: "no-store" });
      const j = await r.json();
      if(!j?.ok) throw new Error(j?.error || "history failed");
      setHistory(Array.isArray(j?.data) ? j.data : []);
    } catch(e){
      setHistory([]);
      setHistErr(String(e?.message || e || "Unknown history error"));
    }
  }

  useEffect(() => {
    loadLive();
    loadHistory(range);

    const t = setInterval(loadLive, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadHistory(range);
  }, [range]);

  const rxSafe = num(rx);
  const txSafe = num(tx);
  const totalSafe = rxSafe + txSafe;

  const chartData = useMemo(() => {
    return (history || []).map(p => ({
      ts: Number(p.ts),
      label: fmtTime(p.ts, range),
      rxMbps: num(p.rxMbps),
      txMbps: num(p.txMbps),
      totalMbps: num(p.totalMbps)
    }));
  }, [history, range]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Combined Traffic</h2>

      <div
        style={{
          background: "#111",
          borderRadius: 10,
          padding: 20,
          width: 460,
          border: "1px solid rgba(255,255,255,.10)",
          marginBottom: 18
        }}
      >
        <div style={{ marginBottom: 10 }}>RX: {fmtMbps(rxSafe)}</div>
        <div style={{ marginBottom: 10 }}>TX: {fmtMbps(txSafe)}</div>
        <div style={{ marginBottom: 10 }}>Total: {fmtMbps(totalSafe)}</div>

        {err ? (
          <div style={{ color: "#ff6b6b", marginTop: 12, whiteSpace: "pre-wrap" }}>
            Error: {err}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {RANGES.map(rg => (
          <button
            key={rg}
            onClick={() => setRange(rg)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.14)",
              background: rg === range ? "rgba(80,140,255,.22)" : "rgba(255,255,255,.04)",
              color: "white",
              cursor: "pointer"
            }}
          >
            {rg}
          </button>
        ))}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          height: 420,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(10,12,18,.78)",
          padding: 12
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 700 }}>
          History — {range}
        </div>

        {histErr ? (
          <div style={{ color: "#ff6b6b" }}>Error: {histErr}</div>
        ) : null}

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ctTotalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,255,200,.35)" />
                <stop offset="100%" stopColor="rgba(0,255,200,0)" />
              </linearGradient>
            </defs>

            <XAxis dataKey="label" minTickGap={24} />
            <YAxis />
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

            <Area
              type="monotone"
              dataKey="totalMbps"
              stroke="rgba(0,255,200,.95)"
              fill="url(#ctTotalFill)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Total"
            />

            <Line
              type="monotone"
              dataKey="rxMbps"
              stroke="rgba(120,160,255,.95)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="RX"
            />

            <Line
              type="monotone"
              dataKey="txMbps"
              stroke="rgba(255,180,90,.95)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="TX"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
