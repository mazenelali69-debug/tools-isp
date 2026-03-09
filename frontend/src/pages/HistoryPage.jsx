import React, { useEffect, useMemo, useRef, useState } from "react";

const RANGE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "1h", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" }
];

const STATIC_UPLINK_OPTIONS = [
  { value: "", label: "All uplinks" },
  { value: "uplink_dragon_club", label: "To Dragon Club" },
  { value: "uplink_c5c_jabal", label: "C5C Jabal" },
  { value: "uplink_to_office", label: "To Office" },
  { value: "uplink_pharmacy", label: "To Pharmacy Wahib" },
  { value: "uplink_abou_taher", label: "To Abou Taher" },
  { value: "uplink_fast_web", label: "To Office Fast Web" },
  { value: "uplink_daraj_arid", label: "To Daraj El 3arid" },
  { value: "uplink_rawda", label: "To Rawda" }
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

  if (range && range !== "all") params.set("range", range);
  if (uplink && uplink.trim()) params.set("uplink", uplink.trim());
  if (q && q.trim()) params.set("q", q.trim());

  return `/api/history/uplink?${params.toString()}`;
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: active ? "1px solid rgba(122,162,255,.55)" : "1px solid rgba(255,255,255,.10)",
        background: active ? "rgba(122,162,255,.14)" : "rgba(255,255,255,.03)",
        color: "#fff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 600
      }}
    >
      {children}
    </button>
  );
}

