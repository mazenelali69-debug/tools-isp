import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";

const API_URL = "/api/aviatwtm4200/live";
const POLL_MS = 1000;
const MAX_POINTS = 90;

const CAPACITY = {
  combined: 5000,
  uplink: 3000,
  switchA: 1000,
  switchB: 1000
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(v) {
  return num(v).toFixed(2);
}

function compactMbps(v) {
  const x = num(v);
  if (x >= 1000) return (x / 1000).toFixed(2) + " Gbps";
  return x.toFixed(2) + " Mbps";
}

function shortTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return "--:--:--";
  }
}

function util(value, cap) {
  return Math.max(0, Math.min(100, Math.round((num(value) / Math.max(1, num(cap))) * 100)));
}

function toneFromValue(value, cap) {
  const p = util(value, cap);

  if (p >= 90) {
    return {
      label: "CRITICAL",
      text: "#ffbad2",
      line: "#ff5c97",
      soft: "rgba(255,92,151,0.16)",
      border: "rgba(255,92,151,0.34)"
    };
  }

  if (p >= 70) {
    return {
      label: "HIGH",
      text: "#ffd889",
      line: "#ffbf47",
      soft: "rgba(255,191,71,0.14)",
      border: "rgba(255,191,71,0.30)"
    };
  }

  return {
    label: "NORMAL",
    text: "#96f0ff",
    line: "#38d8ff",
    soft: "rgba(56,216,255,0.13)",
    border: "rgba(56,216,255,0.26)"
  };
}

function statusTone(loading, error) {
  if (error) {
    return {
      label: "DEGRADED",
      text: "#ffbad2",
      bg: "rgba(255,92,151,0.10)",
      border: "rgba(255,92,151,0.34)"
    };
  }

  if (loading) {
    return {
      label: "SYNCING",
      text: "#ffe08a",
      bg: "rgba(255,191,71,0.08)",
      border: "rgba(255,191,71,0.24)"
    };
  }

  return {
    label: "LIVE",
    text: "#a9ffd5",
    bg: "rgba(72,255,176,0.08)",
    border: "rgba(72,255,176,0.24)"
  };
}

function normalizePart(obj, fallbackKey, fallbackName) {
  if (!obj || typeof obj !== "object") return null;

  const rx = num(obj.rxMbps ?? obj.rx_mbps ?? obj.rx);
  const tx = num(obj.txMbps ?? obj.tx_mbps ?? obj.tx);
  const total = num(obj.totalMbps ?? obj.total_mbps ?? obj.total ?? (rx + tx));

  return {
    key: String(obj.key || fallbackKey || "").toLowerCase(),
    name: String(obj.name || fallbackName || "").trim(),
    rxMbps: rx,
    txMbps: tx,
    totalMbps: total,
    status: String(obj.status || (obj.ok === false ? "down" : "up")).toLowerCase()
  };
}

