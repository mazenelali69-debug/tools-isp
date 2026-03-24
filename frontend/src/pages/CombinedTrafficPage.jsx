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


function TrafficBar({ value, max = 1500, color = "#00f5d4" }){
  const pct = Math.max(0, Math.min(100, (Number(value || 0) / max) * 100));
  return (
    <div
      style={{
        marginTop: 6,
        height: 6,
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.06)"
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: "width .35s ease"
        }}
      />
    </div>
  );
}

function Metric({ label, value, accent }){
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        marginBottom: 10
      }}
    >
      <div style={{ opacity: 0.82, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || "white" }}>
        {fmtMbps(value)}<TrafficBar value={value} color={accent} />
      </div>
    </div>
  );
}

function HeroCard({ rx, tx, total, error }){
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: 22,
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 18px 40px rgba(0,0,0,.22)",
        marginBottom: 18,
        maxWidth: '100%'
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(0,255,220,.10), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.10), transparent 35%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Combined Traffic
        </div>

        <div style={{ opacity: 0.68, marginBottom: 18, fontSize: 14 }}>
          10.88.88.254 + 88.88.88.254
        </div>

        <Metric label="RX" value={rx} accent="#00f5d4" />
        <Metric label="TX" value={tx} accent="#7aa2ff" />
        <Metric label="Total" value={total} accent="#ffb84d" />

        {error ? (
          <div
            style={{
              marginTop: 12,
              color: "#ff7272",
              background: "rgba(255,90,90,.08)",
              border: "1px solid rgba(255,90,90,.18)",
              borderRadius: 12,
              padding: 12,
              whiteSpace: "pre-wrap"
            }}
          >
            Error: {String(error)}
          </div>
        ) : null}
      </div>
    </div>
  );
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
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          Combined Traffic
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          Live + history overview for the combined traffic source
        </div>
      </div>

      <HeroCard
        rx={rxSafe}
        tx={txSafe}
        total={totalSafe}
        error={err}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {RANGES.map(rg => (
          <button
            key={rg}
            onClick={() => setRange(rg)}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.14)",
              background: rg === range ? "rgba(80,140,255,.22)" : "rgba(255,255,255,.04)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: rg === range ? "0 0 0 1px rgba(130,170,255,.18) inset" : "none"
            }}
          >
            {rg}
          </button>
        ))}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: '100%',
          height: 420,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
          boxShadow: "0 18px 40px rgba(0,0,0,.22)",
          padding: 12,
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
          <div style={{ marginBottom: 8, fontWeight: 800, fontSize: 18 }}>
            History — {range}
          </div>

          {histErr ? (
            <div style={{ color: "#ff6b6b", marginBottom: 10 }}>Error: {histErr}</div>
          ) : null}

          <ResponsiveContainer width="100%" height={220}>
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
    </div>
  );
}








