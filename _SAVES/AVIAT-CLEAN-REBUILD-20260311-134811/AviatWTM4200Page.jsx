import React, { useEffect, useMemo, useState } from "react";

const CAPACITY = {
  uplink: 3000,
  sfpA: 1000,
  sfpB: 1000
};

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function fmt(v) {
  return n(v).toFixed(2);
}

const LINK_CAP_MBPS = 3000

function pct(v, cap = LINK_CAP_MBPS) {
  const p = (n(v) / Math.max(1, cap)) * 100;
  return Math.max(0, Math.round(p));
}

function tone(v) {
  const p = pct(v);
  if (p >= 90) {
    return {
      border: "rgba(255,107,129,0.45)",
      glow: "rgba(255,107,129,0.16)",
      soft: "rgba(255,107,129,0.10)",
      text: "#ff9cad",
      bar: "linear-gradient(90deg, #ff7b93 0%, #ff5c7a 100%)",
      badge: "CRITICAL"
    };
  }
  if (p >= 70) {
    return {
      border: "rgba(247,201,72,0.42)",
      glow: "rgba(247,201,72,0.14)",
      soft: "rgba(247,201,72,0.10)",
      text: "#ffe08a",
      bar: "linear-gradient(90deg, #ffd86b 0%, #ffbf3f 100%)",
      badge: "HIGH"
    };
  }
  return {
    border: "rgba(72,205,255,0.35)",
    glow: "rgba(72,205,255,0.12)",
    soft: "rgba(72,205,255,0.08)",
    text: "#8fe9ff",
    bar: "linear-gradient(90deg, #53d8ff 0%, #34b7ff 100%)",
    badge: "NORMAL"
  };
}

function shellCardStyle(v) {
  const t = tone(v);
  return {
    border: `1px solid ${t.border}`,
    background: `linear-gradient(180deg, rgba(10,18,30,.96) 0%, rgba(8,14,24,.96) 100%), ${t.glow}`,
    boxShadow: `0 20px 60px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.03)`,
    borderRadius: 28
  };
}

function topStripCard(label, value, sub, highlight) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 22,
      background: highlight ? highlight.soft : "rgba(255,255,255,0.03)",
      border: `1px solid ${highlight ? highlight.border : "rgba(255,255,255,0.08)"}`,
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
        color: highlight ? highlight.text : "#fff"
      }}>
        {value}
      </div>
      <div style={{ marginTop: 8, color: "#9db5da", fontSize: 13 }}>
        {sub}
      </div>
    </div>
  );
}

function normalizePart(obj, fallbackKey, fallbackName) {
  if (!obj || typeof obj !== "object") return null;
  const rx = n(obj.rxMbps ?? obj.rx_mbps ?? obj.rx);
  const tx = n(obj.txMbps ?? obj.tx_mbps ?? obj.tx);
  const total = n(obj.totalMbps ?? obj.total_mbps ?? obj.total ?? (rx + tx));
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
  if (data?.switchA) out.push(normalizePart(data.switchA, "swa", "Switch A"));
  if (data?.switchB) out.push(normalizePart(data.switchB, "swb", "Switch B"));
  if (data?.radio) out.push(normalizePart(data.radio, "radio", "Radio1"));
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

function mapCards(data, parts) {
  let uplink = parts.find(p => p.key.includes("radio") || String(p.name).toLowerCase().includes("radio"));

  const switchAApi = parts.find(p =>
    p.key === "swa" ||
    String(p.name).toLowerCase().includes("switch a") ||
    String(p.name).toLowerCase().includes("tengige1/2")
  );

  const switchBApi = parts.find(p =>
    p.key === "swb" ||
    String(p.name).toLowerCase().includes("switch b") ||
    String(p.name).toLowerCase().includes("tengige1/1")
  );

  if (!uplink) {
    const rx = n(data?.combined?.rxMbps ?? data?.rxMbps);
    const tx = n(data?.combined?.txMbps ?? data?.txMbps);
    const total = n(data?.combined?.totalMbps ?? data?.totalMbps ?? (rx + tx));
    uplink = {
      key: "uplink",
      name: "Radio1",
      rxMbps: rx,
      txMbps: tx,
      totalMbps: total,
      status: "up"
    };
  }

  const switchB = switchBApi ? {
    ...switchBApi,
    title: "Switch B",
    subtitle: "88.88.88.254 • VLAN1559 • TenGigE1/1"
  } : null;

  const switchA = switchAApi ? {
    ...switchAApi,
    title: "Switch A",
    subtitle: "10.88.88.254 • VLAN2430 • TenGigE1/2"
  } : null;

  const uplinkCard = uplink ? {
    ...uplink,
    title: "UPLINK",
    subtitle: "Radio1 • Main Internet Source"
  } : null;

  return { uplink: uplinkCard, switchB, switchA };
}

function totalFromData(data, cards) {
  const rx = n(data?.combined?.rxMbps ?? data?.rxMbps);
  const tx = n(data?.combined?.txMbps ?? data?.txMbps);
  const total = n(data?.combined?.totalMbps ?? data?.totalMbps ?? (rx + tx));

  if (rx || tx || total) {
    return { rxMbps: rx, txMbps: tx, totalMbps: total };
  }

  return [cards.uplink, cards.switchB, cards.switchA].filter(Boolean).reduce((acc, c) => {
    acc.rxMbps += n(c.rxMbps);
    acc.txMbps += n(c.txMbps);
    acc.totalMbps += n(c.totalMbps);
    return acc;
  }, { rxMbps: 0, txMbps: 0, totalMbps: 0 });
}

function MiniMetric({ label, value, accent }) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 18,
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{ fontSize: 12, color: "#84a1cb", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: accent }}>{fmt(value)}</div>
      <div style={{ marginTop: 6, color: "#a8bddf", fontSize: 12 }}>Mbps</div>
    </div>
  );
}

