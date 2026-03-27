import AviatHistoryPage from "./pages/AviatHistoryPage.jsx";
import IspTopologyPage from "./pages/IspTopologyPage.jsx";
import React, { useMemo, useState, useEffect } from "react";
import HistoryPage from "./pages/HistoryPage";
import EthernetTrafficPage from "./pages/EthernetTrafficPage";
import UplinkTrafficPage from "./pages/UplinkTrafficPage";
import CombinedTrafficPage from "./pages/CombinedTrafficPage";
import AviatWTM4200Page from "./pages/AviatWTM4200Page";
import DashboardPage from "./pages/DashboardPage";
import AppShell from "./layout/AppShell";
import NeighborsPanel from "./NeighborsPanel";
import LivePingPage from "./pages/LivePingPage";
import MonitorStreetPage from "./pages/MonitorStreetPage";
import MikroTikUptimePage from "./pages/MikroTikUptimePage";
import TpLinkJetstreamPage from "./pages/TpLinkJetstreamPage";
import WeatherTripoliPageV3 from "./pages/WeatherTripoliPageV3.jsx";
import Workspace from "./workspace/Workspace";

const STORAGE_KEY = "toolsisp_windows_v1";

function uid() {
  return "w_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export default function App() {
  const [active, setActive] = useState("dashboard");

  const [windows, setWindows] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
    } catch {}
  }, [windows]);

  function openWin(type) {
    const id = uid();
    const base = {
      id,
      type,
      ip: type === "ping" ? "88.88.88.10" : undefined,
      community: type === "monitor" ? "public" : undefined,
      title:
        type === "ping" ? "Ping - 88.88.88.10" :
        type === "monitor" ? "Monitor" :
        "Note",
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
    onNewNote: () => openWin("note")
  }), [windows]);

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        openWin("ping");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        openWin("monitor");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openWin("note");
      }
      if (e.key === "Escape") {
        setWindows(prev => {
          if (!prev.length) return prev;
          const sorted = [...prev].sort((a, b) => (b.z ?? 0) - (a.z ?? 0));
          const top = sorted[0];
          return prev.filter(w => w.id !== top.id);
        });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [windows]);

  return (
    <AppShell active={active} setActive={setActive} actions={actions}>
      {active === "dashboard" ? (
        <Workspace windows={windows} setWindows={setWindows}><DashboardPage windows={windows} setWindows={setWindows} /></Workspace>
      ) : active === "tplinkjetstream" ? (
        <TpLinkJetstreamPage />
      ) : active === "neighbors" ? (
        <NeighborsPanel />
      ) : active === "liveping" ? (
        <LivePingPage />
      ) : active === "aviatwtm4200" ? (
        <AviatWTM4200Page />
      ) : active === "aviathistory" ? (
        <AviatHistoryPage />
      ) : active === "combined" ? (
        <CombinedTrafficPage />
      ) : active === "ethernet" ? (
        <EthernetTrafficPage />
      ) : active === "uplink" ? (
        <UplinkTrafficPage />
      ) : active === "history" ? (
        <HistoryPage />
      ) : active === "monitorstreet" ? (
        <MonitorStreetPage />
      ) : active === "networkmap" ? (
        <MikroTikUptimePage />
      ) : active === "isptopology" ? (
        <IspTopologyPage />
      ) : active === "weathertripoli" ? (
        <WeatherTripoliPageV3 />
      ) : (
        <Workspace windows={windows} setWindows={setWindows}><DashboardPage windows={windows} setWindows={setWindows} /></Workspace>
      )}
    </AppShell>
  );
}














