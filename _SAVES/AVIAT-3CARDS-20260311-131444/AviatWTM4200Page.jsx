import React, { useEffect, useMemo, useState } from "react";

function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function toneFor(total) {
  const v = Number(total) || 0;
  if (v >= 800) return { bg: "rgba(255,107,129,0.12)", bd: "rgba(255,107,129,0.28)", tx: "#ff9cad" };
  if (v >= 400) return { bg: "rgba(247,201,72,0.12)", bd: "rgba(247,201,72,0.28)", tx: "#ffe08a" };
  return { bg: "rgba(53,242,161,0.12)", bd: "rgba(53,242,161,0.24)", tx: "#9cffd6" };
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 22,
      background: accent?.bg || "rgba(255,255,255,0.03)",
      border: `1px solid ${accent?.bd || "rgba(255,255,255,0.08)"}`,
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
        fontWeight: 800,
        color: accent?.tx || "#fff"
      }}>
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 8, color: "#a9bfdc", fontSize: 13 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function MetricPill({ label, value, color }) {
  return (
    <div style={{
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: color || "#dbe7ff",
      fontSize: 13,
      fontWeight: 700
    }}>
      {label}: {value}
    </div>
  );
}

function rowFromAny(obj, fallbackName) {
  if (!obj || typeof obj !== "object") return null;

  const rx = Number(
    obj.rxMbps ?? obj.rx_mbps ?? obj.rx ?? obj.inMbps ?? obj.in_mbps ?? 0
  );
  const tx = Number(
    obj.txMbps ?? obj.tx_mbps ?? obj.tx ?? obj.outMbps ?? obj.out_mbps ?? 0
  );
  const total = Number(
    obj.totalMbps ?? obj.total_mbps ?? obj.total ?? (rx + tx)
  );

  return {
    name:
      obj.name ||
      obj.label ||
      obj.title ||
      obj.key ||
      obj.ifName ||
      fallbackName ||
      "Interface",
    rxMbps: Number.isFinite(rx) ? rx : 0,
    txMbps: Number.isFinite(tx) ? tx : 0,
    totalMbps: Number.isFinite(total) ? total : ((Number.isFinite(rx) ? rx : 0) + (Number.isFinite(tx) ? tx : 0)),
    status: String(obj.status || (obj.ok === false ? "down" : "up")),
    details: obj
  };
}

function extractRows(data) {
  const candidates = [];

  if (Array.isArray(data?.parts)) candidates.push(...data.parts.map((x, i) => rowFromAny(x, `Part ${i + 1}`)));
  if (Array.isArray(data?.interfaces)) candidates.push(...data.interfaces.map((x, i) => rowFromAny(x, `Interface ${i + 1}`)));
  if (Array.isArray(data?.links)) candidates.push(...data.links.map((x, i) => rowFromAny(x, `Link ${i + 1}`)));
  if (Array.isArray(data?.items)) candidates.push(...data.items.map((x, i) => rowFromAny(x, `Item ${i + 1}`)));

  if (data?.partA || data?.partB) {
    if (data.partA) candidates.push(rowFromAny({ ...data.partA, name: data.partA.name || "Part A" }, "Part A"));
    if (data.partB) candidates.push(rowFromAny({ ...data.partB, name: data.partB.name || "Part B" }, "Part B"));
  }

  const rows = candidates.filter(Boolean);

  if (rows.length) return rows;

  if (data && typeof data === "object") {
    const top = rowFromAny(data, "Combined");
    if (top) return [top];
  }

  return [];
}

