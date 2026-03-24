import React, { useEffect, useMemo, useState } from "react";

const CAPACITY = {
  uplink: 3000,
  switchB: 1000,
  switchA: 1000
};

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function fmt(v) {
  return num(v).toFixed(2);
}

function utilPct(value, capacity) {
  const p = (num(value) / Math.max(1, num(capacity))) * 100;
  return Math.max(0, Math.round(p));
}

function toneFor(value, capacity) {
  const p = utilPct(value, capacity);

  if (p >= 90) {
    return {
      name: "CRITICAL",
      text: "#ffb8c5",
      border: "rgba(255,94,122,0.42)",
      soft: "rgba(255,94,122,0.08)",
      bar: "linear-gradient(90deg, #ffb0be 0%, #ff5c7a 100%)"
    };
  }

  if (p >= 70) {
    return {
      name: "HIGH",
      text: "#ffe08f",
      border: "rgba(255,198,91,0.34)",
      soft: "rgba(255,198,91,0.07)",
      bar: "linear-gradient(90deg, #ffe08f 0%, #ffc24c 100%)"
    };
  }

  return {
    name: "NORMAL",
    text: "#8fe9ff",
    border: "rgba(63,204,255,0.26)",
    soft: "rgba(63,204,255,0.06)",
    bar: "linear-gradient(90deg, #78efff 0%, #37bfff 100%)"
  };
}

function statusTone(err, loading) {
  if (err) {
    return {
      label: "DEGRADED",
      text: "#ffb8c5",
      border: "rgba(255,94,122,0.36)",
      bg: "rgba(255,94,122,0.07)"
    };
  }

  if (loading) {
    return {
      label: "LOADING",
      text: "#ffe08f",
      border: "rgba(255,198,91,0.30)",
      bg: "rgba(255,198,91,0.07)"
    };
  }

  return {
    label: "LIVE",
    text: "#a9ffd5",
    border: "rgba(72,255,176,0.24)",
    bg: "rgba(72,255,176,0.06)"
  };
}

function normalizePart(obj, fallbackKey, fallbackName) {
  if (!obj || typeof obj !== "object") return null;

  const rx = num(obj.rxMbps ?? obj.rx_mbps ?? obj.rx);
  const tx = num(obj.txMbps ?? obj.tx_mbps ?? obj.tx);
  const total = num(obj.totalMbps ?? obj.total_mbps ?? obj.total ?? (rx + tx));

  return {
    key: String(obj.key || fallbackKey || "").toLowerCase(),
    name: obj.name || fallbackName,
    rxMbps: rx,
    txMbps: tx,
    totalMbps: total,
    status: String(obj.status || (obj.ok === false ? "down" : "up")).toLowerCase(),
    raw: obj
  };
}

