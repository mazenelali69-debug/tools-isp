import React from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ active, setActive, actions, children }) {
  return (
    <div className="ti-app">
      <Sidebar active={active} setActive={setActive} />

      <div className="ti-main">
        <header className="ti-topbar ti-topbar--tight">
          <div className="ti-topbar__left">
            <div className="ti-topbar__eyebrow">Mission Control</div>
            <div className="ti-topbar__title">Network Operations Workspace</div>
          </div>

          <div className="ti-topbar__actions">
            <button type="button" className="ti-btn ti-btn--ghost" onClick={actions?.onNewPing}>
              New Ping
            </button>
            <button type="button" className="ti-btn ti-btn--ghost" onClick={actions?.onNewMonitor}>
              New Monitor
            </button>
            <button type="button" className="ti-btn ti-btn--primary" onClick={actions?.onNewNote}>
              New Note
            </button>
          </div>
        </header>

        <main className="ti-content ti-content--tight">
          {children}
        </main>
      </div>
    </div>
  );
}