function UtilBar({ value }) {
  const p = pct(value, CAPACITY.uplink);
  const t = tone(value);
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
        <div style={{ color: t.text, fontSize: 13, fontWeight: 800 }}>
          {p}%
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
          width: `${Math.min(100, p)}%`,
          height: "100%",
          background: t.bar,
          boxShadow: "0 0 20px rgba(255,255,255,.08) inset"
        }} />
      </div>
    </div>
  );
}

function TrafficBlock({ card }) {
  if (!card) {
    return (
      <div style={{
        ...shellCardStyle(0),
        padding: 20
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>No Data</div>
      </div>
    );
  }

  const t = tone(card.totalMbps, card.cap);

  return (
    <div style={{
      ...shellCardStyle(card.totalMbps),
      padding: 20,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at top right, ${t.glow} 0%, transparent 32%)`,
        pointerEvents: "none"
      }} />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        marginBottom: 16,
        position: "relative",
        zIndex: 1
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 0.2 }}>
            {card.title}
          </div>
          <div style={{ marginTop: 6, color: "#9db5da", fontSize: 14, lineHeight: 1.45 }}>
            {card.subtitle}
          </div>
        </div>

        <div style={{
          padding: "8px 12px",
          borderRadius: 999,
          background: t.soft,
          border: `1px solid ${t.border}`,
          color: t.text,
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 1.2
        }}>
          {t.badge}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 16,
        position: "relative",
        zIndex: 1
      }}>
        <MiniMetric label="RX" value={card.rxMbps} accent="#8fe9ff" />
        <MiniMetric label="TX" value={card.txMbps} accent="#9cffd6" />
        <MiniMetric label="TOTAL" value={card.totalMbps} accent={t.text} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <UtilBar value={card.totalMbps} />
      </div>
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
  const cards = useMemo(() => mapCards(data, parts), [data, parts]);
  const combined = useMemo(() => totalFromData(data, cards), [data, cards]);

  const combinedTone = useMemo(() => tone(combined.totalMbps), [combined.totalMbps]);

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
          Live operational traffic view stronger than a generic dashboard.
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 12
      }}>
        {topStripCard("Combined RX", fmt(combined.rxMbps) + " Mbps", "Inbound aggregate", { soft:"rgba(37,200,255,.10)", border:"rgba(37,200,255,.24)", text:"#8fe9ff" })}
        {topStripCard("Combined TX", fmt(combined.txMbps) + " Mbps", "Outbound aggregate", { soft:"rgba(53,242,161,.10)", border:"rgba(53,242,161,.24)", text:"#9cffd6" })}
        {topStripCard("Combined Total", fmt(combined.totalMbps) + " Mbps", "Operational throughput", combinedTone)}
        {topStripCard("Status", err ? "DEGRADED" : (loading ? "LOADING" : "LIVE"), err ? err : ("Last update: " + (lastOkAt || "-")), { soft:"rgba(255,255,255,.03)", border:"rgba(255,255,255,.08)", text:"#fff" })}
      </div>

      <div style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16
      }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#dbe7ff",
          fontSize: 13,
          fontWeight: 700
        }}>
          Device: 155.15.59.4
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#dbe7ff",
          fontSize: 13,
          fontWeight: 700
        }}>
          Poll: 3s
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#dbe7ff",
          fontSize: 13,
          fontWeight: 700
        }}>
          Radio: 3 Gbps • SFP Ports: 1 Gbps
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#8ea8cf",
          fontSize: 13,
          fontWeight: 700
        }}>
          Tick: {tick}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
        gap: 14
      }}>
        <TrafficBlock card={cards.uplink} />
        <TrafficBlock card={cards.switchB} />
        <TrafficBlock card={cards.switchA} />
      </div>
    </div>
  );
}




