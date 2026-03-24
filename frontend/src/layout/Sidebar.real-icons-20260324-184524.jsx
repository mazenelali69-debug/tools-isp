import React, { useMemo, useState } from "react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "•" },
  { id: "tplinkjetstream", label: "TP-Link-JETStream", icon: "•" },
  { id: "neighbors", label: "Neighbors", icon: "•" },
  { id: "liveping", label: "Latency LIVE", icon: "•" },
  { id: "ethernet", label: "Bandwidth LIVE", icon: "•" },
  { id: "uplink", label: "UPLINK Traffic", icon: "•" },
  { id: "combined", label: "Combined Traffic", icon: "•" },
  { id: "history", label: "History", icon: "•" },
  { id: "aviatwtm4200", label: "AviatWTM4200", icon: "•" },
  { id: "aviathistory", label: "Aviat History", icon: "•" },
  { id: "monitorstreet", label: "Monitor Street", icon: "•" },
  { id: "networkmap", label: "Network Map", icon: "•" },
  { id: "isptopology", label: "ISP Topology", icon: "•" },
  { id: "weathertripoli", label: "Weather Tripoli", icon: "•" }
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => NAV, []);

  function handleLogout() {
    localStorage.removeItem("noc_token");
    localStorage.removeItem("noc_user");
    window.location.reload();
  }

  return (
    <aside className={"ti-side" + (collapsed ? " is-collapsed" : "")}>
      <div className="ti-side__top">
        <div className="ti-brand" title="tools-isp">
          <div className="ti-brand__mark">TI</div>
          {!collapsed ? (
            <div className="ti-brand__text">
              <div className="ti-brand__title">tools-isp</div>
              <div className="ti-brand__sub">NOC Premium</div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="ti-side__toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <div className="ti-side__sectionLabel">
        {!collapsed ? "Navigation" : "•"}
      </div>

      <nav className="ti-side__nav">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={"ti-side__item" + (active === it.id ? " is-active" : "")}
            onClick={() => setActive(it.id)}
            title={it.label}
          >
            <span className="ti-side__icon">{it.icon}</span>
            {!collapsed ? <span className="ti-side__label">{it.label}</span> : null}
          </button>
        ))}

        <button
          type="button"
          className="ti-side__item"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="ti-side__icon">•</span>
          {!collapsed ? <span className="ti-side__label">Logout</span> : null}
        </button>
      </nav>

      <div className="ti-side__foot">
        {!collapsed ? (
          <>
            <div className="ti-side__footTitle">Powered by Nocomment</div>
            <div className="ti-side__footText">70411518</div>
          </>
        ) : null}
      </div>
    </aside>
  );
}