function getParts(data) {
  const out = [];

  if (data?.radio) out.push(normalizePart(data.radio, "radio", "Radio1"));
  if (data?.switchA) out.push(normalizePart(data.switchA, "switcha", "Switch A"));
  if (data?.switchB) out.push(normalizePart(data.switchB, "switchb", "Switch B"));

  if (Array.isArray(data?.parts)) {
    data.parts.forEach((p, i) => out.push(normalizePart(p, "part" + (i + 1), "Part " + (i + 1))));
  }

  const seen = new Set();
  return out.filter(Boolean).filter((p) => {
    const key = (p.key + "|" + p.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCards(data, parts) {
  let uplink = parts.find(
    (p) => p.key.includes("radio") || p.name.toLowerCase().includes("radio")
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

  const switchA = parts.find(
    (p) =>
      p.key === "switcha" ||
      p.key === "swa" ||
      p.name.toLowerCase().includes("switch a") ||
      p.name.toLowerCase().includes("tengige1/2")
  );

  const switchB = parts.find(
    (p) =>
      p.key === "switchb" ||
      p.key === "swb" ||
      p.name.toLowerCase().includes("switch b") ||
      p.name.toLowerCase().includes("tengige1/1")
  );

  return {
    uplink: {
      ...uplink,
      title: "UPLINK CORE",
      subtitle: "Radio1 Main Internet Source",
      meta: "155.15.59.4 • 3 Gbps core path • Aviat WTM4200",
      cap: CAPACITY.uplink
    },
    switchA: switchA
      ? {
          ...switchA,
          title: "SWITCH A",
          subtitle: "10.88.88.254 • VLAN2430 • TenGigE1/2",
          meta: "Distribution segment • 1 Gbps",
          cap: CAPACITY.switchA
        }
      : null,
    switchB: switchB
      ? {
          ...switchB,
          title: "SWITCH B",
          subtitle: "88.88.88.254 • VLAN1559 • TenGigE1/1",
          meta: "Distribution segment • 1 Gbps",
          cap: CAPACITY.switchB
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

  return [cards.uplink, cards.switchA, cards.switchB]
    .filter(Boolean)
    .reduce(
      (acc, item) => {
        acc.rxMbps += num(item.rxMbps);
        acc.txMbps += num(item.txMbps);
        acc.totalMbps += num(item.totalMbps);
        return acc;
      },
      { rxMbps: 0, txMbps: 0, totalMbps: 0 }
    );
}

function pushPoint(prev, point) {
  const next = [...prev, point];
  if (next.length > MAX_POINTS) return next.slice(-MAX_POINTS);
  return next;
}

function chartPeak(history, key) {
  return history.reduce((m, row) => Math.max(m, num(row?.[key])), 0);
}

function chartAvg(history, key) {
  if (!history.length) return 0;
  return history.reduce((s, row) => s + num(row?.[key]), 0) / history.length;
}

function Pill({ label, value, accent = "#9ae7ff" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 999,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#6f8fc5"
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({ label, value, color, hint }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 18,
        minHeight: 116,
        background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)",
        border: "1px solid rgba(255,255,255,0.075)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 16px 45px rgba(0,0,0,0.20)"
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.3,
          textTransform: "uppercase",
          color: "#7394c9",
          marginBottom: 12
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 38,
          lineHeight: 1,
          fontWeight: 950,
          color
        }}
      >
        {fmt(value)}
        <span
          style={{
            fontSize: 16,
            marginLeft: 8,
            color: "#95add1",
            fontWeight: 800
          }}
        >
          Mbps
        </span>
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "#8ea6cd"
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function MiniStat({ title, value, accent, sub }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 16,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.016) 100%)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#6786b9",
          marginBottom: 8
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: "#89a4cd", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function PressureBar({ value, cap }) {
  const pct = util(value, cap);

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#7393c4"
          }}
        >
          Capacity Pressure
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#96f0ff" }}>{pct}%</div>
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
            width: pct + "%",
            height: "100%",
            borderRadius: 999,
            background:
              pct >= 90
                ? "linear-gradient(90deg, #ffbed0 0%, #ff5d97 100%)"
                : pct >= 70
                ? "linear-gradient(90deg, #ffe189 0%, #ffbc43 100%)"
                : "linear-gradient(90deg, #7ff2ff 0%, #35c8ff 100%)",
            boxShadow: "0 0 24px rgba(53,200,255,0.45)"
          }}
        />
      </div>
    </div>
  );
}

function LinkMiniGraph({ history, totalKey, txKey, txColor, totalColor, fillColor, peakLabel }) {
  const data = Array.isArray(history)
    ? history.map((row, i) => ({
        i,
        t: row?.t || "",
        total: num(row?.[totalKey]),
        tx: num(row?.[txKey])
      }))
    : [];

  return (
    <div
      style={{
        position: "relative",
        height: 118,
        marginBottom: 16,
        borderRadius: 22,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid rgba(255,255,255,0.075)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025), 0 14px 34px rgba(0,0,0,0.16)"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(4,12,28,0.62)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: totalColor, boxShadow: "0 0 10px " + totalColor }} />
        <span style={{ fontSize: 10, fontWeight: 900, color: "#d7e4fb", letterSpacing: 1 }}>LIVE TRAFFIC</span>
      </div>

      <div
        style={{
          position: "absolute",
          right: 12,
          top: 10,
          zIndex: 5,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(4,12,28,0.62)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 10,
          fontWeight: 900,
          color: "#e6efff"
        }}
      >
        Peak {peakLabel}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 10, left: 10, bottom: 8 }}>
          <defs>
            <linearGradient id={"fill_" + totalKey} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.52} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={"txfill_" + txKey} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={txColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={txColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis hide dataKey="i" />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.10)", strokeDasharray: "4 5" }}
            contentStyle={{
              background: "rgba(5,12,26,0.96)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.t || ""}
            formatter={(value, name) => [fmt(value) + " Mbps", String(name).toUpperCase()]}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke={totalColor}
            fill={"url(#fill_" + totalKey + ")"}
            strokeWidth={2.3}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 3.5, fill: totalColor, stroke: "#fff", strokeWidth: 0.5 }}
          />

          <Area
            type="monotone"
            dataKey="tx"
            stroke={txColor}
            fill={"url(#txfill_" + txKey + ")"}
            strokeWidth={1.8}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 3, fill: txColor, stroke: "#fff", strokeWidth: 0.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LinkPanel({ card, history, totalKey, txKey, totalColor, txColor, fillColor }) {
  if (!card) return null;

  const tone = toneFromValue(card.totalMbps, card.cap);
  const pct = util(card.totalMbps, card.cap);

  const avg = Array.isArray(history) && history.length
    ? history.reduce((s, row) => s + num(row?.[totalKey]), 0) / history.length
    : 0;

  const peak = Array.isArray(history)
    ? history.reduce((m, row) => Math.max(m, num(row?.[totalKey])), 0)
    : 0;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 30,
        padding: 24,
        minHeight: 430,
        background:
          "radial-gradient(circle at 15% 0%, rgba(131,84,255,0.14) 0%, rgba(131,84,255,0) 32%)," +
          "radial-gradient(circle at 100% 100%, rgba(0,214,255,0.12) 0%, rgba(0,214,255,0) 34%)," +
          "linear-gradient(180deg, rgba(6,18,43,0.96) 0%, rgba(2,10,24,0.98) 100%)",
        border: "1px solid " + tone.border,
        boxShadow:
          "0 26px 65px rgba(0,0,0,0.28)," +
          "inset 0 1px 0 rgba(255,255,255,0.035)," +
          "inset 0 0 0 1px rgba(255,255,255,0.02)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.00) 26%, rgba(255,255,255,0.00) 74%, rgba(255,255,255,0.03) 100%)"
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#6f8dc0",
              marginBottom: 10
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              fontSize: 23,
              lineHeight: 1.15,
              fontWeight: 950,
              color: "#f4f8ff",
              letterSpacing: -0.4
            }}
          >
            {card.subtitle}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              color: "#8ba7cf",
              lineHeight: 1.5
            }}
          >
            {card.meta}
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "11px 15px",
            borderRadius: 999,
            border: "1px solid " + tone.border,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "0 0 26px " + tone.soft,
            color: tone.text,
            fontWeight: 950,
            fontSize: 13,
            letterSpacing: 1
          }}
        >
          {tone.label}
        </div>
      </div>

      <LinkMiniGraph
        history={history}
        totalKey={totalKey}
        txKey={txKey}
        totalColor={totalColor}
        txColor={txColor}
        fillColor={fillColor}
        peakLabel={fmt(peak)}
      />

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14
        }}
      >
        {[
          {
            label: "RX",
            value: fmt(card.rxMbps),
            accent: "#85efff",
            sub: "Inbound path load"
          },
          {
            label: "TX",
            value: fmt(card.txMbps),
            accent: "#82ffbe",
            sub: "Outbound path load"
          },
          {
            label: "TOTAL",
            value: fmt(card.totalMbps),
            accent: "#d5c0ff",
            sub: "Capacity " + (card.cap >= 1000 ? (card.cap / 1000).toFixed(2) + " Gbps" : card.cap + " Mbps")
          }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 22,
              padding: 16,
              minHeight: 116,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.018) 100%)",
              border: "1px solid rgba(255,255,255,0.075)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.025)," +
                "0 14px 34px rgba(0,0,0,0.16)"
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.3,
                textTransform: "uppercase",
                color: "#6e8bbd",
                marginBottom: 12
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                fontSize: 24,
                lineHeight: 1,
                fontWeight: 1000,
                color: item.accent,
                letterSpacing: -0.4
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                lineHeight: 1.45,
                color: "#8aa4cb"
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 9
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.35,
              textTransform: "uppercase",
              color: "#7290c2"
            }}
          >
            Capacity Pressure
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <div style={{ fontSize: 12, color: "#8ba6cf", fontWeight: 800 }}>
              Avg {fmt(avg)}
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: tone.text,
                boxShadow: "0 0 14px " + tone.text
              }}
            />
            <div
              style={{
                fontSize: 15,
                fontWeight: 950,
                color: tone.text
              }}
            >
              {pct}%
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            height: 14,
            borderRadius: 999,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.24)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 46px)",
              opacity: 0.45
            }}
          />

          <div
            style={{
              position: "relative",
              width: pct + "%",
              height: "100%",
              borderRadius: 999,
              background:
                pct >= 90
                  ? "linear-gradient(90deg, #ffc0d6 0%, #ff5c98 55%, #ff3f85 100%)"
                  : pct >= 70
                  ? "linear-gradient(90deg, #ffe289 0%, #ffc04b 55%, #ffab23 100%)"
                  : "linear-gradient(90deg, #86f4ff 0%, #43dbff 55%, #1db7ff 100%)",
              boxShadow:
                pct >= 90
                  ? "0 0 28px rgba(255,92,152,0.42)"
                  : pct >= 70
                  ? "0 0 28px rgba(255,192,75,0.34)"
                  : "0 0 28px rgba(67,219,255,0.36)"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.00) 26%, rgba(255,255,255,0.20) 52%, rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.22) 100%)",
                mixBlendMode: "screen"
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            color: "#84a0c8",
            fontSize: 12.5
          }}
        >
          <span>Live load vs provisioned capacity</span>
          <strong style={{ color: "#c7d7f3", fontWeight: 900 }}>
            {compactMbps(card.totalMbps)} / {compactMbps(card.cap)}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default function AviatWTM4200Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [firstPaint, setFirstPaint] = useState(true);

  useEffect(() => {
    let active = true;

    async function pull() {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        const json = await res.json();

        if (!active) return;

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "aviat live failed");
        }

        setSnapshot(json);
        setError("");

        const ts = Date.now();
        const parts = getParts(json);
        const cards = buildCards(json, parts);
        const combined = getCombined(json, cards);

        const point = {
          ts,
          t: shortTime(ts),
          total: num(combined.totalMbps),
          rx: num(combined.rxMbps),
          tx: num(combined.txMbps),
          uplink: num(cards?.uplink?.totalMbps),
          uplinkTx: num(cards?.uplink?.txMbps),
          switchA: num(cards?.switchA?.totalMbps),
          switchATx: num(cards?.switchA?.txMbps),
          switchB: num(cards?.switchB?.totalMbps),
          switchBTx: num(cards?.switchB?.txMbps)
        };

        setHistory((prev) => pushPoint(prev, point));
      } catch (e) {
        if (!active) return;
        setError(String(e?.message || e || "live poll failed"));
      } finally {
        if (active) setLoading(false);
      }
    }

    pull();
    const timer = setInterval(pull, POLL_MS);

    const animTimer = setTimeout(() => {
      if (active) setFirstPaint(false);
    }, 950);

    return () => {
      active = false;
      clearInterval(timer);
      clearTimeout(animTimer);
    };
  }, []);

  const parts = useMemo(() => getParts(snapshot), [snapshot]);
  const cards = useMemo(() => buildCards(snapshot, parts), [snapshot, parts]);
  const combined = useMemo(() => getCombined(snapshot, cards), [snapshot, cards]);
  const combinedTone = useMemo(
    () => toneFromValue(combined.totalMbps, CAPACITY.combined),
    [combined.totalMbps]
  );
  const liveTone = useMemo(() => statusTone(loading, error), [loading, error]);

  const latest = history[history.length - 1] || {
    t: "--:--:--",
    total: 0,
    rx: 0,
    tx: 0,
    uplink: 0,
    uplinkTx: 0,
    switchA: 0,
    switchATx: 0,
    switchB: 0,
    switchBTx: 0
  };

  const peakTotal = chartPeak(history, "total");
  const avgTotal = chartAvg(history, "total");
  const peakRx = chartPeak(history, "rx");
  const peakTx = chartPeak(history, "tx");

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "22px 22px 34px",
        color: "#eaf2ff",
        background:
          "radial-gradient(circle at 20% 0%, rgba(88,0,255,0.16) 0%, rgba(88,0,255,0) 30%)," +
          "radial-gradient(circle at 85% 12%, rgba(0,183,255,0.14) 0%, rgba(0,183,255,0) 28%)," +
          "linear-gradient(180deg, #020915 0%, #031022 48%, #020813 100%)"
      }}
    >
      <style>{`
        @keyframes aviatCenterBurst {
          0% {
            clip-path: inset(0 50% 0 50% round 28px);
            opacity: 0.28;
            transform: scaleX(0.88) scaleY(0.96);
            filter: saturate(0.8) blur(4px);
          }
          62% {
            clip-path: inset(0 12% 0 12% round 28px);
            opacity: 0.88;
            transform: scaleX(1.02) scaleY(1);
            filter: saturate(1.12) blur(0px);
          }
          100% {
            clip-path: inset(0 0 0 0 round 28px);
            opacity: 1;
            transform: scaleX(1) scaleY(1);
            filter: saturate(1) blur(0px);
          }
        }

        @keyframes aviatPulseDot {
          0% { transform: scale(1); opacity: 0.95; box-shadow: 0 0 0 0 rgba(93,255,180,0.48); }
          70% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 0 12px rgba(93,255,180,0); }
          100% { transform: scale(1); opacity: 0.95; box-shadow: 0 0 0 0 rgba(93,255,180,0); }
        }

        @keyframes aviatFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <div style={{ display: "grid", gap: 18 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.45,
                textTransform: "uppercase",
                color: "#6e8cc0",
                marginBottom: 10
              }}
            >
              AVIAT WTM4200 • LIVE GRAPHING SURFACE
            </div>

            <div
              style={{
                fontSize: 54,
                fontWeight: 1000,
                lineHeight: 0.98,
                letterSpacing: -1.8,
                color: "#f6fbff"
              }}
            >
              Brutal Live Traffic Matrix
            </div>

            <div
              style={{
                marginTop: 12,
                maxWidth: 1100,
                fontSize: 16,
                lineHeight: 1.65,
                color: "#8ca7cf"
              }}
            >
              Real-time Aviat transport graphing with center-burst reveal, neon layered area flow,
              and live 1-second polling over the existing uplink, switch A, and switch B telemetry.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 999,
              background: liveTone.bg,
              border: "1px solid " + liveTone.border,
              color: liveTone.text,
              fontWeight: 950,
              letterSpacing: 1.1,
              minWidth: 150,
              justifyContent: "center"
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                background: liveTone.text,
                display: "inline-block",
                animation: "aviatPulseDot 1.4s infinite"
              }}
            />
            {liveTone.label}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Pill label="Mode" value="Aviat WTM4200 Live" accent="#8fe9ff" />
          <Pill label="Device" value="155.15.59.4" accent="#93d8ff" />
          <Pill label="Polling" value={String(POLL_MS / 1000) + "s"} accent="#7effb5" />
          <Pill label="Points" value={String(history.length) + " / " + MAX_POINTS} accent="#d7c0ff" />
          <Pill label="Last Update" value={latest.t} accent="#a6ffd5" />
          <Pill label="Status" value={combinedTone.label} accent={combinedTone.text} />
        </div>

        <div
          style={{
            borderRadius: 32,
            padding: 22,
            background:
              "linear-gradient(180deg, rgba(5,16,38,0.88) 0%, rgba(3,10,25,0.98) 100%)",
            border: "1px solid rgba(90,131,205,0.22)",
            boxShadow: "0 34px 90px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.03)"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.65fr) minmax(320px, 0.85fr)",
              gap: 18,
              alignItems: "stretch"
            }}
          >
            <div
              style={{
                borderRadius: 28,
                overflow: "hidden",
                padding: 18,
                minHeight: 460,
                background:
                  "radial-gradient(circle at 50% 0%, rgba(130,64,255,0.12) 0%, rgba(130,64,255,0) 32%)," +
                  "radial-gradient(circle at 50% 100%, rgba(0,214,255,0.10) 0%, rgba(0,214,255,0) 34%)," +
                  "linear-gradient(180deg, rgba(9,21,48,0.96) 0%, rgba(5,13,28,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                position: "relative"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 16
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 1.35,
                      textTransform: "uppercase",
                      color: "#6e8ec2",
                      marginBottom: 8
                    }}
                  >
                    Combined Live Graph
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 950,
                      lineHeight: 1.08,
                      color: "#f3f7ff"
                    }}
                  >
                    Neon Area Traffic Flow
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: combinedTone.soft,
                    border: "1px solid " + combinedTone.border,
                    color: combinedTone.text,
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  {util(combined.totalMbps, CAPACITY.combined)}% LOAD
                </div>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  height: 360,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.012) 100%)",
                  animation: firstPaint ? "aviatCenterBurst 0.95s cubic-bezier(.2,.8,.2,1) both" : "none"
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history}
                    margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="aviatTotalStroke" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#c996ff" />
                        <stop offset="100%" stopColor="#7f52ff" />
                      </linearGradient>

                      <linearGradient id="aviatTotalFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(173,110,255,0.70)" />
                        <stop offset="45%" stopColor="rgba(123,77,255,0.28)" />
                        <stop offset="100%" stopColor="rgba(123,77,255,0.02)" />
                      </linearGradient>

                      <linearGradient id="aviatRxStroke" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#71f2ff" />
                        <stop offset="100%" stopColor="#18b6ff" />
                      </linearGradient>

                      <linearGradient id="aviatRxFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(93,240,255,0.50)" />
                        <stop offset="50%" stopColor="rgba(34,165,255,0.20)" />
                        <stop offset="100%" stopColor="rgba(34,165,255,0.02)" />
                      </linearGradient>

                      <linearGradient id="aviatTxStroke" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#76ffc7" />
                        <stop offset="100%" stopColor="#19df95" />
                      </linearGradient>

                      <linearGradient id="aviatTxFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(96,255,196,0.36)" />
                        <stop offset="55%" stopColor="rgba(25,223,149,0.16)" />
                        <stop offset="100%" stopColor="rgba(25,223,149,0.02)" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="rgba(136,167,224,0.10)" vertical={false} />
                    <XAxis
                      dataKey="t"
                      tick={{ fill: "#6e8dbd", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      tick={{ fill: "#6e8dbd", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                    />

                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.10)", strokeDasharray: "5 6" }}
                      contentStyle={{
                        background: "rgba(5,12,26,0.96)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 16,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.35)"
                      }}
                      labelStyle={{ color: "#dbe8ff", fontWeight: 900 }}
                      formatter={(value, name) => [fmt(value) + " Mbps", String(name).toUpperCase()]}
                    />

                    <ReferenceLine
                      y={avgTotal}
                      stroke="rgba(255,255,255,0.12)"
                      strokeDasharray="4 6"
                    />

                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="url(#aviatTotalStroke)"
                      fill="url(#aviatTotalFill)"
                      strokeWidth={3}
                      fillOpacity={1}
                      dot={false}
                      activeDot={{ r: 4, stroke: "#fff", strokeWidth: 0.5, fill: "#b278ff" }}
                      animationDuration={550}
                      isAnimationActive
                    />

                    <Area
                      type="monotone"
                      dataKey="rx"
                      stroke="url(#aviatRxStroke)"
                      fill="url(#aviatRxFill)"
                      strokeWidth={2.4}
                      fillOpacity={1}
                      dot={false}
                      activeDot={{ r: 4, stroke: "#fff", strokeWidth: 0.5, fill: "#45dbff" }}
                      animationDuration={650}
                      isAnimationActive
                    />

                    <Area
                      type="monotone"
                      dataKey="tx"
                      stroke="url(#aviatTxStroke)"
                      fill="url(#aviatTxFill)"
                      strokeWidth={2.1}
                      fillOpacity={1}
                      dot={false}
                      activeDot={{ r: 4, stroke: "#fff", strokeWidth: 0.5, fill: "#48ffb0" }}
                      animationDuration={720}
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 12
                }}
              >
                <MiniStat
                  title="Peak Total"
                  value={compactMbps(peakTotal)}
                  accent="#d2b8ff"
                  sub="Highest combined burst"
                />
                <MiniStat
                  title="Average"
                  value={compactMbps(avgTotal)}
                  accent="#8feaff"
                  sub="Windowed total average"
                />
                <MiniStat
                  title="Peak RX"
                  value={compactMbps(peakRx)}
                  accent="#71efff"
                  sub="Inbound ceiling"
                />
                <MiniStat
                  title="Peak TX"
                  value={compactMbps(peakTx)}
                  accent="#7effb9"
                  sub="Outbound ceiling"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                alignContent: "start"
              }}
            >
              <MetricCard
                label="Combined Total"
                value={combined.totalMbps}
                color="#d7c1ff"
                hint="Primary aggregate transport throughput"
              />

              <MetricCard
                label="Combined RX"
                value={combined.rxMbps}
                color="#87eeff"
                hint="Inbound aggregated load"
              />

              <MetricCard
                label="Combined TX"
                value={combined.txMbps}
                color="#83ffbe"
                hint="Outbound aggregated load"
              />

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)",
                  border: "1px solid rgba(255,255,255,0.075)",
                  animation: "aviatFloat 3.2s ease-in-out infinite"
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.3,
                    textTransform: "uppercase",
                    color: "#7392bf",
                    marginBottom: 10
                  }}
                >
                  Telemetry Pulse
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#9bb3d8", fontSize: 14 }}>
                    <span>Engine</span>
                    <strong style={{ color: "#f1f7ff" }}>{error ? "Partial" : "Stable"}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#9bb3d8", fontSize: 14 }}>
                    <span>Polling Interval</span>
                    <strong style={{ color: "#f1f7ff" }}>{POLL_MS / 1000}s</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#9bb3d8", fontSize: 14 }}>
                    <span>Live Window</span>
                    <strong style={{ color: "#f1f7ff" }}>{MAX_POINTS}s</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#9bb3d8", fontSize: 14 }}>
                    <span>Last Tick</span>
                    <strong style={{ color: "#f1f7ff" }}>{latest.t}</strong>
                  </div>
                </div>

                <PressureBar value={combined.totalMbps} cap={CAPACITY.combined} />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16
          }}
        >
          <LinkPanel
            card={cards.uplink}
            history={history}
            totalKey="uplink"
            txKey="uplinkTx"
            totalColor="#7eeeff"
            txColor="#7effbc"
            fillColor="#45d7ff"
          />
          <LinkPanel
            card={cards.switchB}
            history={history}
            totalKey="switchB"
            txKey="switchBTx"
            totalColor="#c79cff"
            txColor="#7effbc"
            fillColor="#9b68ff"
          />
          <LinkPanel
            card={cards.switchA}
            history={history}
            totalKey="switchA"
            txKey="switchATx"
            totalColor="#7effbc"
            txColor="#7eeeff"
            fillColor="#29e39a"
          />
        </div>
      </div>
    </div>
  );
}
