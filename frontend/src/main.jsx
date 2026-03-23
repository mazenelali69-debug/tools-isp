import "./theme.css";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";

/* UI-PRO-CLASS-START */
try {
  const root = document.documentElement;
  root.classList.remove("uiV2");
  root.classList.add("uiPro");
} catch (e) {}
/* UI-PRO-CLASS-END */

function RootGate() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("noc_token") === "ok";
  });

  const app = useMemo(() => <App />, []);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return app;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootGate />
  </StrictMode>,
);
