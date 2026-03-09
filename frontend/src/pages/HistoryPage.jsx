import React, { useEffect, useMemo, useRef, useState } from "react";

const RANGE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "1h", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" }
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v) {
  return num(v).toFixed(2);
}

function formatTs(ts) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function buildHistoryUrl(range, q, uplink) {
  const params = new URLSearchParams();
  params.set("limit", "300");

  if (range && range !== "all") {
    params.set("range", range);
  }

  if (uplink && uplink.trim()) {
    params.set("uplink", uplink.trim());
  }

  if (q && q.trim()) {
    params.set("q", q.trim());
  }

  return `/api/history/uplink?${params.toString()}`;
}

function panelStyle(extra = {}) {
  return {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(12,16,26,0.92), rgba(8,11,18,0.94))",
    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
    ...extra
  };
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 34,
        padding: "0 14px",
        borderRadius: 10,
        border: active ? "1px solid rgba(122,162,255,.55)" : "1px solid rgba(255,255,255,.08)",
        background: active ? "rgba(122,162,255,.16)" : "rgba(255,255,255,.025)",
        color: "#fff",
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}

function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = options.find(x => x.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 260 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          height: 38,
          padding: "0 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.03)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label || "All uplinks"}
        </span>
        <span style={{ opacity: 0.7, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(9,12,18,.98)",
            boxShadow: "0 18px 36px rgba(0,0,0,.35)",
            maxHeight: 280,
            overflowY: "auto"
          }}
        >
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value || "__all__"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: 0,
                  borderBottom: "1px solid rgba(255,255,255,.05)",
                  background: active ? "rgba(122,162,255,.15)" : "transparent",
                  color: "#fff",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div style={panelStyle({ padding: 14, minWidth: 180 })}>
      <div style={{ opacity: 0.62, fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: tone || "#fff", lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function HistoryChart({ items }) {
  const rows = Array.isArray(items) ? items : [];
  const wrapRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const width = 1500;
  const height = 420;
  const padL = 52;
  const padR = 18;
  const padT = 18;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const rxVals = rows.map(x => num(x?.rxMbps));
  const txVals = rows.map(x => num(x?.txMbps));
  const maxY = Math.max(10, ...rxVals, ...txVals);

  function point(v, i, len) {
    const x = padL + (len <= 1 ? 0 : (i * innerW) / (len - 1));
    const y = padT + innerH - ((num(v) / maxY) * innerH);
    return { x, y };
  }

  function line(values) {
    return values.map((v, i) => {
      const p = point(v, i, rows.length);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  function area(values) {
    if (!values.length) return "";
    const top = values.map((v, i) => {
      const p = point(v, i, rows.length);
      return `${p.x},${p.y}`;
    }).join(" ");
    const last = point(values[values.length - 1], values.length - 1, rows.length);
    const first = point(values[0], 0, rows.length);
    return `${top} ${last.x},${padT + innerH} ${first.x},${padT + innerH}`;
  }

  const rxLine = line(rxVals);
  const txLine = line(txVals);
  const txArea = area(txVals);

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const ratio = i / 4;
    const y = padT + innerH - (ratio * innerH);
    const label = Math.round(maxY * ratio);
    return { y, label };
  });

  function onMove(e) {
    if (!wrapRef.current || rows.length === 0) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(rows.length - 1, Math.round((x / rect.width) * (rows.length - 1))));
    setHoverIdx(idx);
  }

  const hoverRow = hoverIdx !== null ? rows[hoverIdx] : null;
  const hoverRx = hoverIdx !== null ? point(rxVals[hoverIdx], hoverIdx, rows.length) : null;
  const hoverTx = hoverIdx !== null ? point(txVals[hoverIdx], hoverIdx, rows.length) : null;

  return (
    <div style={panelStyle({ padding: 18 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Traffic History</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: "#7dff7a" }}>RX</span>
          <span style={{ color: "#7aa2ff" }}>TX</span>
        </div>
      </div>

      <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 300, display: "block" }}>
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={padL}
                y1={g.y}
                x2={width - padR}
                y2={g.y}
                stroke="rgba(255,255,255,.12)"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={g.y + 4}
                fill="rgba(255,255,255,.42)"
                fontSize="11"
                textAnchor="end"
              >
                {g.label}
              </text>
            </g>
          ))}

          {txArea ? (
            <polygon
              points={txArea}
              fill="rgba(122,162,255,0.10)"
            />
          ) : null}

          <polyline
            points={rxLine}
            fill="none"
            stroke="#7dff7a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={txLine}
            fill="none"
            stroke="#7aa2ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverRow && hoverRx && hoverTx ? (
            <>
              <line
                x1={hoverRx.x}
                y1={padT}
                x2={hoverRx.x}
                y2={padT + innerH}
                stroke="rgba(255,255,255,.18)"
                strokeDasharray="4 4"
              />
              <circle cx={hoverRx.x} cy={hoverRx.y} r="4" fill="#7dff7a" />
              <circle cx={hoverTx.x} cy={hoverTx.y} r="4" fill="#7aa2ff" />
            </>
          ) : null}
        </svg>

        {hoverRow ? (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              minWidth: 230,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(8,11,18,.96)",
              border: "1px solid rgba(255,255,255,.09)",
              boxShadow: "0 12px 26px rgba(0,0,0,.30)",
              pointerEvents: "none"
            }}
          >
            <div style={{ opacity: 0.65, fontSize: 12, marginBottom: 6 }}>{formatTs(hoverRow.ts)}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
              {hoverRow.name || hoverRow.uplink || "-"}
            </div>
            <div style={{ color: "#7dff7a", fontSize: 13, marginBottom: 4 }}>
              RX: {fmtMbps(hoverRow.rxMbps)} Mbps
            </div>
            <div style={{ color: "#7aa2ff", fontSize: 13, marginBottom: 4 }}>
              TX: {fmtMbps(hoverRow.txMbps)} Mbps
            </div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {hoverRow.ip || "-"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [uplink, setUplink] = useState("");

  const [state, setState] = useState({
    loading: true,
    ok: false,
    count: 0,
    items: [],
    error: "",
    filters: { range: null, q: "", uplink: "" }
  });

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        const url = buildHistoryUrl(range, appliedSearch, uplink);
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store"
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (!dead) {
          setState({
            loading: false,
            ok: !!data?.ok,
            count: Number(data?.count || 0),
            items: Array.isArray(data?.items) ? data.items : [],
            error: "",
            filters: {
              range: data?.filters?.range ?? null,
              q: data?.filters?.q ?? "",
              uplink: data?.filters?.uplink ?? ""
            }
          });
        }
      } catch (err) {
        if (!dead) {
          setState({
            loading: false,
            ok: false,
            count: 0,
            items: [],
            error: err?.message || "Failed to load history",
            filters: { range: null, q: "", uplink: "" }
          });
        }
      }
    }

    load();
    const t = setInterval(load, 10000);

    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [range, appliedSearch, uplink]);

  function applySearch() {
    setAppliedSearch(search.trim());
  }

  const latest = useMemo(() => {
    return state.items.length ? state.items[state.items.length - 1] : null;
  }, [state.items]);

  const uplinkOptions = useMemo(() => {
    const map = new Map();
    map.set("", { value: "", label: "All uplinks" });

    for (const row of state.items) {
      const key = String(row?.uplink || "").trim();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: row?.name ? `${row.name} (${key})` : key
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.value === "") return -1;
      if (b.value === "") return 1;
      return a.label.localeCompare(b.label);
    });
  }, [state.items]);

  const latestRx = latest ? fmtMbps(latest.rxMbps) + " Mbps" : "-";
  const latestTx = latest ? fmtMbps(latest.txMbps) + " Mbps" : "-";

  return (
    <div style={{ padding: 18, maxWidth: 1600 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Uplink History</div>
        <div style={{ opacity: 0.68, fontSize: 13 }}>
          History of saved uplink samples. Search works on stored history rows only.
        </div>
      </div>

      <div style={{ ...panelStyle({ padding: 18, marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {RANGE_OPTIONS.map(opt => (
              <FilterChip
                key={opt.key}
                active={range === opt.key}
                onClick={() => setRange(opt.key)}
              >
                {opt.label}
              </FilterChip>
            ))}
          </div>

          <div style={{ width: 260 }}>
            <CustomDropdown value={uplink} options={uplinkOptions} onChange={setUplink} />
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder="Search IP / uplink / name / source"
            style={{
              width: 300,
              maxWidth: "100%",
              height: 38,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(255,255,255,.03)",
              color: "#fff",
              outline: "none"
            }}
          />

          <button
            type="button"
            onClick={applySearch}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(122,162,255,.16)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setAppliedSearch("");
              setUplink("");
            }}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(255,255,255,.03)",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {state.loading ? (
        <div style={panelStyle({ padding: 18 })}>Loading history…</div>
      ) : state.error ? (
        <div style={{ ...panelStyle({ padding: 18 }), color: "#ff8a80" }}>
          History fetch failed: {state.error}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
            <StatCard label="Status" value={state.ok ? "OK" : "NOT READY"} tone={state.ok ? "#7dff7a" : "#ff8a80"} />
            <StatCard label="Rows" value={String(state.count)} />
            <StatCard label="Latest RX" value={latestRx} tone="#7dff7a" />
            <StatCard label="Latest TX" value={latestTx} tone="#7aa2ff" />
            <StatCard label="Range" value={range} />
          </div>

          {state.items.length === 0 ? (
            <div style={panelStyle({ padding: 18 })}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No history found</div>
              <div style={{ opacity: 0.76, lineHeight: 1.6 }}>
                No stored rows matched the current filters. If you search by IP, it must exist inside saved uplink history rows.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <HistoryChart items={state.items} />
              </div>

              <div style={{ ...panelStyle({ padding: 18, marginBottom: 14 }) }}>
                <div style={{ opacity: 0.62, fontSize: 12, marginBottom: 6 }}>Latest sample</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  {latest
                    ? `${formatTs(latest.ts)} • ${latest.name || latest.uplink || "-"} • RX ${fmtMbps(latest.rxMbps)} Mbps • TX ${fmtMbps(latest.txMbps)} Mbps`
                    : "-"}
                </div>
              </div>

              <div style={{ ...panelStyle({ padding: 10, overflowX: "auto" }) }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                  <thead>
                    <tr>
                      {["Time", "RX", "TX", "Uplink", "IP", "Name", "Source"].map(h => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 8px",
                            fontSize: 12,
                            color: "rgba(255,255,255,.65)",
                            borderBottom: "1px solid rgba(255,255,255,.08)"
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...state.items].slice().reverse().map((row, idx) => (
                      <tr key={`${row.ts || "row"}-${idx}`}>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)" }}>{formatTs(row.ts)}</td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)", color: "#7dff7a", fontWeight: 700 }}>
                          {fmtMbps(row.rxMbps)}
                        </td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)", color: "#7aa2ff", fontWeight: 700 }}>
                          {fmtMbps(row.txMbps)}
                        </td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)" }}>{row.uplink || "-"}</td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)" }}>{row.ip || "-"}</td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)" }}>{row.name || "-"}</td>
                        <td style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.04)", opacity: 0.75 }}>{row.source || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