function getApiParts(data) {
  const out = [];

  if (data?.radio) out.push(normalizePart(data.radio, "radio", "Radio1"));
  if (data?.switchA) out.push(normalizePart(data.switchA, "swa", "Switch A"));
  if (data?.switchB) out.push(normalizePart(data.switchB, "swb", "Switch B"));

  if (Array.isArray(data?.parts)) {
    data.parts.forEach((p, i) => out.push(normalizePart(p, `part${i + 1}`, `Part ${i + 1}`)));
  }

  const seen = new Set();
  return out.filter(Boolean).filter((p) => {
    const k = `${p.key}|${p.name}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildCards(data, parts) {
  let uplink = parts.find(
    (p) => p.key.includes("radio") || String(p.name).toLowerCase().includes("radio")
  );

  if (!uplink) {
    uplink = {
      key: "uplink",
      name: "Radio1",
      rxMbps: num(data?.combined?.rxMbps ?? data?.rxMbps),
      txMbps: num(data?.combined?.txMbps ?? data?.txMbps),
      totalMbps: num(data?.combined?.totalMbps ?? data?.totalMbps),
      status: "up"
    };
  }

  const switchB = parts.find(
    (p) =>
      p.key === "swb" ||
      String(p.name).toLowerCase().includes("switch b") ||
      String(p.name).toLowerCase().includes("tengige1/1")
  );

  const switchA = parts.find(
    (p) =>
      p.key === "swa" ||
      String(p.name).toLowerCase().includes("switch a") ||
      String(p.name).toLowerCase().includes("tengige1/2")
  );

  return {
    uplink: {
      ...uplink,
      title: "UPLINK CORE",
      subtitle: "Radio1 Main Internet Source",
      meta: "155.15.59.4 • 3 Gbps core path • Aviat WTM4200",
      capacityMbps: CAPACITY.uplink
    },
    switchB: switchB
      ? {
          ...switchB,
          title: "Switch B",
          subtitle: "88.88.88.254 • VLAN1559 • TenGigE1/1",
          meta: "Distribution segment • 1 Gbps",
          capacityMbps: CAPACITY.switchB
        }
      : null,
    switchA: switchA
      ? {
          ...switchA,
          title: "Switch A",
          subtitle: "10.88.88.254 • VLAN2430 • TenGigE1/2",
          meta: "Distribution segment • 1 Gbps",
          capacityMbps: CAPACITY.switchA
        }
      : null
  };
}

function getCombined(data, cards) {
  const rx = num(data?.combined?.rxMbps ?? data?.rxMbps);
  const tx = num(data?.combined?.txMbps ?? data?.txMbps);
  const total = num(data?.combined?.totalMbps ?? data?.totalMbps ?? (rx + tx));

  if (rx || tx || total) {
    return { rxMbps: rx, txMbps: tx, totalMbps: total };
  }

  return [cards.uplink, cards.switchB, cards.switchA]
    .filter(Boolean)
    .reduce(
      (acc, c) => {
        acc.rxMbps += num(c.rxMbps);
        acc.txMbps += num(c.txMbps);
        acc.totalMbps += num(c.totalMbps);
        return acc;
      },
      { rxMbps: 0, txMbps: 0, totalMbps: 0 }
    );
}

function Chip({ label, value, accent = "#8fe9ff" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 10px 20px rgba(0,0,0,0.16)"
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#6f8cb8",
          letterSpacing: 1.05,
          textTransform: "uppercase"
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{value}</span>
    </div>
  );
}

function HeroMetric({ label, value, sub, color }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#7392bf",
          letterSpacing: 1.35,
          textTransform: "uppercase",
          marginBottom: 10
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          lineHeight: 1,
          fontWeight: 950,
          color
        }}
      >
        {fmt(value)}
        <span style={{ fontSize: 17, marginLeft: 8, color: "#98b0d6" }}>Mbps</span>
      </div>
      <div style={{ marginTop: 10, color: "#96aed4", fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function UtilBar({ value, capacity }) {
  const percent = utilPct(value, capacity);
  const tone = toneFor(value, capacity);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#7392bf",
            letterSpacing: 1.25,
            textTransform: "uppercase"
          }}
        >
          Capacity Pressure
        </div>
        <div style={{ color: tone.text, fontWeight: 900, fontSize: 13 }}>{percent}%</div>
      </div>

      <div
        style={{
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        <div
          style={{
            width: `${Math.min(100, percent)}%`,
            height: "100%",
            background: tone.bar
          }}
        />
      </div>
    </div>
  );
}

function RailCard({ title, value, sub, color = "#fff", border = "rgba(255,255,255,0.08)" }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 16,
        background: "linear-gradient(180deg, rgba(10,16,29,0.98) 0%, rgba(7,12,23,0.98) 100%)",
        border: `1px solid ${border}`
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#6f8cb8",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 8
        }}
      >
        {title}
      </div>
      <div style={{ color, fontSize: 28, lineHeight: 1.05, fontWeight: 950 }}>{value}</div>
      <div style={{ marginTop: 10, color: "#9bb3d8", fontSize: 14, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

function TrafficPanel({ card, large = false }) {
  if (!card) {
    return (
      <div
        style={{
          borderRadius: 30,
          padding: 22,
          background: "linear-gradient(180deg, rgba(8,15,27,0.98) 0%, rgba(5,10,19,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>No Data</div>
      </div>
    );
  }

  const tone = toneFor(card.totalMbps, card.capacityMbps);

  return (
    <div
      style={{
        borderRadius: 30,
        padding: large ? 24 : 22,
        background:
          "radial-gradient(circle at top right, rgba(0,162,255,0.09), transparent 24%), linear-gradient(180deg, rgba(8,15,27,0.985) 0%, rgba(4,9,18,0.995) 100%)",
        border: `1px solid ${tone.border}`,
        boxShadow: "0 24px 56px rgba(0,0,0,0.24)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 16
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: "#7392bf",
              letterSpacing: 1.45,
              textTransform: "uppercase",
              marginBottom: 8
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              fontSize: large ? 34 : 26,
              lineHeight: 1.02,
              fontWeight: 950,
              color: "#fff"
            }}
          >
            {card.subtitle}
          </div>
          <div style={{ marginTop: 10, color: "#97afd5", fontSize: 14, lineHeight: 1.5 }}>{card.meta}</div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: tone.soft,
            border: `1px solid ${tone.border}`,
            color: tone.text,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1.2,
            whiteSpace: "nowrap"
          }}
        >
          {tone.name}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: large ? "1fr 1fr 1.15fr" : "repeat(3, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 16
        }}
      >
        <div style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "#7392bf", marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase" }}>RX</div>
          <div style={{ fontSize: large ? 42 : 26, lineHeight: 1, fontWeight: 950, color: "#8fe9ff" }}>{fmt(card.rxMbps)}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#98b0d6" }}>Mbps</div>
        </div>

        <div style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "#7392bf", marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase" }}>TX</div>
          <div style={{ fontSize: large ? 42 : 26, lineHeight: 1, fontWeight: 950, color: "#9cffd7" }}>{fmt(card.txMbps)}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#98b0d6" }}>Mbps</div>
        </div>

        <div style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,0.04)", border: `1px solid ${tone.border}` }}>
          <div style={{ fontSize: 11, color: "#7392bf", marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase" }}>Total</div>
          <div style={{ fontSize: large ? 54 : 30, lineHeight: 1, fontWeight: 950, color: tone.text }}>{fmt(card.totalMbps)}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#98b0d6" }}>Mbps</div>
        </div>
      </div>

      <UtilBar value={card.totalMbps} capacity={card.capacityMbps} />
    </div>
  );
}

export default function AviatWTM4200Page() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [lastOkAt, setLastOkAt] = useState("");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const res = await fetch("/api/aviatwtm4200/live", { cache: "no-store" });
        const json = await res.json();

        if (dead) return;

        setData(json);
        setErr("");
        setLastOkAt(new Date().toLocaleTimeString());
      } catch (e) {
        if (dead) return;
        setErr(String(e?.message || e || "Load failed"));
      } finally {
        if (!dead) setLoading(false);
      }
    }

    load();

    const id = setInterval(() => {
      setTick((v) => v + 1);
      load();
    }, 3000);

    return () => {
      dead = true;
      clearInterval(id);
    };
  }, []);

  const parts = useMemo(() => getApiParts(data), [data]);
  const cards = useMemo(() => buildCards(data, parts), [data, parts]);
  const combined = useMemo(() => getCombined(data, cards), [data, cards]);
  const live = statusTone(err, loading);
  const aggregatePressure = utilPct(
    combined.totalMbps,
    CAPACITY.uplink + CAPACITY.switchA + CAPACITY.switchB
  );

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 20,
        background:
          "radial-gradient(circle at 0% 0%, rgba(0,168,255,0.12), transparent 18%), radial-gradient(circle at 100% 0%, rgba(69,54,255,0.09), transparent 18%), linear-gradient(180deg, #060f1b 0%, #030814 100%)",
        color: "#fff"
      }}
    >
      <div style={{ maxWidth: '100%', margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <Chip label="Mode" value="Aviat WTM4200 Live" />
          <Chip label="Device" value="155.15.59.4" />
          <Chip label="Polling" value="3s" accent="#9cffd7" />
          <Chip label="Uplink" value="3 Gbps" />
          <Chip label="Switch B" value="1 Gbps" />
          <Chip label="Switch A" value="1 Gbps" />
          <Chip label="Tick" value={tick} accent="#ffe08f" />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) 320px",
            gap: 14,
            marginBottom: 14
          }}
        >
          <div
            style={{
              borderRadius: 34,
              padding: 24,
              background:
                "radial-gradient(circle at top left, rgba(0,150,255,0.14), transparent 24%), linear-gradient(180deg, rgba(8,16,31,0.98) 0%, rgba(4,9,18,0.99) 100%)",
              border: "1px solid rgba(72,152,255,0.18)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.28)"
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#789dd4",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 12
              }}
            >
              Aviat WTM4200 • Live Operations Surface
            </div>

            <div
              style={{
                fontSize: 52,
                lineHeight: 0.98,
                fontWeight: 950,
                letterSpacing: -1.2,
                marginBottom: 12
              }}
            >
              Uplink Traffic Command Matrix
            </div>

            <div
              style={{
                maxWidth: '100%',
                color: "#a4bcdf",
                fontSize: 16,
                lineHeight: 1.6,
                marginBottom: 20
              }}
            >
              Real-time monitoring board for uplink throughput, aggregate pressure, and
              distribution path state across the Aviat transport chain.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <HeroMetric label="Combined Total" value={combined.totalMbps} sub="Primary operational throughput" color="#ffffff" />
              <HeroMetric label="Combined RX" value={combined.rxMbps} sub="Inbound aggregate" color="#8fe9ff" />
              <HeroMetric label="Combined TX" value={combined.txMbps} sub="Outbound aggregate" color="#9cffd7" />
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <RailCard
              title="Session"
              value={live.label}
              sub={err ? err : `Last update ${lastOkAt || "-"}`}
              color={live.text}
              border={live.border}
            />
            <RailCard
              title="Aggregate Pressure"
              value={`${aggregatePressure}%`}
              sub="Combined throughput against the full modeled available capacity."
              color="#8fe9ff"
              border="rgba(63,204,255,0.24)"
            />
            <RailCard
              title="Engine"
              value={err ? "Alert" : "Stable"}
              sub={err ? "Polling error detected in transport layer." : "Live telemetry running in normal polling cycle."}
              color={err ? "#ffb8c5" : "#a9ffd5"}
              border={err ? "rgba(255,94,122,0.30)" : "rgba(72,255,176,0.20)"}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) 320px",
            gap: 14,
            marginBottom: 14
          }}
        >
          <TrafficPanel card={cards.uplink} large />
          <div style={{ display: "grid", gap: 14 }}>
            <RailCard
              title="Operations Signal"
              value={toneFor(cards.uplink?.totalMbps, cards.uplink?.capacityMbps ?? CAPACITY.uplink).name}
              sub="Live assessment of the primary uplink capacity state."
              color={toneFor(cards.uplink?.totalMbps, cards.uplink?.capacityMbps ?? CAPACITY.uplink).text}
              border={toneFor(cards.uplink?.totalMbps, cards.uplink?.capacityMbps ?? CAPACITY.uplink).border}
            />
            <RailCard
              title="Telemetry"
              value={lastOkAt ? `Updated ${lastOkAt}` : "Awaiting poll"}
              sub="Polling interval fixed at 3 seconds with continuous refresh cadence."
              color="#b9f4ff"
              border="rgba(63,204,255,0.20)"
            />
            <RailCard
              title="Aggregate State"
              value={err ? "Issue" : "Live"}
              sub={err ? err : "Transport telemetry currently active with no reported fetch errors."}
              color={err ? "#ffb8c5" : "#ffffff"}
              border="rgba(255,255,255,0.10)"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <TrafficPanel card={cards.switchB} />
          <TrafficPanel card={cards.switchA} />
        </div>
      </div>
    </div>
  );
}






