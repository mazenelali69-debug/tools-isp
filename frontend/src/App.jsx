import React, { useMemo, useState } from "react";
import AppShell from "./layout/AppShell";
import Workspace from "./workspace/Workspace";
import LegacyApp from "./App.legacy";

function uid(){
  return "w_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export default function App(){
  const [active, setActive] = useState("dashboard");
  const [windows, setWindows] = useState([]);

  function openWin(type){
    const id = uid();
    const base = {
        id,
      type,
      title: type === "ping" ? "Ping — 88.88.88.10" : type === "monitor" ? "Monitor" : "Note",
      x: 140 + (windows.length * 18),
      y: 120 + (windows.length * 14),
      w: type === "note" ? 420 : 560,
      h: type === "note" ? 320 : 340,
      z: 10 + windows.length
    };
    setWindows(prev => [...prev, base]);
  }

  const actions = useMemo(() => ({
    onNewPing: () => openWin("ping"),
    onNewMonitor: () => openWin("monitor"),
    onNewNote: () => openWin("note"),
  }), [windows]);

  return (
    <AppShell active={active} setActive={setActive} actions={actions}>
      <Workspace windows={windows} setWindows={setWindows}>
        <LegacyApp />
      </Workspace>
    </AppShell>
  );
}

