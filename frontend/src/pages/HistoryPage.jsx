import React, { useEffect, useMemo, useState } from "react";

const shell = {
  minHeight: "100%",
  color: "#eaf2ff",
};

const panel = {
  background: "linear-gradient(180deg, rgba(10,18,34,0.96), rgba(8,14,28,0.98))",
  border: "1px solid rgba(120,160,255,0.18)",
  borderRadius: 22,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const softCard = {
  ...panel,
  padding: 18,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.72,
};

const valueStyle = {
  fontSize: 34,
  fontWeight: 900,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
};

function fmtMbps(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(n >= 100 ? 0 : 2) + " Mbps";
}

function fmtTime(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

function buildHistoryUrl(range, q, uplink) {
  const params = new URLSearchParams();
  if (range) params.set("range", range);
  if (q) params.set("q", q);
  if (uplink && uplink !== "all") params.set("uplink", uplink);
  return `/api/history/uplink?${params.toString()}`;
}

function Sparkline({ items }) {
  const width = 1200;
  const height = 270;
  const pad = 18;

  const safe = Array.isArray(items) ? items : [];
  const data = safe.map((x, i) => ({
    i,
    rx: Number(x?.rxMbps ?? x?.rx ?? 0),
    tx: Number(x?.txMbps ?? x?.tx ?? 0),
  }));

  const maxVal = Math.max(1, ...data.flatMap(d => [d.rx, d.tx]));
  const xStep = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const linePath = (key) => {
    if (!data.length) return "";
    return data.map((d, idx) => {
      const x = pad + idx * xStep;
      const y = height - pad - ((d[key] / maxVal) * (height - pad * 2));
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const areaPath = (key) => {
    if (!data.length) return "";
    const top = data.map((d, idx) => {
      const x = pad + idx * xStep;
      const y = height - pad - ((d[key] / maxVal) * (height - pad * 2));
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
    const lastX = pad + (data.length - 1) * xStep;
    const baseY = height - pad;
    return `${top} L ${lastX} ${baseY} L ${pad} ${baseY} Z`;
  };

  return (
    <div style={{ ...panel, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>Traffic History</div>
          <div style={{ opacity: 0.68, marginTop: 4 }}>Recent combined uplink RX / TX trend</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontWeight: 800 }}>
          <span style={{ color: "#63ffa3" }}>RX</span>
          <span style={{ color: "#78a9ff" }}>TX</span>
        </div>
      </div>

      <div style={{ width: "100%", overflow: "hidden", borderRadius: 18 }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="rxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99,255,163,0.30)" />
              <stop offset="100%" stopColor="rgba(99,255,163,0.02)" />
            </linearGradient>
            <linearGradient id="txFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(120,169,255,0.30)" />
              <stop offset="100%" stopColor="rgba(120,169,255,0.02)" />
            </linearGradient>
          </defs>

          {[0.2,0.4,0.6,0.8].map((g) => {
            const y = height - pad - ((height - pad * 2) * g);
            return <line key={g} x1={pad} y1={y} x2={width-pad} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
          })}

          <path d={areaPath("tx")} fill="url(#txFill)" />
          <path d={areaPath("rx")} fill="url(#rxFill)" />
          <path d={linePath("tx")} fill="none" stroke="#78a9ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath("rx")} fill="none" stroke="#63ffa3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{ ...softCard, minHeight: 122 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, color: color || "#ffffff", marginTop: 10 }}>{value}</div>
      <div style={{ marginTop: 10, opacity: 0.66, fontSize: 13 }}>{sub}</div>
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [uplink, setUplink] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadData(currentRange, currentSearch, currentUplink) {
    try {
      setLoading(true);
      setErr("");
      const url = buildHistoryUrl(currentRange, currentSearch, currentUplink);
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed to load history");
      const data = Array.isArray(j?.data) ? j.data : [];
      setRows(data);
    } catch (e) {
      setRows([]);
      setErr(String(e?.message || e || "Unknown history error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(range, appliedSearch, uplink);
  }, [range, appliedSearch, uplink]);

  const latest = rows.length ? rows[rows.length - 1] : null;

  const stats = useMemo(() => {
    const rx = Number(latest?.rxMbps ?? latest?.rx ?? 0);
    const tx = Number(latest?.txMbps ?? latest?.tx ?? 0);
    return {
      status: err ? "ERROR" : loading ? "LOADING" : "OK",
      rows: rows.length,
      rx,
      tx,
      ts: latest?.ts || latest?.time || latest?.timestamp || null,
      target: latest?.name || latest?.uplink || latest?.source || latest?.ip || "-",
    };
  }, [rows, latest, err, loading]);

  const uniqueUplinks = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r?.uplink || r?.name || r?.source || r?.ip;
      if (key) map.set(String(key), String(key));
    }
    return ["all", ...Array.from(map.values())];
  }, [rows]);

  return (
    <div style={shell}>
      <div
        style={{
          padding: 26,
          display: "grid",
          gap: 18,
          background:
            "radial-gradient(circle at top right, rgba(80,90,255,0.18), transparent 26%), radial-gradient(circle at top left, rgba(0,255,200,0.08), transparent 20%)",
        }}
      >
        <div style={{ ...panel, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.58 }}>
            NoComment Work Tools
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.04em", marginTop: 10 }}>
            Uplink History
          </div>
          <div style={{ marginTop: 8, opacity: 0.7, maxWidth: 900, fontSize: 15 }}>
            Luxury monitoring view for stored uplink samples with cleaner controls, richer summary cards, and premium chart presentation.
          </div>
        </div>

        <div style={{ ...panel, padding: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ gridColumn: "span 3" }}>
              <div style={labelStyle}>Range</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {["all", "1h", "6h", "24h", "7d"].map((x) => (
                  <button
                    key={x}
                    onClick={() => setRange(x)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 14,
                      border: x === range ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                      background: x === range ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: "span 3" }}>
              <div style={labelStyle}>Uplink</div>
              <select
                value={uplink}
                onChange={(e) => setUplink(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  padding: "0 14px",
                  fontWeight: 700,
                }}
              >
                {uniqueUplinks.map((x) => (
                  <option key={x} value={x} style={{ color: "#111" }}>
                    {x === "all" ? "All uplinks" : x}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "span 4" }}>
              <div style={labelStyle}>Search</div>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search IP / uplink / name / source"
                style={{
                  width: "100%",
                  marginTop: 8,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  padding: "0 14px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", gap: 10, alignSelf: "end" }}>
              <button
                onClick={() => setAppliedSearch(searchInput.trim())}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(140,180,255,0.45)",
                  background: "linear-gradient(180deg, rgba(102,129,255,0.35), rgba(59,83,214,0.30))",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                  setUplink("all");
                  setRange("all");
                }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
          <SummaryCard label="Status" value={stats.status} sub={err ? err : "History page online"} color={stats.status === "OK" ? "#63ffa3" : stats.status === "LOADING" ? "#ffd76a" : "#ff7f96"} />
          <SummaryCard label="Rows" value={String(stats.rows)} sub="Stored history rows loaded" />
          <SummaryCard label="Latest RX" value={fmtMbps(stats.rx)} sub="Most recent receive throughput" color="#63ffa3" />
          <SummaryCard label="Latest TX" value={fmtMbps(stats.tx)} sub="Most recent transmit throughput" color="#78a9ff" />
          <SummaryCard label="Range" value={String(range)} sub={uplink === "all" ? "All uplinks selected" : `Filtered uplink: ${uplink}`} />
        </div>

        <Sparkline items={rows} />

        <div style={{ ...panel, padding: 18 }}>
          <div style={labelStyle}>Latest sample</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
            {fmtTime(stats.ts)} • To {stats.target} • RX {fmtMbps(stats.rx)} • TX {fmtMbps(stats.tx)}
          </div>
        </div>

        <div style={{ ...panel, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Detailed rows</div>
              <div style={{ opacity: 0.64, marginTop: 4 }}>Premium compact table for audit and troubleshooting</div>
            </div>
            <div style={{ opacity: 0.68, fontWeight: 800 }}>
              {loading ? "Loading..." : `${rows.length} row(s)`}
            </div>
          </div>

          <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                  {["Time", "Target", "RX", "TX", "IP", "Source"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.68)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 22, opacity: 0.72 }}>
                      {err ? err : "No history rows found for the current filter."}
                    </td>
                  </tr>
                ) : (
                  rows.slice().reverse().map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ padding: "14px 16px" }}>{fmtTime(r?.ts || r?.time || r?.timestamp)}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800 }}>{r?.name || r?.uplink || r?.target || "-"}</td>
                      <td style={{ padding: "14px 16px", color: "#63ffa3", fontWeight: 800 }}>{fmtMbps(r?.rxMbps ?? r?.rx)}</td>
                      <td style={{ padding: "14px 16px", color: "#78a9ff", fontWeight: 800 }}>{fmtMbps(r?.txMbps ?? r?.tx)}</td>
                      <td style={{ padding: "14px 16px" }}>{r?.ip || "-"}</td>
                      <td style={{ padding: "14px 16px" }}>{r?.source || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
