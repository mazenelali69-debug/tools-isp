import React from "react";

const TITLES = {
  dashboard: "Dashboard",
  monitors: "Monitors",
  ping: "Ping",
  tools: "Tools",
  settings: "Settings",
};

export default function Topbar({ active, actions }) {
  return (
    <header className="topbar">
      <div className="topbarTitle">{TITLES[active] ?? "tools-isp"}</div>
      <div className="topbarActions">{actions?.onNewPing && (
  <button className="topBtn" onClick={actions.onNewPing} title="New Ping">+ Ping</button>
)}
{actions?.onNewMonitor && (
  <button className="topBtn" onClick={actions.onNewMonitor} title="New Monitor">+ Monitor</button>
)}
{actions?.onNewNote && (
  <button className="topBtn" onClick={actions.onNewNote} title="New Note">+ Note</button>
)}</div>
    </header>
  );
}







