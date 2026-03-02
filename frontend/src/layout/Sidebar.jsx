import React, { useMemo, useState } from "react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "monitors",  label: "Monitors",  icon: "📈" },
  { id: "ping",      label: "Ping",      icon: "📡" },
  { id: "tools",     label: "Tools",     icon: "🧰" },
  { id: "settings",  label: "Settings",  icon: "⚙️" },
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => NAV, []);

  return (
    <aside className={"side" + (collapsed ? " side--collapsed" : "")}>
      <div className="sideHead">
        <button className="sideBrand" onClick={() => setActive("dashboard")} title="tools-isp">
          <span className="sideLogo">🛠️</span>
          {!collapsed && (
            <span className="sideTitleWrap">
              <span className="sideTitle">tools-isp</span>
              <span className="sideSub">Workspace UI</span>
            </span>
          )}
        </button>

        <button
          className="sideBtn"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="sideNav" aria-label="Primary">
        {items.map(it => (
          <button
            key={it.id}
            className={"sideItem" + (active === it.id ? " isActive" : "")}
            onClick={() => setActive(it.id)}
            title={it.label}
          >
            <span className="sideIcon">{it.icon}</span>
            {!collapsed && <span className="sideLabel">{it.label}</span>}
            {!collapsed && <span className="sideDot" />}
          </button>
        ))}
      </nav>

      <div className="sideFoot">
        {!collapsed ? (
          <div className="sideHint">
            <div className="sideHintTitle">Shortcuts</div>
            <div className="sideHintRow"><kbd>Ctrl</kbd> + <kbd>P</kbd> Ping</div>
            <div className="sideHintRow"><kbd>Ctrl</kbd> + <kbd>M</kbd> Monitor</div>
            <div className="sideHintRow"><kbd>Ctrl</kbd> + <kbd>N</kbd> Note</div>
            <div className="sideHintRow"><kbd>Esc</kbd> Close top window</div>
          </div>
        ) : (
          <div className="sideHintMini" title="Shortcuts: Ctrl+P / Ctrl+M / Ctrl+N / Esc">⌨️</div>
        )}
      </div>
    </aside>
  );
}
