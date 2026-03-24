import React, { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_NODES = {
  "254": { id: "254", label: "TP LINK IN Aviat", ip: "88.88.88.254", type: "core" },
  "253": { id: "253", label: "TP Link1 IN Cabinet", ip: "88.88.88.253", type: "tp" },
  "252": { id: "252", label: "TP Link2 IN Cabinet", ip: "88.88.88.252", type: "tp" },
  "10254": { id: "10254", label: "TP LINK IN Aviat VLAN 2", ip: "10.88.88.254", type: "core" },
};

const FALLBACK_LINKS = [
  { id: "link-254-253", source: "254", target: "253" },
  { id: "link-254-252", source: "254", target: "252" },
  { id: "link-254-10254", source: "254", target: "10254" },
];

const FALLBACK_POSITIONS = {
  "254": { x: 760, y: 90 },
  "253": { x: 410, y: 230 },
  "252": { x: 1110, y: 230 },
  "10254": { x: 1420, y: 100 },
};

function unwrapPayload(raw, fallback) {
  if (raw && typeof raw === "object" && "data" in raw) return raw.data;
  return raw ?? fallback;
}

function toNodeArray(nodesRaw, positionsRaw) {
  const nodesObj =
    nodesRaw && typeof nodesRaw === "object" && !Array.isArray(nodesRaw)
      ? nodesRaw
      : FALLBACK_NODES;

  const positionsObj =
    positionsRaw && typeof positionsRaw === "object" && !Array.isArray(positionsRaw)
      ? positionsRaw
      : FALLBACK_POSITIONS;

  const out = Object.entries(nodesObj)
    .filter(([key, value]) => key !== "null" && value && typeof value === "object" && value.id)
    .map(([key, value]) => {
      const pos = positionsObj[key] || {};
      return {
        id: String(value.id || key),
        label: String(value.label || value.name || key),
        ip: String(value.ip || "-"),
        type: String(value.type || "node"),
        x: Number.isFinite(Number(pos.x))
          ? Number(pos.x)
          : Number.isFinite(Number(value.x))
            ? Number(value.x)
            : 120,
        y: Number.isFinite(Number(pos.y))
          ? Number(pos.y)
          : Number.isFinite(Number(value.y))
            ? Number(value.y)
            : 120,
        port: value.port || "",
        ifIndex: value.ifIndex || "",
        rxOid: value.rxOid || "",
        txOid: value.txOid || "",
      };
    });

  return out.length
    ? out
    : Object.entries(FALLBACK_NODES).map(([key, value]) => ({
        id: value.id,
        label: value.label,
        ip: value.ip,
        type: value.type,
        x: FALLBACK_POSITIONS[key]?.x ?? 120,
        y: FALLBACK_POSITIONS[key]?.y ?? 120,
        port: "",
        ifIndex: "",
        rxOid: "",
        txOid: "",
      }));
}

function toLinkArray(linksRaw) {
  if (Array.isArray(linksRaw)) {
    const clean = linksRaw
      .filter((x) => x && x.source && x.target)
      .map((x, i) => ({
        id: String(x.id || `link-${i}`),
        source: String(x.source),
        target: String(x.target),
      }));
    if (clean.length) return clean;
  }
  return FALLBACK_LINKS;
}

function nodeColor(type) {
  switch (String(type).toLowerCase()) {
    case "core":
      return "#60a5fa";
    case "tp":
      return "#a78bfa";
    case "mk":
      return "#34d399";
    case "edge":
      return "#f59e0b";
    default:
      return "#94a3b8";
  }
}

function formatMbps(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  if (n >= 1000) return `${(n / 1000).toFixed(2)} Gbps`;
  return `${n.toFixed(2)} Mbps`;
}

function pickTrafficForLink(link, trafficMap) {
  if (!link || !trafficMap) return null;

  const direct =
    trafficMap[link.id] ||
    trafficMap[`${link.source}-${link.target}`] ||
    trafficMap[`${link.target}-${link.source}`];

  if (direct) return direct;

  const values = Object.values(trafficMap);
  return (
    values.find((t) => t?.sourceId === link.source && t?.targetId === link.target) ||
    values.find((t) => t?.sourceId === link.target && t?.targetId === link.source) ||
    values.find((t) => t?.targetId === link.target) ||
    values.find((t) => t?.targetId === link.source) ||
    null
  );
}

function Panel({ children }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
      }}
    >
      {children}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        minWidth: 88,
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(148,163,184,0.18)",
      }}
    >
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "96px minmax(0, 1fr)",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(2,6,23,0.5)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 12 }}>{label}</div>
      <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>
        {String(value ?? "-")}
      </div>
    </div>
  );
}

