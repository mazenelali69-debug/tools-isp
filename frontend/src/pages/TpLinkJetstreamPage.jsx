import React, { useEffect, useMemo, useRef, useState } from "react";

const POLL_MS = 4000;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function stableSignature(payload) {
  try {
    const list = Array.isArray(payload?.switches) ? payload.switches : [];
    return JSON.stringify({
      vlan1559Status: payload?.vlan1559Status ?? "",
      switches: list.map((s) => ({
        ok: !!s?.ok,
        ip: s?.ip ?? "",
        sysName: s?.sysName ?? "",
        sysUpTime: num(s?.sysUpTime),
        memoryPercent: num(s?.memoryPercent),
        portsTotal: num(s?.portsTotal),
        portsUp: num(s?.portsUp),
        portsDown: num(s?.portsDown),
        vlan1559Status: s?.vlan1559Status ?? "",
        traffic: {
          rxMbps: num(s?.traffic?.rxMbps),
          txMbps: num(s?.traffic?.txMbps)
        },
        ethPort: {
          rxPct: num(s?.ethPort?.rxPct),
          txPct: num(s?.ethPort?.txPct),
          label: s?.ethPort?.label ?? "",
          index: num(s?.ethPort?.index)
        }
      }))
    });
  } catch {
    return "";
  }
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

function panelStyle() {
  return {
    borderRadius: 0,
    background: "linear-gradient(180deg, rgba(18,24,34,.96), rgba(13,18,28,.95))",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)"
  };
}

function titleStyle() {
  return {
    fontSize: 13,
    color: "rgba(255,255,255,.88)",
    fontWeight: 700,
    marginBottom: 8
  };
}

function gaugeTone(ratio, mode) {
  if (mode === "tx") {
    if (ratio >= 0.85) return { fill: "#ff4c63", text: "#ff7388" };
    if (ratio >= 0.65) return { fill: "#ffb02e", text: "#ffc55c" };
    return { fill: "#63e6be", text: "#7ef0cf" };
  }
  if (mode === "rx") {
    if (ratio >= 0.85) return { fill: "#ff4c63", text: "#ff7388" };
    if (ratio >= 0.65) return { fill: "#f2db2f", text: "#e7ef6c" };
    return { fill: "#7ed36f", text: "#92ea82" };
  }
  return { fill: "#7ed36f", text: "#92ea82" };
}

