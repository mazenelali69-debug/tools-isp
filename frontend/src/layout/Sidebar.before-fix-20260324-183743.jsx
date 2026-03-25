import React, { useMemo, useState } from "react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "â—«" },
  { id: "tplinkjetstream", label: "TP-Link-JETStream", icon: "â—‰" },
  { id: "neighbors", label: "Neighbors", icon: "â—Ž" },
  { id: "liveping", label: "Latency LIVE", icon: "â—Œ" },
  { id: "ethernet", label: "Bandwidth LIVE", icon: "â‡„" },
  { id: "uplink", label: "UPLINK Traffic", icon: "â–²" },
  { id: "combined", label: "Combined Traffic", icon: "â—ˆ" },
  { id: "history", label: "History", icon: "â—·" },
  { id: "aviatwtm4200", label: "AviatWTM4200", icon: "â–£" },
  { id: "aviathistory", label: "Aviat History", icon: "â—«" },
  { id: "monitorstreet", label: "Monitor Street", icon: "â—”" },
  { id: "networkmap", label: "Network Map", icon: "âŒ˜" },
  { id: "isptopology", label: "ISP Topology", icon: "â—‰" },
  { id: "weathertripoli", label: "Weather Tripoli", icon: "â˜" }
];

export default function Sidebar({ active, setActive }) {

  function handleLogout() {
    localStorage.removeItem("noc_token");
    localStorage.removeItem("noc_user");
    window.location.reload();
  }
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => NAV, []);

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
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "Â»" : "Â«"}
        </button>
      </div>

      <div className="ti-side__sectionLabel">
        {!collapsed ? "Navigation" : "â€¢"}
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
</nav>

<button
  type="button"
  className="ti-side__item"
  onClick={handleLogout}
  title="Logout"
>
  <span className="ti-side__icon">?</span>
  {!collapsed ? <span className="ti-side__label">Logout</span> : null}
</button>

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

















