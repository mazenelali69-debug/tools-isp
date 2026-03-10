import React, { useEffect, useMemo, useState } from "react";

const POLL_MS = 4000;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtBytesMB(v) {
  return Math.round(num(v) / 1024 / 1024) + " MB";
}

function fmtTemp(v) {
  const n = num(v);
  return n > 0 ? `${n.toFixed(0)} °C` : "N/A";
}

function uptimeText(ticks) {
  const sec = Math.max(0, Math.floor(num(ticks) / 100));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}.${String(h).padStart(2, "0")} day`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function gaugeColorByRatio(ratio) {
  if (ratio >= 0.85) return "#ff5d73";
  if (ratio >= 0.65) return "#ffae3d";
  if (ratio >= 0.40) return "#f4de4c";
  return "#78d96b";
}

function MiniGauge({ title, value, max = 100, unit = "", decimals = 1 }) {
  const safeMax = Math.max(1, num(max));
  const n = num(value);
  const ratio = Math.max(0, Math.min(1, n / safeMax));
  const color = gaugeColorByRatio(ratio);
  const angle = -90 + (ratio * 180);
  const r = 54;
  const cx = 70;
  const cy = 70;

  const polar = (a, rr) => {
    const rad = (a - 90) * Math.PI / 180;
    return { x: cx + rr * Math.cos(rad), y: cy + rr * Math.sin(rad) };
  };

  const arcPath = (() => {
    const s = polar(-90, r);
    const e = polar(90, r);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  })();

  const needle = polar(angle, r - 10);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)",
        minHeight: 178
      }}
    >
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.84)", fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="140" height="92" viewBox="0 0 140 92">
          <path d={arcPath} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="14" strokeLinecap="round" />
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${ratio * 100} 100`}
            style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}
          />
          <line
            x1={cx}
            y1={cy}
            x2={needle.x}
            y2={needle.y}
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill={color} />
        </svg>
      </div>

      <div style={{ textAlign: "center", marginTop: -4 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color }}>{n.toFixed(decimals)}{unit}</div>
      </div>
    </div>
  );
}

