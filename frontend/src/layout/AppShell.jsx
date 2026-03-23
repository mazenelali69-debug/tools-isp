import React from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ active, setActive, actions, children }) {
  return (
    <div className="ti-app">
      <Sidebar active={active} setActive={setActive} />

      <div className="ti-main">
        <header className="ti-topbar ti-topbar--tight">
          <div className="ti-topbar__left">
            <div className="ti-topbar__eyebrow"><span className="nocGlow">NocoMment Work tools • WhatsApp 70411518 • mazenelali69@gmail.com</span></div>
            
          </div>

          <div className="ti-topbar__actions">
            <button type="button" className="ti-btn ti-btn--ghost" onClick={actions?.onNewPing}>
              + Ping
            </button>
            <button type="button" className="ti-btn ti-btn--ghost" onClick={actions?.onNewMonitor}>
              + Monitor
            </button>
            <button type="button" className="ti-btn ti-btn--primary" onClick={actions?.onNewNote}>
              + Note
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









