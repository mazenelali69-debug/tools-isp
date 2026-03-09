import React, { useMemo, useState } from "react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "neighbors", label: "Neighbors", icon: "🧭" },
  { id: "liveping", label: "Latency LIVE", icon: "📶" },
  { id: "ethernet", label: "Bandwidth LIVE", icon: "↔" },
  { id: "uplink", label: "UPLINK Traffic", icon: "📡" },
  { id: "combined", label: "Combined Traffic", icon: "📊" },
  { id: "history", label: "History", icon: "🕘" },
  { id: "aviatwtm4200", label: "AviatWTM4200", icon: "📶" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => NAV, []);

  return (
    <aside className={"side" + (collapsed ? " side--collapsed" : "")}>
      <div className="sideHead">
        <div className="sideBrand" title="tools-isp">
          <span className="sideLogo">🛠️</span>
          {!collapsed && <span className="sideTitle">tools-isp</span>}
        </div>

        <button
          className="sideBtn"
          onClick={() => setCollapsed(v => !v)}
          title="Toggle"
          type="button"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="sideNav">
        {items.map(it => (
          <button
            key={it.id}
            className={"sideItem" + (active === it.id ? " isActive" : "")}
            onClick={() => setActive(it.id)}
            title={it.label}
            type="button"
          >
            <span className="sideIcon">{it.icon}</span>
            {!collapsed && <span className="sideLabel">{it.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sideFoot">
        {!collapsed && <div className="sideHint">Layout → Workspace → Polish</div>}
      </div>
    </aside>
  );
}
