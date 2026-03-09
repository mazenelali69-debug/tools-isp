import React, { useEffect, useMemo, useRef, useState } from "react";

const TARGETS = [
  { id: "redwan",       name: "Redwan",       ip: "88.88.88.4",   community: "public", ifIndex: 3, port: "ether2" },
  { id: "fadelcenter",  name: "Fadel Center", ip: "88.88.88.5",   community: "public", ifIndex: 4, port: "ether3" },
  { id: "pharmacy",     name: "Pharmacy",     ip: "88.88.88.9",   community: "public", ifIndex: 6, port: "ether5" },
  { id: "c5c",          name: "C5C",          ip: "88.88.88.10",  community: "public", ifIndex: 5, port: "ether4" },
  { id: "davo",         name: "Davo",         ip: "88.88.88.15",  community: "public", ifIndex: 5, port: "ether4" },
  { id: "fastweb1",     name: "FastWeb-1",    ip: "10.88.88.111", community: "public", ifIndex: 6, port: "ether1" },
  { id: "fastweb2",     name: "FastWeb-2",    ip: "10.88.88.111", community: "public", ifIndex: 2, port: "ether2" },
  { id: "dalla",        name: "Dalla",        ip: "10.88.88.111", community: "public", ifIndex: 3, port: "ether3" }
];

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function fmtMbps(v) {
  return n(v).toFixed(2) + " Mbps";
}

function fmtMeta(v) {
  return n(v).toFixed(2) + " Mbps";
}

function fmtPingText(ping, loss) {
  if (loss >= 100) return "timeout";
  if (loss > 0) {
    const ms = Number.isFinite(ping) ? ` • ${Math.round(ping)} ms` : "";
    return `PL ${Math.round(loss)}%${ms}`;
  }
  if (Number.isFinite(ping)) return `${Math.round(ping)} ms`;
  return "—";
}

function toneByTraffic(total) {
  if (total >= 180) return "critical";
  if (total >= 110) return "high";
  if (total >= 45) return "warn";
  return "good";
}

function colorBySegmentIndex(i, totalSegments) {
  const p = i / Math.max(1, totalSegments - 1);
  if (p < 0.55) return "#72ff7d";
  if (p < 0.78) return "#caff59";
  return "#ffbe4b";
}

function buildGauge(total, maxValue = 260) {
  const value = clamp(n(total), 0, maxValue);
  const startDeg = -205;
  const endDeg = 25;
  const span = endDeg - startDeg;

  const segments = 28;
  const activeCount = Math.round((value / maxValue) * segments);

  const r = 86;
  const cx = 120;
  const cy = 118;

  const items = [];

  for (let i = 0; i < segments; i++) {
    const fromDeg = startDeg + (span * i / segments);
    const toDeg = startDeg + (span * (i + 0.58) / segments);

    const a1 = (fromDeg - 90) * Math.PI / 180;
    const a2 = (toDeg - 90) * Math.PI / 180;

    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const x2 = cx + Math.cos(a2) * r;
    const y2 = cy + Math.sin(a2) * r;

    items.push({
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      active: i < activeCount,
      color: colorBySegmentIndex(i, segments),
      i
    });
  }

  const ticks = [
    { label: "30",  deg: -162 },
    { label: "60",  deg: -129 },
    { label: "90",  deg: -94 },
    { label: "120", deg: -57 },
    { label: "160", deg: -20 },
    { label: "200", deg: 22 },
    { label: "260", deg: 62 }
  ].map((t, idx) => {
    const tr = 108;
    const a = (t.deg - 90) * Math.PI / 180;
    return {
      key: idx,
      x: 120 + Math.cos(a) * tr,
      y: 118 + Math.sin(a) * tr,
      label: t.label
    };
  });

  return { segments: items, ticks };
}