export default function IspTopologyPage() {
  const [loading, setLoading] = useState(true);`r`n  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [saveText, setSaveText] = useState("");
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [trafficMap, setTrafficMap] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!firstLoadDone) setLoading(true);
setErrorText("");

      try {
        const [nodesRes, positionsRes, linksRes, snapRes] = await Promise.allSettled([
          fetch("/api/topology/nodes", { cache: "no-store" }),
          fetch("/api/topology/positions", { cache: "no-store" }),
          fetch("/api/topology/links", { cache: "no-store" }),
          fetch("/api/topology/snapshot", { cache: "no-store" }),
        ]);

        const nodesRaw =
          nodesRes.status === "fulfilled" && nodesRes.value.ok
            ? unwrapPayload(await nodesRes.value.json(), {})
            : {};

        const positionsRaw =
          positionsRes.status === "fulfilled" && positionsRes.value.ok
            ? unwrapPayload(await positionsRes.value.json(), {})
            : {};

        const linksRaw =
          linksRes.status === "fulfilled" && linksRes.value.ok
            ? unwrapPayload(await linksRes.value.json(), [])
            : [];

        let nextTraffic = {};
        if (snapRes.status === "fulfilled" && snapRes.value.ok) {
          const snapJson = await snapRes.value.json();
          const snapData = unwrapPayload(snapJson, {});
          nextTraffic =
            snapData?.traffic ||
            snapData?.linksTraffic ||
            snapData?.liveTraffic ||
            {};
        }

        if (cancelled) return;

        const nextNodes = toNodeArray(nodesRaw, positionsRaw);
        const nodeIds = new Set(nextNodes.map((n) => n.id));
        const nextLinks = toLinkArray(linksRaw).filter(
          (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
        );

        setNodes(nextNodes);
        setLinks(nextLinks);
        setTrafficMap(nextTraffic || {});
        setSelectedId(nextNodes[0]?.id || "");
      } catch (err) {
        if (cancelled) return;

        const nextNodes = toNodeArray(FALLBACK_NODES, FALLBACK_POSITIONS);
        const nextLinks = toLinkArray(FALLBACK_LINKS);

        setErrorText(err?.message || "Failed to load topology data.");
        setNodes(nextNodes);
        setLinks(nextLinks);
        setTrafficMap({});
        setSelectedId(nextNodes[0]?.id || "");
      } finally {
        if (!cancelled) {
  setLoading(false);
  setFirstLoadDone(true);
}
      }
    }

    load();
    const timer = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const viewBoxWidth = 1800;
      const viewBoxHeight = 900;

      const x = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
      const y = ((e.clientY - rect.top) / rect.height) * viewBoxHeight;

      const { nodeId } = dragRef.current;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                x: Math.max(30, Math.min(viewBoxWidth - 30, x)),
                y: Math.max(30, Math.min(viewBoxHeight - 30, y)),
              }
            : n
        )
      );
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const selectedNode = selectedId ? nodeMap[selectedId] || null : null;
  const selectedLink = selectedLinkId ? links.find((l) => l.id === selectedLinkId) || null : null;
  const selectedLinkTraffic = selectedLink ? pickTrafficForLink(selectedLink, trafficMap) : null;

  const stats = useMemo(() => {
    const counts = { core: 0, router: 0, radio: 0, mk: 0, tp: 0, edge: 0 };
    for (const n of nodes) {
      const t = String(n.type || "").toLowerCase();
      if (t in counts) counts[t] += 1;
    }
    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      core: counts.core,
      mk: counts.mk,
      tp: counts.tp,
      edge: counts.edge,
    };
  }, [nodes, links]);

  async function saveLayout() {
    try {
      const payload = Object.fromEntries(
        nodes.map((n) => [n.id, { x: Number(n.x), y: Number(n.y) }])
      );

      const res = await fetch("/api/topology/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save layout failed");
      setSaveText("Layout saved.");
      setTimeout(() => setSaveText(""), 2000);
    } catch (err) {
      setSaveText(err?.message || "Save layout failed.");
      setTimeout(() => setSaveText(""), 3000);
    }
  }

  function resetLayout() {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: FALLBACK_POSITIONS[n.id]?.x ?? n.x,
        y: FALLBACK_POSITIONS[n.id]?.y ?? n.y,
      }))
    );
    setSaveText("Layout reset locally.");
    setTimeout(() => setSaveText(""), 2000);
  }

  return (
    <div
      style={{
        padding: 16,
        color: "#e5e7eb",
        background: "#0b1020",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Network Map</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            Drag nodes • Save layout • Link traffic labels
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={saveLayout} style={buttonStyle}>Save Layout</button>
          <button onClick={resetLayout} style={buttonStyle}>Reset Layout</button>
          <StatBox label="Nodes" value={stats.totalNodes} />
          <StatBox label="Links" value={stats.totalLinks} />
          <StatBox label="Core" value={stats.core} />
          <StatBox label="MK" value={stats.mk} />
          <StatBox label="TP" value={stats.tp} />
          <StatBox label="Edge" value={stats.edge} />
        </div>
      </div>

      {saveText ? (
        <div style={{ marginBottom: 10, color: "#93c5fd", fontSize: 13, fontWeight: 700 }}>
          {saveText}
        </div>
      ) : null}

      {loading ? (
        <Panel>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Loading topology...</div>
        </Panel>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 16,
          }}
        >
          <Panel>
            {errorText ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: 10,
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#fecaca",
                  fontSize: 13,
                }}
              >
                {errorText}
              </div>
            ) : null}

            <div
              style={{
                width: "100%",
                overflow: "auto",
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background:
                  "radial-gradient(circle at top, rgba(30,41,59,0.9), rgba(2,6,23,0.98))",
              }}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 1800 900"
                style={{ width: "100%", height: "auto", display: "block" }}
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth="1" />
                  </pattern>
                </defs>

                <rect x="0" y="0" width="1800" height="900" fill="url(#grid)" />

                {links.map((link) => {
                  const source = nodeMap[link.source];
                  const target = nodeMap[link.target];
                  if (!source || !target) return null;

                  const mx = (source.x + target.x) / 2;
                  const my = (source.y + target.y) / 2;
                  const traffic = pickTrafficForLink(link, trafficMap);
                  const rx = traffic?.rxMbps ?? traffic?.rx ?? null;
                  const tx = traffic?.txMbps ?? traffic?.tx ?? null;
                  const active = selectedLinkId === link.id;

                  return (
                    <g key={link.id} onClick={() => setSelectedLinkId(link.id)} style={{ cursor: "pointer" }}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={active ? "#f8fafc" : "rgba(96,165,250,0.7)"}
                        strokeWidth={active ? 4 : 3}
                      />
                      <rect
                        x={mx - 58}
                        y={my - 16}
                        width="116"
                        height="24"
                        rx="8"
                        fill="rgba(2,6,23,0.88)"
                        stroke="rgba(148,163,184,0.22)"
                      />
                      <text
                        x={mx}
                        y={my}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#e5e7eb"
                        fontSize="12"
                        fontWeight="700"
                      >
                        RX {formatMbps(rx)} | TX {formatMbps(tx)}
                      </text>
                    </g>
                  );
                })}

                {nodes.map((node) => {
                  const active = selectedId === node.id;
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        dragRef.current = { nodeId: node.id };
                      }}
                      style={{ cursor: "grab" }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={active ? 28 : 24}
                        fill={nodeColor(node.type)}
                        stroke={active ? "#ffffff" : "rgba(255,255,255,0.35)"}
                        strokeWidth={active ? 3 : 1.5}
                      />
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fill="#e5e7eb"
                        fontSize="16"
                        fontWeight="700"
                      >
                        {node.label}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 68}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="13"
                      >
                        {node.ip}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Panel>

          <Panel>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Details</div>

            {selectedNode ? (
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                <InfoRow label="Name" value={selectedNode.label} />
                <InfoRow label="ID" value={selectedNode.id} />
                <InfoRow label="IP" value={selectedNode.ip} />
                <InfoRow label="Type" value={selectedNode.type} />
                <InfoRow label="Port" value={selectedNode.port || "-"} />
                <InfoRow label="IfIndex" value={selectedNode.ifIndex || "-"} />
                <InfoRow label="X" value={selectedNode.x} />
                <InfoRow label="Y" value={selectedNode.y} />
              </div>
            ) : null}

            {selectedLink ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>Selected Link</div>
                <InfoRow label="Link ID" value={selectedLink.id} />
                <InfoRow label="Source" value={selectedLink.source} />
                <InfoRow label="Target" value={selectedLink.target} />
                <InfoRow
                  label="RX"
                  value={formatMbps(selectedLinkTraffic?.rxMbps ?? selectedLinkTraffic?.rx ?? null)}
                />
                <InfoRow
                  label="TX"
                  value={formatMbps(selectedLinkTraffic?.txMbps ?? selectedLinkTraffic?.tx ?? null)}
                />
              </div>
            ) : null}
          </Panel>
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  background: "rgba(15,23,42,0.92)",
  color: "#e5e7eb",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

