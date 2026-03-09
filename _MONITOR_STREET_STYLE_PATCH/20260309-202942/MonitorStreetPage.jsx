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
  const x = n(v);
  return x.toFixed(2) + " Mbps";
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

function pathForGauge(value, maxValue) {
  const startDeg = -210;
  const endDeg = 30;
  const span = endDeg - startDeg;

  const pct = clamp(maxValue > 0 ? value / maxValue : 0, 0, 1);
  const segments = 24;
  const active = Math.round(segments * pct);
  const r = 86;
  const cx = 120;
  const cy = 120;

  const out = [];

  for (let i = 0; i < segments; i++) {
    const a1 = (startDeg + (span * i / segments)) * Math.PI / 180;
    const a2 = (startDeg + (span * (i + 0.72) / segments)) * Math.PI / 180;

    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const x2 = cx + Math.cos(a2) * r;
    const y2 = cy + Math.sin(a2) * r;

    out.push({
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      active: i < active,
      i
    });
  }

  return out;
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

          if (!res.ok || !js?.ok) {
            throw new Error(js?.error || `HTTP ${res.status}`);
          }

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

          if (!res.ok || !js?.ok) {
            throw new Error(js?.error || `HTTP ${res.status}`);
          }

          const alive = !!js?.alive;
          const timeMs = Number.isFinite(Number(js?.timeMs)) ? Number(js.timeMs) : null;

          const prev = prevPingRef.current.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + (alive ? 0 : 1);
          prevPingRef.current.set(t.id, { total, loss });

          const packetLoss = total > 0 ? (loss * 100 / total) : 0;

          return {
            id: t.id,
            pingMs: alive ? timeMs : null,
            packetLoss
          };
        } catch {
          const prev = prevPingRef.current.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + 1;
          prevPingRef.current.set(t.id, { total, loss });

          const packetLoss = total > 0 ? (loss * 100 / total) : 100;

          return {
            id: t.id,
            pingMs: null,
            packetLoss
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

    const trafficTimer = setInterval(loadTraffic, 2200);
    const pingTimer = setInterval(loadPing, 2500);

    return () => {
      dead = true;
      clearInterval(trafficTimer);
      clearInterval(pingTimer);
    };
  }, []);

  return rows;
}

function StreetGaugeCard({ row }) {
  const total = n(row.totalMbps);
  const rx = n(row.rxMbps);
  const tx = n(row.txMbps);
  const loss = n(row.packetLoss);
  const pingText = fmtPingText(row.pingMs, loss);
  const tone = toneByTraffic(total);
  const segs = useMemo(() => pathForGauge(total, 260), [total]);

  return (
    <div className={`ms-card is-${tone} ${loss > 0 ? "is-loss" : ""}`}>
      <div className="ms-card__glow" />

      <div className="ms-gaugeWrap">
        <svg viewBox="0 0 240 180" className="ms-gauge" aria-hidden="true">
          {segs.map(s => (
            <path
              key={s.i}
              d={s.d}
              className={`ms-gauge__seg ${s.active ? "is-active" : ""}`}
            />
          ))}
        </svg>

        <div className="ms-center">
          <div className="ms-name">{row.name}</div>
          <div className={`ms-ping ${loss > 0 ? "is-loss" : ""}`}>{pingText}</div>
        </div>

        <div className="ms-total">{fmtMbps(total)}</div>
      </div>

      <div className="ms-spark">
        <div className="ms-spark__line" />
        <div className="ms-spark__dot" />
      </div>

      <div className="ms-meta">
        <div className="ms-meta__item">
          <span className="ms-meta__label">RX</span>
          <strong className="ms-meta__value is-rx">{fmtMbps(rx)}</strong>
        </div>

        <div className="ms-meta__item">
          <span className="ms-meta__label">TX</span>
          <strong className="ms-meta__value is-tx">{fmtMbps(tx)}</strong>
        </div>

        <div className="ms-meta__item ms-meta__item--port">
          <span className="ms-meta__label">Port</span>
          <strong className="ms-meta__value">{row.port}</strong>
        </div>
      </div>
    </div>
  );
}

export default function MonitorStreetPage() {
  const rows = useStreetData();

  const totals = useMemo(() => {
    const total = rows.reduce((s, x) => s + n(x.totalMbps), 0);
    const lossing = rows.filter(x => n(x.packetLoss) > 0).length;
    return {
      total,
      links: rows.length,
      lossing
    };
  }, [rows]);

  return (
    <div className="ms-page">
      <section className="ms-hero">
        <div>
          <div className="ms-hero__eyebrow">Street live monitor</div>
          <div className="ms-hero__title">Monitor Street</div>
          <div className="ms-hero__sub">8 live traffic gauges with inline ping state and packet-loss alert animation.</div>
        </div>

        <div className="ms-stats">
          <div className="ms-stat">
            <span>Total traffic</span>
            <strong>{fmtMbps(totals.total)}</strong>
          </div>
          <div className="ms-stat">
            <span>Tracked links</span>
            <strong>{totals.links}</strong>
          </div>
          <div className={`ms-stat ${totals.lossing > 0 ? "is-loss" : ""}`}>
            <span>Loss alerts</span>
            <strong>{totals.lossing}</strong>
          </div>
        </div>
      </section>

      <section className="ms-grid">
        {rows.map(row => (
          <StreetGaugeCard key={row.id} row={row} />
        ))}
      </section>
    </div>
  );
}
