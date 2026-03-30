import React, { useMemo } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}

function buildSafeAlerts({ totals, ranked }) {
  const rows = [];
  const total = num(totals?.total);

  if (total >= 700) {
    rows.push({ level: "critical", text: `Traffic critical ${fmtMbps(total)}` });
  } else if (total >= 350) {
    rows.push({ level: "high", text: `Traffic high ${fmtMbps(total)}` });
  } else if (total >= 120) {
    rows.push({ level: "warn", text: `Traffic warning ${fmtMbps(total)}` });
  }

  const hot = Array.isArray(ranked)
    ? ranked.filter(x => num(x?.totalMbps) >= 150).slice(0, 3)
    : [];

  for (const row of hot) {
    rows.push({
      level: num(row?.totalMbps) >= 220 ? "high" : "warn",
      text: `${row?.name || row?.id || "Uplink"} load ${fmtMbps(row?.totalMbps)}`
    });
  }

  return rows.slice(0, 4);
}

export default function AlertsPanel({ totals, ranked }) {
  const alerts = useMemo(() => buildSafeAlerts({ totals, ranked }), [totals, ranked]);

  return (
    <div
      className="dashx-panel"
      style={{
        width: "100%",
        minHeight: 120,
        padding: 14,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(13,17,28,.96), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,.32), inset 0 0 30px rgba(255,255,255,.02)"
      }}
    >
      <div className="dashx-blockTitle">Alerts</div>
      <div className="dashx-blockSub" style={{ marginBottom: 12 }}>
        Safe dashboard classification
      </div>

      {alerts.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {alerts.map((a, i) => {
            const color =
              a.level === "critical"
                ? "#ff5f6d"
                : a.level === "high"
                ? "#ffb347"
                : "#ffd95e";

            return (
              <div
                key={`${a.text}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  color,
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)"
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: color,
                    boxShadow: `0 0 10px ${color}`
                  }}
                />
                <span>{a.text}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#7dff7a",
            padding: "8px 10px",
            borderRadius: 12,
            background: "rgba(125,255,122,.08)",
            border: "1px solid rgba(125,255,122,.16)"
          }}
        >
          All systems healthy
        </div>
      )}
    </div>
  );
}