function extractCombined(data, rows) {
  const rx = Number(
    data?.combined?.rxMbps ??
    data?.rxMbps ??
    data?.combinedRx ??
    data?.traffic?.rxMbps
  );

  const tx = Number(
    data?.combined?.txMbps ??
    data?.txMbps ??
    data?.combinedTx ??
    data?.traffic?.txMbps
  );

  const total = Number(
    data?.combined?.totalMbps ??
    data?.totalMbps ??
    data?.combinedTotal ??
    ((Number.isFinite(rx) ? rx : 0) + (Number.isFinite(tx) ? tx : 0))
  );

  if (Number.isFinite(rx) || Number.isFinite(tx) || Number.isFinite(total)) {
    return {
      rxMbps: Number.isFinite(rx) ? rx : 0,
      txMbps: Number.isFinite(tx) ? tx : 0,
      totalMbps: Number.isFinite(total) ? total : 0
    };
  }

  return rows.reduce((acc, r) => {
    acc.rxMbps += Number(r.rxMbps) || 0;
    acc.txMbps += Number(r.txMbps) || 0;
    acc.totalMbps += Number(r.totalMbps) || 0;
    return acc;
  }, { rxMbps: 0, txMbps: 0, totalMbps: 0 });
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

  const rows = useMemo(() => extractRows(data), [data]);
  const combined = useMemo(() => extractCombined(data, rows), [data, rows]);
  const combinedTone = useMemo(() => toneFor(combined.totalMbps), [combined.totalMbps]);

  return (
    <div style={{
      minHeight: "100%",
      padding: 22,
      background:
        "radial-gradient(circle at top left, rgba(0,170,255,0.14), transparent 28%), radial-gradient(circle at top right, rgba(120,80,255,0.10), transparent 24%), linear-gradient(180deg, #07111f 0%, #040b16 100%)",
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
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05 }}>
          Live Radio Card
        </div>
        <div style={{ marginTop: 10, color: "#a8bddf", fontSize: 14 }}>
          Real-time traffic view from /api/aviatwtm4200/live
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 16
      }}>
        <StatCard
          label="Combined RX"
          value={fmt(combined.rxMbps) + " Mbps"}
          sub="Inbound aggregate"
          accent={{ bg:"rgba(37,200,255,0.10)", bd:"rgba(37,200,255,0.24)", tx:"#8fe9ff" }}
        />
        <StatCard
          label="Combined TX"
          value={fmt(combined.txMbps) + " Mbps"}
          sub="Outbound aggregate"
          accent={{ bg:"rgba(53,242,161,0.10)", bd:"rgba(53,242,161,0.24)", tx:"#9cffd6" }}
        />
        <StatCard
          label="Combined Total"
          value={fmt(combined.totalMbps) + " Mbps"}
          sub="Operational throughput"
          accent={combinedTone}
        />
        <StatCard
          label="Status"
          value={err ? "DEGRADED" : (loading ? "LOADING" : "LIVE")}
          sub={err ? err : ("Last update: " + (lastOkAt || "-"))}
          accent={err
            ? { bg:"rgba(255,107,129,0.12)", bd:"rgba(255,107,129,0.28)", tx:"#ff9cad" }
            : { bg:"rgba(255,255,255,0.03)", bd:"rgba(255,255,255,0.08)", tx:"#fff" }}
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 16,
        alignItems: "start"
      }}>
        <div style={{
          border: "1px solid rgba(120,160,255,0.18)",
          borderRadius: 24,
          overflow: "hidden",
          background: "rgba(4, 11, 22, 0.74)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MetricPill label="Device" value="155.15.59.4" />
              <MetricPill label="Poll" value="3s" />
              <MetricPill label="Rows" value={String(rows.length)} />
            </div>
            <div style={{ color: "#8ea8cf", fontSize: 13 }}>
              Tick: {tick}
            </div>
          </div>

          <div style={{ padding: 16, display: "grid", gap: 12 }}>
            {rows.length ? rows.map((row, i) => {
              const tone = toneFor(row.totalMbps);
              const badgeColor =
                row.status === "down" ? "#ff9cad" :
                row.status === "warning" ? "#ffe08a" :
                "#9cffd6";

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 22,
                    padding: 16,
                    background: tone.bg,
                    border: `1px solid ${tone.bd}`,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.18)"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 14
                  }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                        {row.name}
                      </div>
                      <div style={{ color: "#9fb5d8", fontSize: 13, marginTop: 4 }}>
                        Interface live throughput
                      </div>
                    </div>

                    <div style={{
                      padding: "7px 11px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: badgeColor,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 1
                    }}>
                      {String(row.status || "up").toUpperCase()}
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
                    gap: 10
                  }}>
                    <div style={{
                      padding: 14,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)"
                    }}>
                      <div style={{ fontSize: 12, color: "#8ea8cf", marginBottom: 8 }}>RX</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#8fe9ff" }}>
                        {fmt(row.rxMbps)}
                      </div>
                      <div style={{ marginTop: 6, color: "#a8bddf", fontSize: 12 }}>Mbps</div>
                    </div>

                    <div style={{
                      padding: 14,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)"
                    }}>
                      <div style={{ fontSize: 12, color: "#8ea8cf", marginBottom: 8 }}>TX</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#9cffd6" }}>
                        {fmt(row.txMbps)}
                      </div>
                      <div style={{ marginTop: 6, color: "#a8bddf", fontSize: 12 }}>Mbps</div>
                    </div>

                    <div style={{
                      padding: 14,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)"
                    }}>
                      <div style={{ fontSize: 12, color: "#8ea8cf", marginBottom: 8 }}>TOTAL</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: tone.tx }}>
                        {fmt(row.totalMbps)}
                      </div>
                      <div style={{ marginTop: 6, color: "#a8bddf", fontSize: 12 }}>Mbps</div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{
                padding: 18,
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#a8bddf"
              }}>
                No parsed rows yet. The API may still be loading or returning a schema that falls back to debug mode.
              </div>
            )}
          </div>
        </div>

        <div style={{
          border: "1px solid rgba(120,160,255,0.18)",
          borderRadius: 24,
          background: "rgba(4, 11, 22, 0.74)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          position: "sticky",
          top: 20
        }}>
          <div style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#7ea2d8",
              marginBottom: 8
            }}>
              Device Notes
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              155.15.59.4
            </div>
            <div style={{ color: "#9db5da", marginTop: 6 }}>
              Aviat Networks WTM4200
            </div>
          </div>

          <div style={{ padding: 18, display: "grid", gap: 12 }}>
            <div style={{
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{ color: "#7ea2d8", fontSize: 12, marginBottom: 6 }}>Purpose</div>
              <div style={{ fontSize: 14, color: "#d7e6ff", lineHeight: 1.5 }}>
                Live radio throughput card. Good first operational step before wiring the Aviat node into ISP Topology.
              </div>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{ color: "#7ea2d8", fontSize: 12, marginBottom: 6 }}>Expected Focus</div>
              <div style={{ fontSize: 14, color: "#d7e6ff", lineHeight: 1.5 }}>
                Radio1 and transport-side interfaces should show the real traffic story. Once stable, we can overlay these values directly on the topology graph.
              </div>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 16,
              background: "rgba(120,160,255,0.06)",
              border: "1px solid rgba(120,160,255,0.10)"
            }}>
              <div style={{ color: "#7ea2d8", fontSize: 12, marginBottom: 8 }}>API Debug</div>
              <pre style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#dbe7ff",
                fontSize: 12,
                lineHeight: 1.45,
                maxHeight: 320,
                overflow: "auto"
              }}>
{JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


