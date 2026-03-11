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
      text: "#ff9caf",
      border: "rgba(255,107,129,0.45)",
      soft: "rgba(255,107,129,0.12)",
      bar: "linear-gradient(90deg, #ff8fa3 0%, #ff5e7c 100%)"
    };
  }

  if (p >= 70) {
    return {
      name: "HIGH",
      text: "#ffe08a",
      border: "rgba(247,201,72,0.40)",
      soft: "rgba(247,201,72,0.10)",
      bar: "linear-gradient(90deg, #ffe082 0%, #ffc44d 100%)"
    };
  }

  return {
    name: "NORMAL",
    text: "#8fe9ff",
    border: "rgba(72,205,255,0.35)",
    soft: "rgba(72,205,255,0.08)",
    bar: "linear-gradient(90deg, #6be7ff 0%, #35bfff 100%)"
  };
}

function TopStat({ label, value, sub, accentText="#fff", accentBorder="rgba(255,255,255,0.08)", accentBg="rgba(255,255,255,0.03)" }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 22,
      background: accentBg,
      border: `1px solid ${accentBorder}`,
      boxShadow: "0 12px 32px rgba(0,0,0,0.22)"
    }}>
      <div style={{
        fontSize: 12,
        color: "#8ea8cf",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginBottom: 8
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 30,
        lineHeight: 1,
        fontWeight: 900,
        color: accentText
      }}>
        {value}
      </div>
      <div style={{ marginTop: 8, color: "#9db5da", fontSize: 13 }}>
        {sub}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 18,
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{ fontSize: 12, color: "#84a1cb", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color }}>
        {fmt(value)}
      </div>
      <div style={{ marginTop: 6, color: "#a8bddf", fontSize: 12 }}>Mbps</div>
    </div>
  );
}

function InfoPill({ children }) {
  return (
    <div style={{
      padding: "10px 14px",
      borderRadius: 999,
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
      color: "#dbe7ff",
      fontSize: 13,
      fontWeight: 700
    }}>
      {children}
    </div>
  );
}

