import React, { useEffect, useMemo, useRef, useState } from "react";

const shell = {
  minHeight: "100%",
  color: "#eaf2ff",
};

const panel = {
  background: "linear-gradient(180deg, rgba(10,18,34,0.96), rgba(8,14,28,0.98))",
  border: "1px solid rgba(120,160,255,0.18)",
  borderRadius: 24,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const softCard = {
  ...panel,
  padding: 20,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.72,
};

const valueStyle = {
  fontSize: 36,
  fontWeight: 900,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  const n = num(v);
  if (n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(n >= 100 ? 0 : 2) + " Mbps";
}

function parseTs(row) {
  const raw = row?.ts || row?.time || row?.timestamp || row?.createdAt || null;
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}

function fmtTime(ts) {
  if (!ts) return "-";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

function buildHistoryUrl(range, q, limit) {
  const params = new URLSearchParams();
  if (range) params.set("range", range);
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  return `/api/history/uplink?${params.toString()}`;
}

function smartFrontendLimit(range) {
  switch (String(range || "").trim()) {
    case "5m": return 300;
    case "30m": return 400;
    case "60m": return 500;
    case "24h": return 500;
    case "30d": return 800;
    default: return 500;
  }
}

function normalizeUplinkRows(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr.map((r, idx) => {
    const dt = parseTs(r);
    const name = String(r?.name || r?.uplink || r?.source || r?.ip || `uplink-${idx}`);
    return {
      ...r,
      kind: "uplink",
      kindLabel: "Uplink",
      displayName: name,
      selectorKey: `uplink:${name}`,
      rxValue: num(r?.rxMbps ?? r?.rx),
      txValue: num(r?.txMbps ?? r?.tx),
      __dt: dt,
      __ms: dt ? dt.getTime() : 0,
      __idx: idx,
    };
  });
}

function normalizeInterfaceRows(input) {
  const arr = Array.isArray(input) ? input : [];
  const now = new Date();
  return arr.map((r, idx) => {
    const dt = parseTs(r) || now;
    const name = String(r?.name || r?.id || r?.ip || `interface-${idx}`);
    return {
      ...r,
      kind: "interface",
      kindLabel: "Interface",
      displayName: name,
      selectorKey: `interface:${name}`,
      rxValue: num(r?.rxMbps ?? r?.rx),
      txValue: num(r?.txMbps ?? r?.tx),
      __dt: dt,
      __ms: dt.getTime(),
      __idx: idx,
    };
  });
}

function filterRowsByRange(rows, range) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const latestMs = Math.max(...rows.map((r) => r.__ms || 0), 0);
  if (!latestMs) return rows;

  const map = {
    "5m": 5 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "60m": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const win = map[range];
  if (!win) return rows;

  const minMs = latestMs - win;
  return rows.filter((r) => (r.__ms || 0) >= minMs);
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{ ...softCard, minHeight: 128 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, color: color || "#ffffff", marginTop: 10 }}>{value}</div>
      <div style={{ marginTop: 10, opacity: 0.66, fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function HistoryChart({ items }) {
  const wrapRef = useRef(null);
  const width = 1200;
  const height = 270;
  const pad = 18;

  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverBox, setHoverBox] = useState({ x: 0, y: 0 });

  const data = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    return safe.map((x, i) => ({
      i,
      raw: x,
      rx: num(x?.rxValue ?? x?.rxMbps ?? x?.rx),
      tx: num(x?.txValue ?? x?.txMbps ?? x?.tx),
      time: x?.__dt || parseTs(x),
      label: x?.displayName || x?.name || x?.uplink || x?.source || x?.ip || "-",
      kindLabel: x?.kindLabel || "-",
    }));
  }, [items]);

  const maxVal = Math.max(1, ...data.flatMap((d) => [d.rx, d.tx]));
  const xStep = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const linePath = (key) => {
    if (!data.length) return "";
    return data
      .map((d, idx) => {
        const x = pad + idx * xStep;
        const y = height - pad - ((d[key] / maxVal) * (height - pad * 2));
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const areaPath = (key) => {
    if (!data.length) return "";
    const top = data
      .map((d, idx) => {
        const x = pad + idx * xStep;
        const y = height - pad - ((d[key] / maxVal) * (height - pad * 2));
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    const lastX = pad + (data.length - 1) * xStep;
    const baseY = height - pad;
    return `${top} L ${lastX} ${baseY} L ${pad} ${baseY} Z`;
  };

  const hoverItem = hoverIndex == null ? null : data[hoverIndex];
const hasEnoughPoints = data.length >= 2;

  function handleMove(e) {
    if (!wrapRef.current || data.length === 0) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = rect.width > 0 ? relX / rect.width : 0;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setHoverIndex(idx);
    setHoverBox({
      x: relX,
      y: Math.max(12, e.clientY - rect.top - 18),
    });
  }

  function handleLeave() {
    setHoverIndex(null);
  }

  return (
    <div style={{ ...panel, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>Traffic History</div>
          <div style={{ opacity: 0.68, marginTop: 4 }}>Unified view for uplinks + monitor interfaces</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontWeight: 800 }}>
          <span style={{ color: "#63ffa3" }}>RX</span>
          <span style={{ color: "#78a9ff" }}>TX</span>
        </div>
      </div>

      <div
        ref={wrapRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ width: "100%", overflow: "hidden", borderRadius: 20, minHeight: 270, position: "relative" }}
      >
        {data.length === 0 ? (
          <div
            style={{
              minHeight: 270,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "rgba(255,255,255,0.72)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>No rows for this filter</div>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
              Try another time window, target, or search.
            </div>
          </div>
        ) : !hasEnoughPoints ? (
          <div
            style={{
              minHeight: 270,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "rgba(255,255,255,0.72)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>Need more samples</div>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
              This target currently has only one point, so the chart line cannot be drawn yet.
            </div>
          </div>
        ) : (
          <>
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

              {[0.2, 0.4, 0.6, 0.8].map((g) => {
                const y = height - pad - ((height - pad * 2) * g);
                return <line key={g} x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
              })}

              <path d={areaPath("tx")} fill="url(#txFill)" />
              <path d={areaPath("rx")} fill="url(#rxFill)" />
              <path d={linePath("tx")} fill="none" stroke="#78a9ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d={linePath("rx")} fill="none" stroke="#63ffa3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {hoverIndex != null && data[hoverIndex] ? (() => {
                const x = pad + hoverIndex * xStep;
                return (
                  <g>
                    <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="rgba(255,255,255,0.20)" strokeDasharray="4 4" />
                  </g>
                );
              })() : null}
            </svg>

            {hoverItem ? (
              <div
                style={{
                  position: "absolute",
                  left: Math.min(Math.max(12, hoverBox.x + 12), Math.max(12, (wrapRef.current?.clientWidth || 500) - 250)),
                  top: Math.min(Math.max(12, hoverBox.y), 180),
                  width: 238,
                  pointerEvents: "none",
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "linear-gradient(180deg, rgba(8,14,28,0.96), rgba(12,20,40,0.98))",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.66 }}>
                  {hoverItem.kindLabel}
                </div>
                <div style={{ marginTop: 6, fontWeight: 900, fontSize: 14 }}>
                  {hoverItem.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
                  {fmtTime(hoverItem.time)}
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  <div style={{ color: "#63ffa3", fontWeight: 800 }}>RX: {fmtMbps(hoverItem.rx)}</div>
                  <div style={{ color: "#78a9ff", fontWeight: 800 }}>TX: {fmtMbps(hoverItem.tx)}</div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState("5m");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("all");
  const [rawRows, setRawRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [selectedSource, setSelectedSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  async function loadData(currentRange, currentSearch) {
    try {
      setLoading(true);
      setErr("");

      const smartLimit = 1000;

      const [historyResp, streetResp] = await Promise.allSettled([
        fetch(buildHistoryUrl(currentRange, currentSearch, smartLimit), { cache: "no-store" }),
        fetch("/api/history/monitor-street?range=" + encodeURIComponent(currentRange) + "&q=" + encodeURIComponent(currentSearch || "") + "&limit=" + encodeURIComponent(smartLimit), { cache: "no-store" }),
      ]);

      let uplinkRows = [];
      let interfaceRows = [];
      let errors = [];

      if (historyResp.status === "fulfilled") {
        const r = historyResp.value;
        const j = await r.json();
        if (!r.ok || !j?.ok) {
          errors.push(j?.error || "Uplink history failed");
        } else {
          const data = Array.isArray(j?.items)
            ? j.items
            : Array.isArray(j?.data)
            ? j.data
            : Array.isArray(j?.rows)
            ? j.rows
            : Array.isArray(j?.history)
            ? j.history
            : [];
          uplinkRows = normalizeUplinkRows(data);
        }
      } else {
        errors.push("Uplink history request failed");
      }

      if (streetResp.status === "fulfilled") {
        const r = streetResp.value;
        const j = await r.json();
        if (!r.ok || !j?.ok) {
          errors.push(j?.error || "Monitor Street history failed");
        } else {
          const data = Array.isArray(j?.items)
            ? j.items
            : Array.isArray(j?.data)
            ? j.data
            : Array.isArray(j?.rows)
            ? j.rows
            : Array.isArray(j?.history)
            ? j.history
            : [];
          interfaceRows = normalizeInterfaceRows(data);
        }
      } else {
        errors.push("Monitor Street history request failed");
      }

      const merged = [...uplinkRows, ...interfaceRows].sort((a, b) => (a.__ms || 0) - (b.__ms || 0));
      setRawRows(merged);
setAllRows((prev) => {
  const map = new Map();
  [...prev, ...merged].forEach(r => {
    map.set(r.selectorKey, r);
  });
  return Array.from(map.values());
});

      if (errors.length && merged.length === 0) {
        throw new Error(errors.join(" | "));
      }

      setErr(errors.length ? errors.join(" | ") : "");
    } catch (e) {
      setRawRows([]);
      setErr(String(e?.message || e || "Unknown history error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(range, appliedSearch);
  }, [range, appliedSearch]);

  const selectorItems = useMemo(() => {
    const map = new Map();
    for (const r of allRows) {
      if (!map.has(r.selectorKey)) {
        map.set(r.selectorKey, {
          value: r.selectorKey,
          label: `${r.displayName} (${r.kindLabel})`,
        });
      }
    }
    return [{ value: "all", label: "All targets" }, ...Array.from(map.values())];
  }, [allRows]);

  useEffect(() => {
    const exists = selectorItems.some((x) => x.value === selectedKey);
    if (!exists) {
      setSelectedKey("all");
    }
  }, [selectorItems, selectedKey]);

  useEffect(() => {
    setPage(1);
  }, [range, selectedKey, selectedSource, appliedSearch]);

  const filteredRows = useMemo(() => {
    let rows = Array.isArray(rawRows) ? rawRows : [];

    if (selectedSource !== "all") {
      rows = rows.filter((r) => r.kind === selectedSource);
    }

    if (selectedKey !== "all") {
      rows = rows.filter((r) => r.selectorKey === selectedKey);
    }

    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      rows = rows.filter((r) =>
        String(r?.displayName || "").toLowerCase().includes(q) ||
        String(r?.name || "").toLowerCase().includes(q) ||
        String(r?.ip || "").toLowerCase().includes(q) ||
        String(r?.source || "").toLowerCase().includes(q) ||
        String(r?.uplink || "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [rawRows, selectedSource, selectedKey, appliedSearch, range]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage]);

  const chartRows = useMemo(() => {
    const rows = Array.isArray(filteredRows) ? filteredRows : [];

    if (selectedKey !== "all") {
      return rows;
    }

    const topN = range === "24h" || range === "30d" ? 8 : 5;
    const scoreMap = new Map();

    for (const r of rows) {
      const key = String(r?.selectorKey || "").trim();
      if (!key) continue;

      const rx = Number(r?.rxValue ?? r?.rxMbps ?? r?.rx ?? 0);
      const tx = Number(r?.txValue ?? r?.txMbps ?? r?.tx ?? 0);
      const total = Math.max(0, rx) + Math.max(0, tx);

      if (!scoreMap.has(key) || total > scoreMap.get(key)) {
        scoreMap.set(key, total);
      }
    }

    const allowed = new Set(
      Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map((x) => x[0])
    );

    return rows.filter((r) => allowed.has(String(r?.selectorKey || "").trim()));
  }, [filteredRows, selectedKey, range]);

  const latest = filteredRows.length ? filteredRows[filteredRows.length - 1] : null;

  const stats = useMemo(() => {
    const rx = num(latest?.rxValue ?? latest?.rxMbps ?? latest?.rx);
    const tx = num(latest?.txValue ?? latest?.txMbps ?? latest?.tx);
    return {
      status: err && filteredRows.length === 0 ? "ERROR" : loading ? "LOADING" : "OK",
      rows: filteredRows.length,
      rx,
      tx,
      ts: latest?.__dt || latest?.ts || latest?.time || latest?.timestamp || null,
      target: latest?.displayName || latest?.name || latest?.uplink || latest?.source || latest?.ip || "-",
      kindLabel: latest?.kindLabel || "Mixed",
    };
  }, [filteredRows, latest, err, loading]);

  return (
    <div style={shell}>
      <div
        style={{
          padding: 22,
          display: "grid",
          gap: 16,
          background:
            "radial-gradient(circle at top right, rgba(80,90,255,0.18), transparent 26%), radial-gradient(circle at top left, rgba(0,255,200,0.08), transparent 20%)",
        }}
      >
        <div style={{ ...panel, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.58 }}>
            NoComment Work Tools
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.04em", marginTop: 10 }}>
            Unified History
          </div>
          <div style={{ marginTop: 8, opacity: 0.7, maxWidth: 980, fontSize: 15 }}>
            One shared history page that mixes uplink traffic with real Monitor Street interface history inside the same controls.
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
                {[
                  { value: "5m", label: "5 Minutes" },
                  { value: "30m", label: "30 Minutes" },
                  { value: "60m", label: "60 Minutes" },
                  { value: "24h", label: "24 Hours" },
                  { value: "30d", label: "30 Days" },
                ].map((x) => (
                  <button
                    key={x.value}
                    onClick={() => setRange(x.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 14,
                      border: x.value === range ? "1px solid rgba(140,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                      background: x.value === range ? "rgba(90,120,255,0.22)" : "rgba(255,255,255,0.04)",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: "span 3" }}>
              <div style={labelStyle}>Target</div>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                  color: "#fff",
                  padding: "0 14px",
                  fontWeight: 700,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {selectorItems.map((x) => (
                  <option key={x.value} value={x.value} style={{ color: "#111" }}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <div style={labelStyle}>Search</div>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search IP / uplink / interface / source"
                style={{
                  width: "100%",
                  marginTop: 8,
                  height: 46,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                  color: "#fff",
                  padding: "0 14px",
                  fontWeight: 700,
                  outline: "none",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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
                  setSelectedKey("all");
                  setRange("5m");
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 16 }}>
          <SummaryCard label="Status" value={stats.status} sub={err ? err : "Unified history page online"} color={stats.status === "OK" ? "#63ffa3" : stats.status === "LOADING" ? "#ffd76a" : "#ff7f96"} />
          <SummaryCard label="Rows" value={String(stats.rows)} sub="Filtered rows from uplinks + interfaces" />
          <SummaryCard label="Latest RX" value={fmtMbps(stats.rx)} sub="Most recent receive throughput" color="#63ffa3" />
          <SummaryCard label="Latest TX" value={fmtMbps(stats.tx)} sub="Most recent transmit throughput" color="#78a9ff" />
          <SummaryCard label="Latest Type" value={stats.kindLabel} sub={stats.target} />
        </div>

        <HistoryChart items={chartRows} />

        <div style={{ ...panel, padding: 18 }}>
          <div style={labelStyle}>Latest sample</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
            {fmtTime(stats.ts)} • {stats.kindLabel} • {stats.target} • RX {fmtMbps(stats.rx)} • TX {fmtMbps(stats.tx)}
          </div>
        </div>

        <div style={{ ...panel, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Detailed rows</div>
              <div style={{ opacity: 0.64, marginTop: 4 }}>Unified table for uplink history + monitor interfaces with smart row limiting</div>
            </div>
            <div style={{ opacity: 0.68, fontWeight: 800, display: "flex", gap: 14, alignItems: "center" }}>
              <span>{loading ? "Loading..." : `${filteredRows.length} row(s)`}</span>
              <span>Page {safePage} of {totalPages}</span>
            </div>
          </div>

          <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1120 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                  {["Type", "Time", "Target", "RX", "TX", "IP", "Source"].map((h) => (
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
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 22, opacity: 0.72 }}>
                      {err ? err : "No rows found for the current filter."}
                    </td>
                  </tr>
                ) : (
                  pagedRows.slice().reverse().map((r, idx) => (
                    <tr
                      key={r.kind + ":" + r.displayName + ":" + idx}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: idx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontWeight: 800 }}>{r.kindLabel}</td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{fmtTime(r?.__dt || r?.ts || r?.time || r?.timestamp)}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, whiteSpace: "nowrap" }}>{r?.displayName || r?.name || r?.uplink || r?.target || "-"}</td>
                      <td style={{ padding: "14px 16px", color: "#63ffa3", fontWeight: 800 }}>{fmtMbps(r?.rxValue ?? r?.rxMbps ?? r?.rx)}</td>
                      <td style={{ padding: "14px 16px", color: "#78a9ff", fontWeight: 800 }}>{fmtMbps(r?.txValue ?? r?.txMbps ?? r?.tx)}</td>
                      <td style={{ padding: "14px 16px" }}>{r?.ip || "-"}</td>
                      <td style={{ padding: "14px 16px" }}>{r?.source || r?.ifName || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ opacity: 0.68, fontSize: 14 }}>
              Showing {filteredRows.length === 0 ? 0 : (((safePage - 1) * pageSize) + 1)} to {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: safePage <= 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: safePage <= 1 ? "not-allowed" : "pointer",
                  opacity: safePage <= 1 ? 0.45 : 1,
                }}
              >
                Prev
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(140,180,255,0.35)",
                  background: safePage >= totalPages ? "rgba(255,255,255,0.03)" : "linear-gradient(180deg, rgba(102,129,255,0.30), rgba(59,83,214,0.24))",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                  opacity: safePage >= totalPages ? 0.45 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


















