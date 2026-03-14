import React, { useEffect, useMemo, useState } from "react";

const LINKS = [

  // CORE
  { id: "core", name: "NOC Core", ip: "127.0.0.1", community: "public", ifIndex: 1, x: 50, y: 42 },

  // DISTRIBUTION (TOP)
  { id: "redwan", name: "Redwan", ip: "88.88.88.4", community: "public", ifIndex: 3, x: 18, y: 18 },
  { id: "fadel", name: "Fadel Center", ip: "88.88.88.5", community: "public", ifIndex: 4, x: 38, y: 14 },
  { id: "pharmacy", name: "Pharmacy", ip: "88.88.88.9", community: "public", ifIndex: 6, x: 62, y: 14 },
  { id: "c5c", name: "C5C", ip: "88.88.88.10", community: "public", ifIndex: 5, x: 82, y: 18 },

  // ACCESS (BOTTOM)
  { id: "davo", name: "Davo", ip: "88.88.88.15", community: "public", ifIndex: 5, x: 22, y: 72 },
  { id: "fastweb1", name: "FastWeb-1", ip: "10.88.88.111", community: "public", ifIndex: 6, x: 40, y: 76 },
  { id: "fastweb2", name: "FastWeb-2", ip: "10.88.88.111", community: "public", ifIndex: 2, x: 60, y: 76 },
  { id: "dalla", name: "Dalla", ip: "10.88.88.111", community: "public", ifIndex: 3, x: 78, y: 72 }

];

const EDGES = [
  ["redwan", "fadel"],
  ["fadel", "pharmacy"],
  ["pharmacy", "c5c"],
  ["redwan", "davo"],
  ["davo", "fastweb1"],
  ["fastweb1", "fastweb2"],
  ["fastweb2", "dalla"],
  ["fadel", "fastweb1"],
  ["pharmacy", "fastweb2"]
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function fmtPing(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) + " ms" : "timeout";
}

function toneByTraffic(v) {
  const n = num(v);
  if (n >= 180) return "critical";
  if (n >= 110) return "high";
  if (n >= 45) return "warn";
  return "healthy";
}