function UtilBar({ value, capacity }) {
  const percent = utilPct(value, capacity);
  const tone = toneFor(value, capacity);

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }}>
        <div style={{ color: "#8ea8cf", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
          Utilization
        </div>
        <div style={{ color: tone.text, fontSize: 13, fontWeight: 900 }}>
          {percent}%
        </div>
      </div>

      <div style={{
        height: 12,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${Math.min(100, percent)}%`,
          height: "100%",
          background: tone.bar
        }} />
      </div>
    </div>
  );
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
    data.parts.forEach((p, i) => out.push(normalizePart(p, `part${i+1}`, `Part ${i+1}`)));
  }

  const seen = new Set();
  return out.filter(Boolean).filter(p => {
    const k = `${p.key}|${p.name}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildCards(data, parts) {
  let uplink = parts.find(p =>
    p.key.includes("radio") ||
    String(p.name).toLowerCase().includes("radio")
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

  const switchB = parts.find(p =>
    p.key === "swb" ||
    String(p.name).toLowerCase().includes("switch b") ||
    String(p.name).toLowerCase().includes("tengige1/1")
  );

  const switchA = parts.find(p =>
    p.key === "swa" ||
    String(p.name).toLowerCase().includes("switch a") ||
    String(p.name).toLowerCase().includes("tengige1/2")
  );

  return {
    uplink: {
      ...uplink,
      title: "UPLINK",
      subtitle: "Radio1 • Main Internet Source",
      capacityMbps: CAPACITY.uplink
    },
    switchB: switchB ? {
      ...switchB,
      title: "Switch B",
      subtitle: "88.88.88.254 • VLAN1559 • TenGigE1/1",
      capacityMbps: CAPACITY.switchB
    } : null,
    switchA: switchA ? {
      ...switchA,
      title: "Switch A",
      subtitle: "10.88.88.254 • VLAN2430 • TenGigE1/2",
      capacityMbps: CAPACITY.switchA
    } : null
  };
}

function getCombined(data, cards) {
  const rx = num(data?.combined?.rxMbps ?? data?.rxMbps);
  const tx = num(data?.combined?.txMbps ?? data?.txMbps);
  const total = num(data?.combined?.totalMbps ?? data?.totalMbps ?? (rx + tx));

  if (rx || tx || total) {
    return { rxMbps: rx, txMbps: tx, totalMbps: total };
  }

  return [cards.uplink, cards.switchB, cards.switchA].filter(Boolean).reduce((acc, c) => {
    acc.rxMbps += num(c.rxMbps);
    acc.txMbps += num(c.txMbps);
    acc.totalMbps += num(c.totalMbps);
    return acc;
  }, { rxMbps: 0, txMbps: 0, totalMbps: 0 });
}

function TrafficCard({ card }) {
  if (!card) {
    return (
      <div style={{
        borderRadius: 28,
        padding: 20,
        background: "linear-gradient(180deg, rgba(10,18,30,.96) 0%, rgba(8,14,24,.96) 100%)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>No Data</div>
      </div>
    );
  }

  const tone = toneFor(card.totalMbps, card.capacityMbps);

  return (
    <div style={{
      borderRadius: 28,
      padding: 20,
      background: "linear-gradient(180deg, rgba(10,18,30,.96) 0%, rgba(8,14,24,.96) 100%)",
      border: `1px solid ${tone.border}`,
      boxShadow: "0 20px 60px rgba(0,0,0,.34)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        marginBottom: 16
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
            {card.title}
          </div>
          <div style={{ marginTop: 6, color: "#9db5da", fontSize: 14, lineHeight: 1.45 }}>
            {card.subtitle}
          </div>
        </div>

        <div style={{
          padding: "8px 12px",
          borderRadius: 999,
          background: tone.soft,
          border: `1px solid ${tone.border}`,
          color: tone.text,
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 1.2
        }}>
          {tone.name}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 16
      }}>
        <MiniMetric label="RX" value={card.rxMbps} color="#8fe9ff" />
        <MiniMetric label="TX" value={card.txMbps} color="#9cffd6" />
        <MiniMetric label="TOTAL" value={card.totalMbps} color={tone.text} />
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
      setTick(v => v + 1);
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

  return (
    <div style={{
      minHeight: "100%",
      padding: 22,
      background:
        "radial-gradient(circle at top left, rgba(0,170,255,0.12), transparent 28%), radial-gradient(circle at top right, rgba(98,70,255,0.10), transparent 24%), linear-gradient(180deg, #07111f 0%, #040b16 100%)",
      color: "#fff"
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#7ea2d8",
          marginBottom: 8
        }}>
          Aviat WTM4200
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.04 }}>
          Uplink Traffic Matrix
        </div>
        <div style={{ marginTop: 10, color: "#a8bddf", fontSize: 14 }}>
          Live operational traffic view with real per-link capacity.
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 12
      }}>
        <TopStat label="Combined RX" value={fmt(combined.rxMbps) + " Mbps"} sub="Inbound aggregate" accentText="#8fe9ff" accentBorder="rgba(37,200,255,.24)" accentBg="rgba(37,200,255,.10)" />
        <TopStat label="Combined TX" value={fmt(combined.txMbps) + " Mbps"} sub="Outbound aggregate" accentText="#9cffd6" accentBorder="rgba(53,242,161,.24)" accentBg="rgba(53,242,161,.10)" />
        <TopStat label="Combined Total" value={fmt(combined.totalMbps) + " Mbps"} sub="Operational throughput" accentText="#8fe9ff" accentBorder="rgba(72,205,255,.24)" accentBg="rgba(72,205,255,.08)" />
        <TopStat label="Status" value={err ? "DEGRADED" : (loading ? "LOADING" : "LIVE")} sub={err ? err : ("Last update: " + (lastOkAt || "-"))} />
      </div>

      <div style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16
      }}>
        <InfoPill>Device: 155.15.59.4</InfoPill>
        <InfoPill>Poll: 3s</InfoPill>
        <InfoPill>UPLINK: 3 Gbps</InfoPill>
        <InfoPill>Switch B: 1 Gbps</InfoPill>
        <InfoPill>Switch A: 1 Gbps</InfoPill>
        <InfoPill>Tick: {tick}</InfoPill>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
        gap: 14
      }}>
        <TrafficCard card={cards.uplink} />
        <TrafficCard card={cards.switchB} />
        <TrafficCard card={cards.switchA} />
      </div>
    </div>
  );
}
