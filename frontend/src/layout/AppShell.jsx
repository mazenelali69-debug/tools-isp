import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function AppShell({ active, setActive, children }) {
  return (
    <div className="appShell">
      <Sidebar active={active} setActive={setActive} />
      <div className="appMain">
        <Topbar active={active} />
        <div className="appContent">{children}</div>
      </div>
    </div>
  );
}
