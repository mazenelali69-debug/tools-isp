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
  return n(v).toFixed(2);
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

function describeArc(value, max) {
  const pct = clamp(max > 0 ? value / max : 0, 0, 1);

  const startDeg = -205;
  const endDeg = 25;
  const activeDeg = startDeg + ((endDeg - startDeg) * pct);

  const r = 84;
  const cx = 120;
  const cy = 120;

  function polar(deg) {
    const a = (deg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a)
    };
  }

  const s = polar(startDeg);
  const e = polar(endDeg);
  const m = polar(activeDeg);

  const bigAll = (endDeg - startDeg) > 180 ? 1 : 0;
  const bigActive = (activeDeg - startDeg) > 180 ? 1 : 0;

  const bg = `M ${s.x} ${s.y} A ${r} ${r} 0 ${bigAll} 1 ${e.x} ${e.y}`;
  const fg = `M ${s.x} ${s.y} A ${r} ${r} 0 ${bigActive} 1 ${m.x} ${m.y}`;

  return { bg, fg, pct };
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
  const arc = useMemo(() => describeArc(total, 260), [total]);

  return (
    <div className={`ms2-card is-${tone} ${loss > 0 ? "is-loss" : ""}`}>
      <div className="ms2-card__bg" />

      <div className="ms2-gaugeBox">
        <svg viewBox="0 0 240 180" className="ms2-gauge" aria-hidden="true">
          <path d={arc.bg} className="ms2-gauge__bg" />
          <path d={arc.fg} className="ms2-gauge__fg" />
        </svg>

        <div className="ms2-center">
          <div className="ms2-name">{row.name}</div>
          <div className={`ms2-ping ${loss > 0 ? "is-loss" : ""}`}>{pingText}</div>
        </div>

        <div className="ms2-total">{fmtMbps(total)}</div>
      </div>

      <div className="ms2-neon">
        <div className="ms2-neon__line" />
        <div className="ms2-neon__dot" />
      </div>

      <div className="ms2-meta">
        <div className="ms2-meta__col">
          <div className="ms2-meta__label">RX</div>
          <div className="ms2-meta__value is-rx">{fmtMeta(rx)}</div>
        </div>

        <div className="ms2-meta__col">
          <div className="ms2-meta__label">TX</div>
          <div className="ms2-meta__value is-tx">{fmtMeta(tx)}</div>
        </div>

        <div className="ms2-meta__col is-right">
          <div className="ms2-meta__label">Port</div>
          <div className="ms2-meta__value">{row.port}</div>
        </div>
      </div>
    </div>
  );
}

export default function MonitorStreetPage() {
  const rows = useStreetData();

  return (
    <div className="ms2-page">
      <section className="ms2-grid">
        {rows.map((row) => (
          <StreetGaugeCard key={row.id} row={row} />
        ))}
      </section>
    </div>
  );
}
