import React, { useState } from "react";
import AppShell from "./layout/AppShell";
import LegacyApp from "./App.legacy";

export default function App(){
  const [active, setActive] = useState("dashboard");
  return (
    <AppShell active={active} setActive={setActive}>
      <LegacyApp />
    </AppShell>
  );
}