function useStreetData() {
  const [rows, setRows] = useState(() =>
    TARGETS.map(t => ({
      ...t,
      rxMbps: 0,
      txMbps: 0,
      totalMbps: 0,
      pingMs: null,
      packetLoss: 0,
      ok: true,
      lastTs: null
    }))
  );

  const prevPingRef = useRef(new Map());

  useEffect(() => {
    let dead = false;

    async function loadTraffic() {
      const next = await Promise.all(TARGETS.map(async (t) => {
        try {
          const url = `/api/eth/throughput?ip=${encodeURIComponent(t.ip)}&community=${encodeURIComponent(t.community)}&ifIndex=${encodeURIComponent(t.ifIndex)}&ms=800`;
          const res = await fetch(url, { cache: "no-store" });
          const js = await res.json();

          if (!res.ok || !js?.ok) throw new Error(js?.error || `HTTP ${res.status}`);

          const rx = n(js?.rxMbps);
          const tx = n(js?.txMbps);

          return {
            id: t.id,
            rxMbps: rx,
            txMbps: tx,
            totalMbps: rx + tx,
            ok: true
          };
        } catch {
          return {
            id: t.id,
            rxMbps: 0,
            txMbps: 0,
            totalMbps: 0,
            ok: false
          };
        }
      }));

      if (dead) return;

      setRows(prev => prev.map(r => {
        const m = next.find(x => x.id === r.id);
        return m ? { ...r, ...m, lastTs: Date.now() } : r;
      }));
    }

    async function loadPing() {
      const next = await Promise.all(TARGETS.map(async (t) => {
        try {
          const url = `/api/ping/once?ip=${encodeURIComponent(t.ip)}`;
          const res = await fetch(url, { cache: "no-store" });
          const js = await res.json();

          if (!res.ok || !js?.ok) throw new Error(js?.error || `HTTP ${res.status}`);

          const alive = !!js?.alive;
          const timeMs = Number.isFinite(Number(js?.timeMs)) ? Number(js.timeMs) : null;

          const prev = prevPingRef.current.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + (alive ? 0 : 1);
          prevPingRef.current.set(t.id, { total, loss });

          return {
            id: t.id,
            pingMs: alive ? timeMs : null,
            packetLoss: total > 0 ? (loss * 100 / total) : 0
          };
        } catch {
          const prev = prevPingRef.current.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + 1;
          prevPingRef.current.set(t.id, { total, loss });

          return {
            id: t.id,
            pingMs: null,
            packetLoss: total > 0 ? (loss * 100 / total) : 100
          };
        }
      }));

      if (dead) return;

      setRows(prev => prev.map(r => {
        const m = next.find(x => x.id === r.id);
        return m ? { ...r, ...m } : r;
      }));
    }

    loadTraffic();
    loadPing();

    const t1 = setInterval(loadTraffic, 2200);
    const t2 = setInterval(loadPing, 2500);

    return () => {
      dead = true;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return rows;
}

function StreetGaugeCard({ row }) {
  const total = n(row.totalMbps);
  const rx = n(row.rxMbps);
  const tx = n(row.txMbps);
  const loss = n(row.packetLoss);
  const tone = toneByTraffic(total);
  const pingText = fmtPingText(row.pingMs, loss);
  const gauge = useMemo(() => buildGauge(total, 260), [total]);

  return (
    <div className={`ms3-card is-${tone} ${loss > 0 ? "is-loss" : ""}`}>
      <div className="ms3-card__bg" />

      <div className="ms3-gaugeWrap">
        <svg viewBox="0 0 240 210" className="ms3-gauge" aria-hidden="true">
          {gauge.ticks.map(t => (
            <text
              key={t.key}
              x={t.x}
              y={t.y}
              className="ms3-tick"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {t.label}
            </text>
          ))}

          {gauge.segments.map(seg => (
            <path
              key={seg.i}
              d={seg.d}
              className={`ms3-seg ${seg.active ? "is-active" : ""}`}
              style={seg.active ? { stroke: seg.color } : undefined}
            />
          ))}
        </svg>

        <div className="ms3-center">
          <div className="ms3-name">{row.name}</div>
          <div className={`ms3-ping ${loss > 0 ? "is-loss" : ""}`}>{pingText}</div>
        </div>

        <div className="ms3-total">{fmtMbps(total)}</div>
      </div>

      <div className="ms3-neon">
        <div className="ms3-neon__line" />
        <div className="ms3-neon__dot" />
      </div>

      <div className="ms3-meta">
        <div className="ms3-meta__col">
          <div className="ms3-meta__label">RX</div>
          <div className="ms3-meta__value is-rx">{fmtMeta(rx)}</div>
        </div>

        <div className="ms3-meta__col">
          <div className="ms3-meta__label">TX</div>
          <div className="ms3-meta__value is-tx">{fmtMeta(tx)}</div>
        </div>

        <div className="ms3-meta__col is-right">
          <div className="ms3-meta__label">Port</div>
          <div className="ms3-meta__value">{row.port}</div>
        </div>
      </div>
    </div>
  );
}

export default function MonitorStreetPage() {
  const rows = useStreetData();

  return (
    <div className="ms3-page">
      <section className="ms3-grid">
        {rows.map((row) => (
          <StreetGaugeCard key={row.id} row={row} />
        ))}
      </section>
    </div>
  );
}
