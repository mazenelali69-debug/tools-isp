import React from "react";

const TITLES = {
  dashboard: "Dashboard",
  monitors: "Monitors",
  ping: "Ping",
  tools: "Tools",
  settings: "Settings",
};

export default function Topbar({ active, actions }) {
  const title = TITLES[active] ?? "tools-isp";

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <div className="topbarTitle">{title}</div>
        <div className="topbarSub">Windows workspace • drag / resize</div>
      </div>

      <div className="topbarActions">
        {actions?.onNewPing && (
          <button className="topBtn" onClick={actions.onNewPing} title="New Ping (Ctrl+P)">
            + Ping <span className="topKey">Ctrl+P</span>
          </button>
        )}
        {actions?.onNewMonitor && (
          <button className="topBtn" onClick={actions.onNewMonitor} title="New Monitor (Ctrl+M)">
            + Monitor <span className="topKey">Ctrl+M</span>
          </button>
        )}
        {actions?.onNewNote && (
          <button className="topBtn" onClick={actions.onNewNote} title="New Note (Ctrl+N)">
            + Note <span className="topKey">Ctrl+N</span>
          </button>
        )}
      </div>
    </header>
  );
}