function HeatStrip({ title, value, unit = "", max = 100, decimals = 0 }) {
  const n = num(value);
  const safeMax = Math.max(1, num(max));
  const segments = 26;
  const active = Math.max(0, Math.min(segments, Math.round((n / safeMax) * segments)));

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)",
        minHeight: 92
      }}
    >
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.84)", fontWeight: 700, marginBottom: 10 }}>
        {title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${segments}, 1fr)`, gap: 3 }}>
        {Array.from({ length: segments }).map((_, i) => {
          const ratio = (i + 1) / segments;
          const color =
            ratio >= 0.85 ? "#ff5d73" :
            ratio >= 0.65 ? "#ffae3d" :
            ratio >= 0.40 ? "#f4de4c" :
            ratio >= 0.22 ? "#70d26a" :
            "#5cb5ff";

          return (
            <div
              key={i}
              style={{
                height: 22,
                borderRadius: 4,
                background: i < active ? color : "rgba(255,255,255,.07)",
                boxShadow: i < active ? `0 0 10px ${color}33` : "none"
              }}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 10, textAlign: "right", fontSize: 22, fontWeight: 800, color: "#74d67b" }}>
        {n.toFixed(decimals)}{unit}
      </div>
    </div>
  );
}

function StatPill({ label, value, tone = "#7aa2ff" }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "10px 12px",
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)"
      }}
    >
      <div style={{ fontSize: 11, opacity: .72 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: tone, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function DeviceCard({ item }) {
  const portsTotal = num(item?.portsTotal);
  const portsUp = num(item?.portsUp);
  const portsDown = num(item?.portsDown);
  const cpu = item?.cpuPercent;
  const temp = item?.temperatureC;
  const mem = item?.freeMemoryBytes;
  const db = item?.databaseSizeBytes;
  const rx = item?.traffic?.rxMbps;
  const tx = item?.traffic?.txMbps;
  const total = num(rx) + num(tx);

  return (
    <section
      style={{
        borderRadius: 22,
        padding: 16,
        background: "linear-gradient(180deg, rgba(11,15,24,.98), rgba(8,11,18,.95))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 18px 50px rgba(0,0,0,.35), inset 0 0 30px rgba(255,255,255,.02)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>
            TP-Link-JETStream
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
            {item?.sysName || item?.ip}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.66)", marginTop: 4 }}>
            {item?.ip} {item?.model ? `• ${item.model}` : ""}
          </div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            background: item?.ok ? "rgba(66,214,117,.12)" : "rgba(255,92,120,.12)",
            color: item?.ok ? "#77dd77" : "#ff6a86",
            border: item?.ok ? "1px solid rgba(66,214,117,.25)" : "1px solid rgba(255,92,120,.25)"
          }}
        >
          {item?.ok ? "ONLINE" : "ERROR"}
        </div>
      </div>

      {!item?.ok ? (
        <div
          style={{
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,80,115,.08)",
            border: "1px solid rgba(255,80,115,.2)",
            color: "#ff9ab0"
          }}
        >
          {item?.error || "Unknown switch error"}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 12 }}>
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
                border: "1px solid rgba(255,255,255,.08)",
                boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)",
                minHeight: 178
              }}
            >
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.84)", fontWeight: 700, marginBottom: 8 }}>
                Uptime
              </div>
              <div style={{ fontSize: 46, lineHeight: 1, fontWeight: 900, color: "#d7e3ff", marginTop: 18 }}>
                {uptimeText(item?.sysUpTime)}
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.55)" }}>
                Platform version
              </div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {item?.firmware || "N/A"}
              </div>
            </div>

            <MiniGauge title="CPU Percent" value={cpu} max={100} unit="%" decimals={1} />
            <MiniGauge title="CPU Load (live traffic)" value={total} max={1000} unit="" decimals={2} />
            <MiniGauge title="Temperature" value={temp} max={100} unit="°C" decimals={0} />
            <HeatStrip title="Free Memory" value={mem ? (num(mem) / 1024 / 1024) : 0} unit=" MB" max={1024} decimals={0} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr .8fr .8fr .8fr", gap: 12, marginTop: 12 }}>
            <HeatStrip title="Database Size" value={db ? (num(db) / 1024 / 1024) : 0} unit=" MB" max={64} decimals={0} />
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
                border: "1px solid rgba(255,255,255,.08)",
                boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.025)"
              }}
            >
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.84)", fontWeight: 700 }}>Live aggregate traffic</div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <StatPill label="RX" value={fmtMbps(rx)} tone="#78d96b" />
                <StatPill label="TX" value={fmtMbps(tx)} tone="#7aa2ff" />
                <StatPill label="TOTAL" value={fmtMbps(total)} tone="#f4de4c" />
              </div>
            </div>

            <StatPill label="Ports Total" value={String(portsTotal)} tone="#d7e3ff" />
            <StatPill label="Ports UP" value={String(portsUp)} tone="#77dd77" />
            <StatPill label="Ports DOWN" value={String(portsDown)} tone="#ff7a7a" />
          </div>
        </>
      )}
    </section>
  );
}

export default function TpLinkJetstreamPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const res = await fetch("/api/tplink-jetstream/health", { cache: "no-store" });
        const js = await res.json();
        if (!res.ok || !js?.ok) throw new Error(js?.error || `HTTP ${res.status}`);
        if (!dead) {
          setData(js);
          setError("");
        }
      } catch (err) {
        if (!dead) setError(err?.message || "TP-Link load failed");
      }
    }

    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, []);

  const items = useMemo(() => Array.isArray(data?.switches) ? data.switches : [], [data]);

  return (
    <div className="dashx-page">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".18em", color: "rgba(255,255,255,.5)" }}>
          Switch Health
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginTop: 4 }}>
          TP-Link-JETStream
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.62)", marginTop: 6 }}>
          Live SNMP health, traffic, and interface up/down summary for 88.88.88.254 and 10.88.88.254
        </div>
      </div>

      {error ? (
        <div className="dashx-errorBox" style={{ marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((item) => <DeviceCard key={item.ip} item={item} />)}
      </div>
    </div>
  );
}
