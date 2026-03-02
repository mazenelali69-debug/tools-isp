import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function AppShell({ active, setActive, actions, children }) {
  return (
    <div className="appShell">
      <Sidebar active={active} setActive={setActive} />
      <div className="appMain">
        <Topbar active={active} actions={actions} />
        <div className="appContent">{children}</div>
      </div>
    </div>
  );
}

