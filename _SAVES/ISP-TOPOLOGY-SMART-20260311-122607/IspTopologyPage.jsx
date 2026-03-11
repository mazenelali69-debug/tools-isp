import React from "react";

const nodes = [
  { id:"up1",  label:"155.15.59.4", type:"upstream", x:520, y:70 },
  { id:"up2",  label:"122.24.30.4", type:"upstream", x:700, y:70 },

  { id:"c1", label:"88.88.88.254", type:"core", x:360, y:210 },
  { id:"c2", label:"88.88.88.253", type:"core", x:500, y:210 },
  { id:"c3", label:"88.88.88.252", type:"core", x:640, y:210 },
  { id:"c4", label:"88.88.88.251", type:"core", x:780, y:210 },
  { id:"c5", label:"10.88.88.254", type:"core", x:920, y:210 },

  { id:"r1",  label:"88.88.88.250", type:"router", x:180, y:390 },
  { id:"r2",  label:"88.88.88.249", type:"router", x:300, y:390 },
  { id:"r3",  label:"88.88.88.1",   type:"router", x:420, y:390 },
  { id:"r4",  label:"88.88.88.2",   type:"router", x:540, y:390 },
  { id:"r5",  label:"88.88.88.4",   type:"router", x:660, y:390 },
  { id:"r6",  label:"88.88.88.5",   type:"router", x:780, y:390 },
  { id:"r7",  label:"88.88.88.6",   type:"router", x:900, y:390 },
  { id:"r8",  label:"88.88.88.7",   type:"router", x:1020, y:390 },

  { id:"r9",  label:"88.88.88.9",    type:"router", x:240, y:550 },
  { id:"r10", label:"88.88.88.10",   type:"router", x:360, y:550 },
  { id:"r11", label:"88.88.88.11",   type:"router", x:480, y:550 },
  { id:"r12", label:"88.88.88.12",   type:"router", x:600, y:550 },
  { id:"r13", label:"88.88.88.13",   type:"router", x:720, y:550 },
  { id:"r14", label:"88.88.88.14",   type:"router", x:840, y:550 },
  { id:"r15", label:"88.88.88.15",   type:"router", x:960, y:550 },
  { id:"r16", label:"10.88.88.111",  type:"router", x:1080, y:550 }
];

const links = [
  ["up1","c2"], ["up2","c4"],
  ["c1","c2"], ["c2","c3"], ["c3","c4"], ["c4","c5"],

  ["c1","r1"], ["c1","r2"],
  ["c2","r3"], ["c2","r4"],
  ["c3","r5"], ["c3","r6"],
  ["c4","r7"], ["c4","r8"],

  ["c1","r9"], ["c2","r10"], ["c2","r11"], ["c3","r12"],
  ["c3","r13"], ["c4","r14"], ["c5","r15"], ["c5","r16"]
];

function getNodeStyle(type) {
  if (type === "upstream") {
    return { fill: "#f7c948", stroke: "#ffe08a", glow: "rgba(247, 201, 72, 0.45)", r: 16 };
  }
  if (type === "core") {
    return { fill: "#23c9ff", stroke: "#8ae7ff", glow: "rgba(35, 201, 255, 0.35)", r: 18 };
  }
  return { fill: "#35f2a1", stroke: "#9cffd6", glow: "rgba(53, 242, 161, 0.28)", r: 14 };
}

function NodeCard({ node }) {
  const s = getNodeStyle(node.type);
  return (
    <g>
      <circle cx={node.x} cy={node.y} r={s.r + 10} fill={s.glow} />
      <circle cx={node.x} cy={node.y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth="2.5" />
      <text
        x={node.x}
        y={node.y + 34}
        textAnchor="middle"
        fill="#dbe7ff"
        fontSize="12"
        fontWeight="600"
      >
        {node.label}
      </text>
    </g>
  );
}

export default function IspTopologyPage() {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div style={{
      minHeight: "100%",
      padding: "22px",
      background:
        "radial-gradient(circle at top left, rgba(0,170,255,0.14), transparent 30%), radial-gradient(circle at top right, rgba(120,80,255,0.12), transparent 28%), linear-gradient(180deg, #07111f 0%, #040b16 100%)",
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
          ISP Topology v1
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
          Backbone Graph
        </div>
        <div style={{ marginTop: 10, color: "#a8bddf", fontSize: 14 }}>
          Static safe start — Upstream → Core → Branches
        </div>
      </div>

      <div style={{
        border: "1px solid rgba(120,160,255,0.18)",
        borderRadius: 24,
        overflow: "auto",
        background: "rgba(4, 11, 22, 0.62)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
      }}>
        <div style={{ minWidth: 1280, padding: 24 }}>
          <svg width="1240" height="700" viewBox="0 0 1240 700">
            <defs>
              <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(120,160,255,0.08)" strokeWidth="1" />
              </pattern>
            </defs>

            <rect x="0" y="0" width="1240" height="700" fill="url(#grid)" rx="24" />

            <text x="560" y="26" fill="#f8d66d" fontSize="15" fontWeight="700">UPSTREAM / TRANSPORT</text>
            <text x="555" y="168" fill="#74dcff" fontSize="15" fontWeight="700">MAIN SWITCHES / CORE</text>
            <text x="540" y="348" fill="#64f0b1" fontSize="15" fontWeight="700">MAIN ROUTERS / BRANCHES</text>

            {links.map((pair, i) => {
              const a = byId[pair[0]];
              const b = byId[pair[1]];
              return (
                <g key={i}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(80, 155, 255, 0.18)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(120, 205, 255, 0.72)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {nodes.map(node => <NodeCard key={node.id} node={node} />)}
          </svg>
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 16
      }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(247, 201, 72, 0.12)",
          border: "1px solid rgba(247, 201, 72, 0.22)",
          color: "#ffe08a",
          fontWeight: 700,
          fontSize: 13
        }}>
          Upstream
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(35, 201, 255, 0.12)",
          border: "1px solid rgba(35, 201, 255, 0.22)",
          color: "#91ecff",
          fontWeight: 700,
          fontSize: 13
        }}>
          Core Switches
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(53, 242, 161, 0.12)",
          border: "1px solid rgba(53, 242, 161, 0.22)",
          color: "#9cffd6",
          fontWeight: 700,
          fontSize: 13
        }}>
          Branch Routers
        </div>
      </div>
    </div>
  );
}