function useMapData() {
  const [rows, setRows] = useState(() =>
    LINKS.map(x => ({
      ...x,
      rxMbps: 0,
      txMbps: 0,
      totalMbps: 0,
      pingMs: null,
      alive: false,
      packetLoss: 0
    }))
  );

  useEffect(() => {
    let dead = false;
    const pingState = new Map();

    async function loadTraffic() {
      try {
        const res = await fetch("/api/eth/snapshot", { cache: "no-store" });
        const js = await res.json();

        if (!res.ok || !js?.ok || !Array.isArray(js?.data)) {
          throw new Error(js?.error || `HTTP ${res.status}`);
        }

        const byId = new Map(
          js.data.map((row) => [String(row?.id || "").toLowerCase(), row])
        );

        const next = LINKS.map((t) => {
          const row = js.data.find(x => x.ip === t.ip);

          const rx = num(row?.rxMbps);
          const tx = num(row?.txMbps);

          return {
            id: t.id,
            rxMbps: rx,
            txMbps: tx,
            totalMbps: rx + tx
          };
        });

        if (dead) return;

        setRows(prev => prev.map(r => {
          const m = next.find(x => x.id === r.id);
          return m ? { ...r, ...m } : r;
        }));
      } catch (e) {
        console.error("NetworkMap loadTraffic failed:", e?.message || e);

        if (dead) return;

        setRows(prev => prev.map(r => ({
          ...r,
          rxMbps: 0,
          txMbps: 0,
          totalMbps: 0
        })));
      }
    }

    async function loadPing() {
      const next = await Promise.all(LINKS.map(async (t) => {
        try {
          const url = `/api/ping/once?ip=${encodeURIComponent(t.ip)}`;
          const res = await fetch(url, { cache: "no-store" });
          const js = await res.json();

          if (!res.ok || !js?.ok) throw new Error(js?.error || `HTTP ${res.status}`);

          const alive = !!js?.alive;
          const timeMs = Number.isFinite(Number(js?.timeMs)) ? Number(js.timeMs) : null;

          const prev = pingState.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + (alive ? 0 : 1);
          pingState.set(t.id, { total, loss });

          return {
            id: t.id,
            alive,
            pingMs: alive ? timeMs : null,
            packetLoss: total > 0 ? (loss * 100 / total) : 0
          };
        } catch {
          const prev = pingState.get(t.id) || { total: 0, loss: 0 };
          const total = prev.total + 1;
          const loss = prev.loss + 1;
          pingState.set(t.id, { total, loss });

          return {
            id: t.id,
            alive: false,
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
    const t2 = setInterval(loadPing, 2600);

    return () => {
      dead = true;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return rows;
}

export default function NetworkMapPage() {
  const rows = useMapData();

  const byId = useMemo(() => {
    const m = new Map();
    for (const r of rows) m.set(r.id, r);
    return m;
  }, [rows]);

  const stats = useMemo(() => {
    const total = rows.reduce((s, x) => s + num(x.totalMbps), 0);
    const up = rows.filter(x => x.alive).length;
    const alert = rows.filter(x => num(x.packetLoss) > 0).length;
    return { total, up, alert };
  }, [rows]);

  return (
    <div className="nmap-page">
      <section className="nmap-hero">
        <div>
          <div className="nmap-hero__eyebrow">Topology live view</div>
          <div className="nmap-hero__title">Network Map</div>
          <div className="nmap-hero__sub">
            Live ISP map for your 8 monitored links with traffic and ping state.
          </div>
        </div>

        <div className="nmap-hero__stats">
          <div className="nmap-stat">
            <span>Total traffic</span>
            <strong>{fmtMbps(stats.total)}</strong>
          </div>
          <div className="nmap-stat">
            <span>Alive nodes</span>
            <strong>{stats.up} / {rows.length}</strong>
          </div>
          <div className={"nmap-stat " + (stats.alert > 0 ? "is-alert" : "")}>
            <span>Loss alerts</span>
            <strong>{stats.alert}</strong>
          </div>
        </div>
      </section>

      <section className="nmap-board">
        {EDGES.map(([a, b], i) => {
          const A = byId.get(a);
          const B = byId.get(b);
          if (!A || !B) return null;

          const mx = (A.x + B.x) / 2;
          const my = (A.y + B.y) / 2;
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const len = Math.sqrt((dx * dx) + (dy * dy));
          const ang = Math.atan2(dy, dx) * 180 / Math.PI;
          const active = A.alive && B.alive;
          const hot = num(A.totalMbps) > 120 || num(B.totalMbps) > 120;

          return (
            <div
              key={i}
              className={`nmap-edge ${active ? "is-up" : "is-down"} ${hot ? "is-hot" : ""}`}
              style={{
                left: `${mx}%`,
                top: `${my}%`,
                width: `${len}%`,
                transform: `translate(-50%, -50%) rotate(${ang}deg)`
              }}
            />
          );
        })}

        {rows.map((row) => {
          const tone = toneByTraffic(row.totalMbps);
          const loss = num(row.packetLoss);

          return (
            <div
              key={row.id}
              className={`nmap-node is-${tone} ${row.alive ? "is-up" : "is-down"} ${loss > 0 ? "is-loss" : ""}`}
              style={{ left: `${row.x}%`, top: `${row.y}%` }}
            >
              <div className="nmap-node__dot" />
              <div className="nmap-node__card">
                <div className="nmap-node__name">{row.name}</div>
                <div className="nmap-node__traffic">{fmtMbps(row.totalMbps)}</div>
                <div className={`nmap-node__ping ${loss > 0 ? "is-loss" : ""}`}>
                  {fmtPing(row.pingMs)}
                  {loss > 0 ? ` • PL ${Math.round(loss)}%` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}






