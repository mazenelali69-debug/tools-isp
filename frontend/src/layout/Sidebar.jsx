import React, { useMemo, useState } from "react";

function SideIcon({ kind }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block" }
  };

  switch (kind) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "tplinkjetstream":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01" />
          <path d="M7 14h10" />
        </svg>
      );

    case "neighbors":
      return (
        <svg {...common}>
          <circle cx="7" cy="12" r="2.5" />
          <circle cx="17" cy="7" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M9.2 11l5.6-2.8M9.2 13l5.6 2.8" />
        </svg>
      );

    case "liveping":
      return (
        <svg {...common}>
          <path d="M4 12h3l2-5 4 10 2-5h5" />
        </svg>
      );

    case "ethernet":
      return (
        <svg {...common}>
          <path d="M7 7h10v6H7z" />
          <path d="M9 13v4M12 13v4M15 13v4" />
        </svg>
      );

    case "uplink":
      return (
        <svg {...common}>
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </svg>
      );

    case "combined":
      return (
        <svg {...common}>
          <path d="M4 17l5-5 4 3 7-7" />
          <path d="M4 7l5 5 4-3 7 7" />
        </svg>
      );

    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "aviatwtm4200":
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <path d="M7 9l5-5 5 5" />
          <path d="M7 15l5 5 5-5" />
        </svg>
      );

    case "aviathistory":
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M7 15l3-3 3 2 4-5" />
        </svg>
      );

    case "monitorstreet":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M12 7h5l-2 3 2 3h-5" />
          <path d="M12 14H7l2 3-2 3h5" />
        </svg>
      );

    case "networkmap":
      return (
        <svg {...common}>
          <circle cx="6" cy="8" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="17" cy="17" r="2" />
          <circle cx="7" cy="18" r="2" />
          <path d="M8 8h8M7.5 10l8 5M8.5 16h7" />
        </svg>
      );

    case "isptopology":
      return (
        <svg {...common}>
          <rect x="10" y="3" width="4" height="4" rx="1" />
          <rect x="3" y="17" width="4" height="4" rx="1" />
          <rect x="17" y="17" width="4" height="4" rx="1" />
          <path d="M12 7v4M12 11l-7 6M12 11l7 6" />
        </svg>
      );

    case "weathertripoli":
      return (
        <svg {...common}>
          <path d="M6 15a4 4 0 1 1 1.2-7.8A5 5 0 1 1 18 15H6z" />
          <path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
  }
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "tplinkjetstream", label: "TP-Link-JETStream", icon: "tplinkjetstream" },
  { id: "neighbors", label: "Neighbors", icon: "neighbors" },
  { id: "liveping", label: "Latency LIVE", icon: "liveping" },
  { id: "ethernet", label: "Bandwidth LIVE", icon: "ethernet" },
  { id: "uplink", label: "UPLINK Traffic", icon: "uplink" },
  { id: "combined", label: "Combined Traffic", icon: "combined" },
  { id: "history", label: "History", icon: "history" },
  { id: "aviatwtm4200", label: "AviatWTM4200", icon: "aviatwtm4200" },
  { id: "aviathistory", label: "Aviat History", icon: "aviathistory" },
  { id: "monitorstreet", label: "Monitor Street", icon: "monitorstreet" },
  { id: "networkmap", label: "Network Map", icon: "networkmap" },
  { id: "isptopology", label: "ISP Topology", icon: "isptopology" },
  { id: "weathertripoli", label: "Weather Tripoli", icon: "weathertripoli" }
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => NAV, []);

  function handleLogout() {
    sessionStorage.removeItem("noc_token");
    sessionStorage.removeItem("noc_user");
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
            <span className="ti-side__icon"><SideIcon kind={it.icon} /></span>
            {!collapsed ? <span className="ti-side__label">{it.label}</span> : null}
          </button>
        ))}

        <button
          type="button"
          className="ti-side__item"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="ti-side__icon"><SideIcon kind="logout" /></span>
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



