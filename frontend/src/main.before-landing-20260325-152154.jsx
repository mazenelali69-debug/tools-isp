import "./theme.css";
import { StrictMode, useEffect, useMemo, useState } from "react";
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
    return sessionStorage.getItem("noc_token") === "ok";
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    let timer;

    const logoutNow = () => {
      try { sessionStorage.removeItem("noc_token"); } catch {}
      try { sessionStorage.removeItem("noc_user"); } catch {}
      setIsLoggedIn(false);
      window.location.reload();
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logoutNow, 15 * 60 * 1000);
    };

    ["mousemove", "keydown", "click", "scroll"].forEach((evt) => {
      window.addEventListener(evt, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "click", "scroll"].forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
    };
  }, [isLoggedIn]);

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


