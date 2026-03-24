import React, { useEffect, useMemo, useState } from "react";

const FALLBACK_NODES = {
  "core-254": {
    id: "core-254",
    name: "Core SW 254",
    ip: "88.88.88.254",
    type: "core",
    x: 180,
    y: 180,
  },
  "core-10-254": {
    id: "core-10-254",
    name: "Core SW 10.254",
    ip: "10.88.88.254",
    type: "core",
    x: 520,
    y: 180,
  },
  "radio1": {
    id: "radio1",
    name: "Aviat WTM4200",
    ip: "88.88.88.1",
    type: "radio",
    x: 350,
    y: 70,
  },
  "router1": {
    id: "router1",
    name: "Main Router",
    ip: "10.88.88.1",
    type: "router",
    x: 350,
    y: 320,
  },
};

const FALLBACK_LINKS = [
  { id: "l1", source: "radio1", target: "core-254" },
  { id: "l2", source: "core-254", target: "core-10-254" },
  { id: "l3", source: "core-10-254", target: "router1" },
];

function normalizeNodes(rawNodes, rawPositions) {
  const nodesObj = rawNodes && typeof rawNodes === "object" && !Array.isArray(rawNodes)
    ? rawNodes
    : {};

  const positionsObj = rawPositions && typeof rawPositions === "object" && !Array.isArray(rawPositions)
    ? rawPositions
    : {};

  const entries = Object.entries(nodesObj).map(([key, value]) => {
    const pos = positionsObj[key] || {};
    return {
      id: value?.id || key,
      name: value?.name || key,
      ip: value?.ip || "-",
      type: value?.type || "node",
      x: Number.isFinite(Number(pos.x)) ? Number(pos.x) : Number(value?.x ?? 120),
      y: Number.isFinite(Number(pos.y)) ? Number(pos.y) : Number(value?.y ?? 120),
      raw: value || {},
    };
  });

  if (entries.length > 0) return entries;

  return Object.values(FALLBACK_NODES);
}

function normalizeLinks(rawLinks) {
  if (Array.isArray(rawLinks) && rawLinks.length > 0) {
    return rawLinks
      .filter((x) => x && x.source && x.target)
      .map((x, i) => ({
        id: x.id || `link-${i}`,
        source: x.source,
        target: x.target,
      }));
  }

  return FALLBACK_LINKS;
}

function getNodeColor(type) {
  switch (String(type || "").toLowerCase()) {
    case "core":
      return "#60a5fa";
    case "router":
      return "#34d399";
    case "radio":
      return "#f59e0b";
    case "switch":
      return "#a78bfa";
    case "tp":
      return "#f472b6";
    case "mk":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
}

export default function IspTopologyPage() {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorText("");

      try {
        const [nodesRes, positionsRes, linksRes] = await Promise.allSettled([
          fetch("/api/topology/nodes", { cache: "no-store" }),
          fetch("/api/topology/positions", { cache: "no-store" }),
          fetch("/api/topology/links", { cache: "no-store" }),
        ]);

        const nodesRaw = await nodesRes.value.json();
const nodesJson = nodesRaw?.data || nodesRaw || {};
            : {};

        const positionsRaw = await positionsRes.value.json();
const positionsJson = positionsRaw?.data || positionsRaw || {};
            : {};

        const linksRaw = await linksRes.value.json();
const linksJson = linksRaw?.data || linksRaw || [];
            : [];

        if (cancelled) return;

        const nextNodes = normalizeNodes(nodesJson, positionsJson);
        const nextLinks = normalizeLinks(linksJson);

        setNodes(nextNodes);
        setLinks(nextLinks);
        setSelectedId((prev) => prev || nextNodes[0]?.id || "");
      } catch (err) {
        if (cancelled) return;

        setErrorText(err?.message || "Failed to load Network Map.");
        setNodes(Object.values(FALLBACK_NODES));
        setLinks(FALLBACK_LINKS);
        setSelectedId("core-254");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const nodeMap = useMemo(() => {
    return Object.fromEntries(nodes.map((n) => [n.id, n]));
  }, [nodes]);

  const selectedNode = selectedId ? nodeMap[selectedId] || null : null;

  const stats = useMemo(() => {
    const byType = {};
    for (const n of nodes) {
      const key = String(n.type || "node").toLowerCase();
      byType[key] = (byType[key] || 0) + 1;
    }

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      core: byType.core || 0,
      router: byType.router || 0,
      radio: byType.radio || 0,
      switch: byType.switch || 0,
    };
  }, [nodes, links]);

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
            Clean rebuilt topology page
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <StatBox label="Nodes" value={stats.totalNodes} />
          <StatBox label="Links" value={stats.totalLinks} />
          <StatBox label="Core" value={stats.core} />
          <StatBox label="Routers" value={stats.router} />
          <StatBox label="Radio" value={stats.radio} />
        </div>
      </div>

      {loading ? (
        <Panel>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Loading Network Map...</div>
        </Panel>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
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
              <svg viewBox="0 0 900 520" style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
                  </pattern>
                </defs>

                <rect x="0" y="0" width="900" height="520" fill="url(#grid)" />

                {links.map((link) => {
                  const source = nodeMap[link.source];
                  const target = nodeMap[link.target];
                  if (!source || !target) return null;

                  return (
                    <line
                      key={link.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="rgba(96,165,250,0.7)"
                      strokeWidth="3"
                    />
                  );
                })}

                {nodes.map((node) => {
                  const active = selectedId === node.id;
                  const fill = getNodeColor(node.type);

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={active ? 28 : 24}
                        fill={fill}
                        stroke={active ? "#ffffff" : "rgba(255,255,255,0.35)"}
                        strokeWidth={active ? 3 : 1.5}
                      />
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fill="#e5e7eb"
                        fontSize="14"
                        fontWeight="700"
                      >
                        {node.name}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 66}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="12"
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
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Node Details</div>

            {selectedNode ? (
              <div style={{ display: "grid", gap: 10 }}>
                <InfoRow label="Name" value={selectedNode.name} />
                <InfoRow label="ID" value={selectedNode.id} />
                <InfoRow label="IP" value={selectedNode.ip} />
                <InfoRow label="Type" value={selectedNode.type} />
                <InfoRow label="X" value={String(selectedNode.x)} />
                <InfoRow label="Y" value={String(selectedNode.y)} />
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No node selected.</div>
            )}
          </Panel>
        </div>
      )}
    </div>
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
        minWidth: 86,
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
        {value}
      </div>
    </div>
  );
}