const GaugeCard = React.memo(function GaugeCard({ title, value, display, max = 100, mode = "rx" }) {
  const safeMax = Math.max(1, num(max));
  const n = num(value);
  const ratio = Math.max(0, Math.min(1, n / safeMax));
  const deg = ratio * 180;
  const tone = gaugeTone(ratio, mode);

  return (
    <div style={{ ...panelStyle(), padding: 10, minHeight: 138 }}>
      <div style={titleStyle()}>{title}</div>

      <div style={{ display: "flex", justifyContent: 'flex-start', alignItems: "center", paddingTop: 2 }}>
        <div style={{ position: "relative", width: 152, height: 88 }}>
          <svg width="152" height="88" viewBox="0 0 152 88">
            <path
              d="M 18 78 A 58 58 0 0 1 134 78"
              fill="none"
              stroke="rgba(255,255,255,.09)"
              strokeWidth="14"
              strokeLinecap="butt"
            />
            <path
              d="M 18 78 A 58 58 0 0 1 134 78"
              fill="none"
              stroke={tone.fill}
              strokeWidth="14"
              strokeLinecap="butt"
              pathLength="180"
              strokeDasharray={`${deg} 180`}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: 'flex-start',
              paddingBottom: 8
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: tone.text, lineHeight: 1 }}>
              {display}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const SegBar = React.memo(function SegBar({ title, value, max, unit = "%", valueColor = "#5aa1ff" }) {
  const n = num(value);
  const safeMax = Math.max(1, num(max));
  const segments = 28;
  const active = Math.max(0, Math.min(segments, Math.round((n / safeMax) * segments)));

  return (
    <div style={{ ...panelStyle(), padding: 10, minHeight: 62 }}>
      <div style={{ ...titleStyle(), marginBottom: 8 }}>{title}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${segments}, 1fr)`, gap: 3 }}>
          {Array.from({ length: segments }).map((_, i) => {
            const ratio = (i + 1) / segments;
            const segColor =
              ratio <= 0.16 ? "#ff5672" :
              ratio <= 0.32 ? "#ff4c63" :
              ratio <= 0.48 ? "#f0d934" :
              ratio <= 0.66 ? "#5a9cff" :
              ratio <= 0.84 ? "#66b8ff" :
              "#6fd16e";

            return (
              <div
                key={i}
                style={{
                  height: 17,
                  borderRadius: 2,
                  background: i < active ? segColor : "rgba(255,255,255,.07)",
                  boxShadow: i < active ? `0 0 8px ${segColor}33` : "none"
                }}
              />
            );
          })}
        </div>

        <div style={{ minWidth: 72, textAlign: "right", fontSize: 14, fontWeight: 800, color: valueColor }}>
          {Math.round(n)} {unit}
        </div>
      </div>
    </div>
  );
});

const UptimeCard = React.memo(function UptimeCard({ uptime, liveTrafficMbps }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 4 }}>
      <div style={{ ...panelStyle(), padding: 10, minHeight: 138 }}>
        <div style={titleStyle()}>Uptime</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: 'flex-start',
            minHeight: 92,
            fontSize: 34,
            fontWeight: 800,
            color: "#dce6f7",
            lineHeight: 1
          }}
        >
          {uptime}
        </div>
      </div>

      <div style={{ ...panelStyle(), padding: "8px 10px", minHeight: 48 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.78)", fontWeight: 700 }}>Live Traffic</div>
        <div style={{ marginTop: 6, fontSize: 14, color: "#d4d9e0" }}>
          {Number(num(liveTrafficMbps)).toFixed(2)} Mbps
        </div>
      </div>
    </div>
  );
});

const DeviceCard = React.memo(function DeviceCard({ item, index }) {
  const rxMbps = num(item?.traffic?.rxMbps);
  const txMbps = num(item?.traffic?.txMbps);
  const totalMbps = rxMbps + txMbps;

  const rxPct = num(item?.ethPort?.rxPct);
  const txPct = num(item?.ethPort?.txPct);
  const memPct = num(item?.memoryPercent);

  const portsTotal = num(item?.portsTotal);
  const portsUp = num(item?.portsUp);
  const portsDown = num(item?.portsDown);

  return (
    <div style={{ marginTop: index === 0 ? 0 : 12 }}>
      {index > 0 ? (
        <div style={{ color: "rgba(255,255,255,.78)", fontSize: 14, marginBottom: 6 }}>
          ~ Gauges ~
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.35fr 1.35fr 1.15fr 2.3fr", gap: 6 }}>
        <UptimeCard uptime={uptimeText(item?.sysUpTime)} liveTrafficMbps={totalMbps} />

        <GaugeCard
          title="RX Usage"
          value={rxPct}
          display={`${rxPct.toFixed(1)}%`}
          max={100}
          mode="rx"
        />

        <GaugeCard
          title="Live Traffic"
          value={totalMbps}
          display={totalMbps.toFixed(2)}
          max={1000}
          mode="rx"
        />

        <GaugeCard
          title="TX Usage"
          value={txPct}
          display={`${txPct.toFixed(1)}%`}
          max={100}
          mode="tx"
        />

        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 6 }}>
          <SegBar title="Memory Usage" value={memPct} max={100} unit="%" valueColor="#5cb5ff" />

          <div style={{ ...panelStyle(), padding: "10px 12px", minHeight: 62 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.88)", fontWeight: 700, marginBottom: 8 }}>
              VLAN1559 Status
            </div>
            <div style={{ fontSize: 14, color: "#d4d9e0" }}>
              {item.vlan1559Status === "ONLINE" ? "? ONLINE" : "? DOWN"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 6, color: "rgba(255,255,255,.64)", fontSize: 12 }}>
        {(item?.sysName || item?.ip)} · {item?.ip} · {(item?.ok ? "ONLINE" : "ERROR")} · Ports UP {portsUp} / {portsTotal} · Ports DOWN {portsDown}
      </div>
    </div>
  );
});

export default function TpLinkJetstreamPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const lastSigRef = useRef("");
  const inFlightRef = useRef(false);

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

  const items = useMemo(() => (Array.isArray(data?.switches) ? data.switches : []), [data]);

  return (
    <div className="dashx-page" style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: ".18em",
            color: "rgba(255,255,255,.52)"
          }}
        >
          Switch Health
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#ffffff",
            marginTop: 4
          }}
        >
          TP-Link JetStream
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 10,
            border: "1px solid rgba(255,80,115,.25)",
            background: "rgba(255,80,115,.08)",
            color: "#ffb8c4",
            padding: 10
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item, idx) => (
          <DeviceCard key={item.ip || idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}








