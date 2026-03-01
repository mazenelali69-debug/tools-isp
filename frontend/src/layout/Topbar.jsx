import React from "react";

const TITLES = {
  dashboard: "Dashboard",
  monitors: "Monitors",
  ping: "Ping",
  tools: "Tools",
  settings: "Settings",
};

export default function Topbar({ active }) {
  return (
    <header className="topbar">
      <div className="topbarTitle">{TITLES[active] ?? "tools-isp"}</div>
      <div className="topbarActions">{/* later */}</div>
    </header>
  );
}
