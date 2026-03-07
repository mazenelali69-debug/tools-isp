import React from "react";
import Workspace from "../workspace/Workspace";
import LegacyApp from "../App.legacy";
import PingStatusBoxes from "../components/PingStatusBoxes";

export default function DashboardPage({ windows, setWindows }){
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          Dashboard
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          Legacy workspace inside polished shell

<PingStatusBoxes />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          padding: 14,
          background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 18px 40px rgba(0,0,0,.22)",
          minHeight:"0"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(circle at top right, rgba(0,255,220,.08), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.08), transparent 35%)"
          }}
        />

        <style>{`
          .dashboardLegacyHost h2,
          .dashboardLegacyHost > div > div[style*="margin-bottom: 10"],
          .dashboardLegacyHost > div > div[style*="grid-template-columns: 1fr 1fr 1fr 1fr"],
          .dashboardLegacyHost > div > div[style*="margin-top: 10"],
          .dashboardLegacyHost .dd,
          .dashboardLegacyHost button[onClick],
          .dashboardLegacyHost hr {
            display: none !important;
          }
        `}</style>

        <div className="dashboardLegacyHost" style={{ position: "relative", zIndex: 1 }}>
          <Workspace windows={windows} setWindows={setWindows}>
            <LegacyApp />
          </Workspace>
        </div>
      </div>
    </div>
  );
}