function UplinkPicker({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const current = options.find(x => x.value === value) || options[0] || { value: "", label: "All uplinks" };

  useEffect(() => {
    function onDoc(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} style={{ position: "relative", minWidth: 190 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,.12)",
          background: "linear-gradient(180deg, rgba(18,28,42,.95), rgba(11,18,29,.95))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer",
          fontWeight: 700
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current.label}
        </span>
        <span style={{ opacity: 0.72 }}>▼</span>
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.12)",
            background: "linear-gradient(180deg, rgba(15,23,36,.98), rgba(9,14,24,.98))",
            boxShadow: "0 18px 38px rgba(0,0,0,.35)",
            maxHeight: 320,
            overflowY: "auto"
          }}
        >
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  background: active ? "rgba(122,162,255,.16)" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: active ? 800 : 600
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

function HistoryChart({ items }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();

    for (const row of items) {
      const ts = String(row?.ts || "");
      if (!ts) continue;

      const prev = map.get(ts) || { ts, rx: 0, tx: 0 };
      prev.rx += num(row?.rxMbps);
      prev.tx += num(row?.txMbps);
      map.set(ts, prev);
    }

    return Array.from(map.values())
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      .slice(-120);
  }, [items]);

  const width = 1000;
  const height = 250;
  const padL = 42;
  const padR = 20;
  const padT = 16;
  const padB = 28;

  const rxVals = grouped.map(x => num(x.rx));
  const txVals = grouped.map(x => num(x.tx));
  const maxVal = Math.max(1, ...rxVals, ...txVals, 1);

  function makeCoords(values) {
    return values.map((v, i) => {
      const x = values.length <= 1
        ? padL
        : padL + (i * (width - padL - padR)) / (values.length - 1);
      const y = height - padB - ((v / maxVal) * (height - padT - padB));
      return { x, y, v };
    });
  }

  function areaPath(points) {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map(p => `${p.x},${p.y}`).join(" L ");
    return `M ${first.x} ${height - padB} L ${line} L ${last.x} ${height - padB} Z`;
  }

  const rxPts = makeCoords(rxVals);
  const txPts = makeCoords(txVals);
  const rxLine = rxPts.map(p => `${p.x},${p.y}`).join(" ");
  const txLine = txPts.map(p => `${p.x},${p.y}`).join(" ");
  const hoverRow = hoverIdx !== null ? grouped[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? (txPts[hoverIdx]?.x ?? rxPts[hoverIdx]?.x ?? null) : null;

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const usableW = Math.max(1, rect.width);
    if (!grouped.length) return;
    const idx = Math.max(0, Math.min(grouped.length - 1, Math.round((x / usableW) * (grouped.length - 1))));
    setHoverIdx(idx);
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: 12,
        background: "linear-gradient(180deg, rgba(12,22,36,.86), rgba(8,14,24,.86))"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 10
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Traffic History</div>
          <div style={{ opacity: 0.62, fontSize: 11 }}>
            Recent combined uplink RX / TX trend
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 800 }}>
          <span style={{ color: "#67e87a" }}>RX</span>
          <span style={{ color: "#78a8ff" }}>TX</span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{
            width: "100%",
            height: 250,
            display: "block",
            borderRadius: 12,
            cursor: "crosshair"
          }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="historyAreaRx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(103,232,122,0.24)" />
              <stop offset="100%" stopColor="rgba(103,232,122,0.02)" />
            </linearGradient>
            <linearGradient id="historyAreaTx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(120,168,255,0.24)" />
              <stop offset="100%" stopColor="rgba(120,168,255,0.02)" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = height - padB - ((height - padT - padB) * r);
            return (
              <line
                key={i}
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            );
          })}

          <path d={areaPath(txPts)} fill="url(#historyAreaTx)" />
          <path d={areaPath(rxPts)} fill="url(#historyAreaRx)" />

          <polyline
            points={txLine}
            fill="none"
            stroke="#78a8ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={rxLine}
            fill="none"
            stroke="#67e87a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverRow && hoverX !== null ? (
            <>
              <line
                x1={hoverX}
                y1={padT}
                x2={hoverX}
                y2={height - padB}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="5 4"
                strokeWidth="1.4"
              />
              <circle cx={txPts[hoverIdx]?.x || 0} cy={txPts[hoverIdx]?.y || 0} r="5.2" fill="#78a8ff" />
              <circle cx={rxPts[hoverIdx]?.x || 0} cy={rxPts[hoverIdx]?.y || 0} r="5.2" fill="#67e87a" />
            </>
          ) : null}
        </svg>

        {hoverRow ? (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 10,
              minWidth: 180,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(8,12,18,.96)",
              boxShadow: "0 14px 28px rgba(0,0,0,.28)",
              pointerEvents: "none"
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.72, marginBottom: 6 }}>
              {formatTs(hoverRow.ts)}
            </div>
            <div style={{ color: "#67e87a", fontWeight: 800, marginBottom: 4 }}>
              RX: {fmtMbps(hoverRow.rx)} Mbps
            </div>
            <div style={{ color: "#78a8ff", fontWeight: 800 }}>
              TX: {fmtMbps(hoverRow.tx)} Mbps
            </div>
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 10,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(8,12,18,.72)",
              fontSize: 11,
              opacity: 0.72,
              pointerEvents: "none"
            }}
          >
            Move mouse over chart
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState("all");
  const [search, setSearch] = useState("");
  const [uplink, setUplink] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showTable, setShowTable] = useState(false);

  const [state, setState] = useState({
    loading: true,
    ok: false,
    count: 0,
    items: [],
    error: "",
    filters: {
      range: null,
      q: "",
      uplink: ""
    }
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
    const q = search.trim();
    setAppliedSearch(q);

    if (q) {
      setUplink("");
    }
  }

  const latest = useMemo(() => {
    return state.items.length ? state.items[state.items.length - 1] : null;
  }, [state.items]);

  const effectiveUplinkOptions = useMemo(() => {
    const seen = new Set();
    const out = [];

    for (const opt of STATIC_UPLINK_OPTIONS) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        out.push(opt);
      }
    }

    for (const row of state.items) {
      const value = String(row?.uplink || "").trim();
      const label = String(row?.name || row?.uplink || "").trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push({ value, label: label || value });
    }

    return out;
  }, [state.items]);

  const filterSummary = useMemo(() => {
    const bits = [];
    bits.push(`range: ${range}`);
    if (uplink) bits.push(`uplink: ${uplink}`);
    if (appliedSearch) bits.push(`search: ${appliedSearch}`);
    return bits.join(" • ");
  }, [range, uplink, appliedSearch]);

  return (
    <div style={{ padding: 12 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Uplink History</h1>
      <p style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
        History of saved uplink samples. Search works on stored history rows only.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 14,
          marginBottom: 12,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)"
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RANGE_OPTIONS.map(opt => (
            <FilterButton
              key={opt.key}
              active={range === opt.key}
              onClick={() => setRange(opt.key)}
            >
              {opt.label}
            </FilterButton>
          ))}
        </div>

        <UplinkPicker
          value={uplink}
          options={effectiveUplinkOptions}
          onChange={setUplink}
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
          placeholder="Search IP / uplink / name / source"
          style={{
            width: 230,
            maxWidth: "100%",
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            outline: "none"
          }}
        />

        <button
          type="button"
          onClick={applySearch}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700
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
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          marginTop: -2,
          marginBottom: 10,
          fontSize: 12,
          opacity: 0.72
        }}
      >
        Active filters: {filterSummary}
      </div>

      {state.loading ? (
        <div style={{ padding: 16 }}>Loading history…</div>
      ) : state.error ? (
        <div style={{ color: "#ff8a8a", padding: 16 }}>
          History fetch failed: {state.error}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 12
            }}
          >
            {[
              { title: "Status", value: state.ok ? "OK" : "Not ready", color: "#67e87a" },
              { title: "Rows", value: String(state.count), color: "#fff" },
              { title: "Latest RX", value: latest ? `${fmtMbps(latest.rxMbps)} Mbps` : "-", color: "#67e87a" },
              { title: "Latest TX", value: latest ? `${fmtMbps(latest.txMbps)} Mbps` : "-", color: "#78a8ff" },
              { title: "Range", value: range, color: "#fff" }
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 12,
                  background: "linear-gradient(180deg, rgba(12,22,36,.86), rgba(8,14,24,.86))"
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {state.items.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 18,
                background: "rgba(255,255,255,0.03)"
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                No history found
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.6 }}>
                No rows matched the current filters.
              </div>
            </div>
          ) : (
            <>
              <HistoryChart items={state.items} />

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  padding: 12,
                  marginTop: 10,
                  marginBottom: 10,
                  background: "linear-gradient(180deg, rgba(12,22,36,.68), rgba(8,14,24,.68))"
                }}
              >
                <div style={{ opacity: 0.65, marginBottom: 6, fontSize: 12 }}>Latest sample</div>
                <div style={{ fontWeight: 800 }}>
                  {latest
                    ? `${formatTs(latest.ts)} • ${latest.name || latest.uplink || "-"} • RX ${fmtMbps(latest.rxMbps)} Mbps • TX ${fmtMbps(latest.txMbps)} Mbps`
                    : "-"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8
                }}
              >
                <div style={{ opacity: 0.75, fontSize: 13 }}>Detailed rows</div>

                <button
                  type="button"
                  onClick={() => setShowTable(v => !v)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  {showTable ? "Hide table" : "Show table"}
                </button>
              </div>

              {showTable ? (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 12,
                    overflowX: "auto"
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>Time</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>RX</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>TX</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>Uplink</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>IP</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>Name</th>
                        <th style={{ textAlign: "left", padding: "8px 6px" }}>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.items].slice().reverse().map((row, idx) => (
                        <tr
                          key={`${row.ts || "row"}-${idx}`}
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <td style={{ padding: "8px 6px" }}>{formatTs(row.ts)}</td>
                          <td style={{ padding: "8px 6px", color: "#67e87a", fontWeight: 700 }}>{fmtMbps(row.rxMbps)}</td>
                          <td style={{ padding: "8px 6px", color: "#78a8ff", fontWeight: 700 }}>{fmtMbps(row.txMbps)}</td>
                          <td style={{ padding: "8px 6px" }}>{row.uplink || "-"}</td>
                          <td style={{ padding: "8px 6px" }}>{row.ip || "-"}</td>
                          <td style={{ padding: "8px 6px" }}>{row.name || "-"}</td>
                          <td style={{ padding: "8px 6px" }}>{row.source || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
