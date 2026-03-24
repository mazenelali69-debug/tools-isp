import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

function makePixels(count, side) {
  return Array.from({ length: count }, (_, i) => {
    const baseX = side === "left" ? 8 : 72;
    const spread = 18;
    return {
      id: `${side}-${i}`,
      x: baseX + Math.random() * spread,
      y: 24 + Math.random() * 46,
      s: 2 + Math.random() * 3.5,
      d: Math.random() * 3,
      o: 0.2 + Math.random() * 0.8,
    };
  });
}

function makeGridDots(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    d: Math.random() * 4,
    o: 0.15 + Math.random() * 0.45,
  }));
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const leftPixels = useMemo(() => makePixels(180, "left"), []);
  const rightPixels = useMemo(() => makePixels(180, "right"), []);
  const dots = useMemo(() => makeGridDots(40), []);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  function submit(e) {
    e.preventDefault();
    const u = String(username || "").trim();
    const p = String(password || "");

    if (u === VALID_USERNAME && p === VALID_PASSWORD) {
      localStorage.setItem("noc_token", "ok");
      localStorage.setItem("noc_user", u);
      setErr("");
      onLogin?.();
      return;
    }

    setErr("Invalid credentials");
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.grid} />
      <div style={styles.centerGlow} />

      {dots.map((d) => (
        <span
          key={d.id}
          className="bg-dot"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            opacity: d.o,
            animationDelay: `${d.d}s`,
          }}
        />
      ))}

      {leftPixels.map((p) => (
        <span
          key={p.id}
          className="px-blink"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.s}px`,
            height: `${p.s}px`,
            opacity: p.o,
            animationDelay: `${p.d}s`,
          }}
        />
      ))}

      {rightPixels.map((p) => (
        <span
          key={p.id}
          className="px-blink"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.s}px`,
            height: `${p.s}px`,
            opacity: p.o,
            animationDelay: `${p.d}s`,
          }}
        />
      ))}

      <svg style={styles.circuits} viewBox="0 0 1000 700" preserveAspectRatio="none">
        <defs>
          <linearGradient id="c1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="55%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* top-left */}
        <path className="circuit-path" d="M150 150 H260 L320 210 H410" />
        <circle className="node-pulse" cx="150" cy="150" r="9" />
        <circle className="node-pulse" cx="260" cy="150" r="7" />
        <circle className="node-pulse" cx="320" cy="210" r="7" />
        <circle className="node-pulse" cx="410" cy="210" r="9" />

        {/* bottom-left */}
        <path className="circuit-path" d="M150 550 H260 L320 490 H410" />
        <circle className="node-pulse" cx="150" cy="550" r="9" />
        <circle className="node-pulse" cx="260" cy="550" r="7" />
        <circle className="node-pulse" cx="320" cy="490" r="7" />
        <circle className="node-pulse" cx="410" cy="490" r="9" />

        {/* top-right */}
        <path className="circuit-path" d="M850 150 H740 L680 210 H590" />
        <circle className="node-pulse" cx="850" cy="150" r="9" />
        <circle className="node-pulse" cx="740" cy="150" r="7" />
        <circle className="node-pulse" cx="680" cy="210" r="7" />
        <circle className="node-pulse" cx="590" cy="210" r="9" />

        {/* bottom-right */}
        <path className="circuit-path" d="M850 550 H740 L680 490 H590" />
        <circle className="node-pulse" cx="850" cy="550" r="9" />
        <circle className="node-pulse" cx="740" cy="550" r="7" />
        <circle className="node-pulse" cx="680" cy="490" r="7" />
        <circle className="node-pulse" cx="590" cy="490" r="9" />
      </svg>

      <div style={styles.panelWrap}>
        <div style={styles.panelOuterGlow} />
        <div style={styles.panelFrame}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none"
}}>
  <rect
    x="2"
    y="2"
    width="96"
    height="96"
    rx="10"
    ry="10"
    className="neon-border"
  />
</svg>
          <div style={styles.panelInner}>
            <div style={styles.topAccent} />
            <div style={styles.loginWord}>LOGIN</div>

            <form onSubmit={submit} style={styles.form}>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>◉</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Username"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>◈</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Password"
                  style={styles.input}
                />
              </div>

              {err ? <div style={styles.err}>{err}</div> : null}

              <button type="submit" style={styles.button}>
                ENTER
              </button>
            </form>

            <div style={styles.bottomAccent} />
          </div>
        </div>
      </div>

      <style>{`
        .px-blink {
          position: absolute;
          display: block;
          background: linear-gradient(135deg, #67e8f9, #60a5fa);
          box-shadow: 0 0 8px rgba(56,189,248,.55);
          animation: pxBlink 2.8s ease-in-out infinite;
        }

        .bg-dot {
          position: absolute;
          display: block;
          width: 2px;
          height: 2px;
          border-radius: 999px;
          background: rgba(103,232,249,.8);
          box-shadow: 0 0 8px rgba(56,189,248,.35);
          animation: bgTwinkle 4s ease-in-out infinite;
        }

        .circuit-path {
          fill: none;
          stroke: url(#c1);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: .9;
          filter: url(#softGlow);
          stroke-dasharray: 420;
          stroke-dashoffset: 420;
          animation: drawCircuit 2.6s ease forwards, pulseCircuit 3s ease-in-out infinite 2.6s;
        }

        .node-pulse {
          fill: #67e8f9;
          filter: url(#softGlow);
          animation: nodePulse 2s ease-in-out infinite;
        }

        @keyframes pxBlink {
          0%, 100% { opacity: .18; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes bgTwinkle {
          0%, 100% { opacity: .18; }
          50% { opacity: .7; }
        }

        @keyframes drawCircuit {
          to { stroke-dashoffset: 0; }
        }

        @keyframes pulseCircuit {
          0%, 100% { opacity: .72; }
          50% { opacity: 1; }
        }

        @keyframes nodePulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.28); }
        }

        @keyframes frameGlow {
          0%, 100% {
            box-shadow:
              0 0 24px rgba(56,189,248,.25),
              0 0 80px rgba(56,189,248,.10),
              inset 0 0 18px rgba(56,189,248,.18);
          }
          50% {
            box-shadow:
              0 0 34px rgba(56,189,248,.42),
              0 0 110px rgba(96,165,250,.14),
              inset 0 0 26px rgba(56,189,248,.24);
          }
        }

        @media (max-width: 820px) {
          .login-panel-wrap {
            width: min(88vw, 420px) !important;
            height: min(64vh, 430px) !important;
          }
        }

        @media (max-width: 560px) {
          .login-panel-wrap {
            width: 88vw !important;
            height: 360px !important;
          }
        }
      `}


@keyframes neonRun {
  to {
    stroke-dashoffset: 0;
  }
}

.neon-border {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 2;
  stroke-dasharray: 320;
  stroke-dashoffset: 320;
  filter: drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 16px #60a5fa);
  animation: neonRun 2.5s linear infinite;
}

@keyframes neonRun {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    overflow: "hidden",
    background: "#04122e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(18,74,160,.35) 0%, rgba(7,20,54,.08) 28%, rgba(4,18,46,1) 70%)",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(120,180,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,255,.035) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    opacity: 0.22,
  },
  centerGlow: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "520px",
    height: "520px",
    transform: "translate(-50%, -50%)",
    borderRadius: "999px",
    background:
      "radial-gradient(circle, rgba(56,189,248,.30) 0%, rgba(56,189,248,.12) 28%, rgba(56,189,248,0) 72%)",
    filter: "blur(38px)",
    opacity: 0.9,
  },
  circuits: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    opacity: 0.96,
  },
  panelWrap: {
    position: "relative",
    zIndex: 3,
    width: "min(40vw, 430px)",
    height: "min(66vh, 470px)",
    minWidth: "320px",
    minHeight: "360px",
    className: "login-panel-wrap",
  },
  panelOuterGlow: {
    position: "absolute",
    inset: "-18px",
    borderRadius: "34px",
    background: "linear-gradient(135deg, rgba(103,232,249,.30), rgba(56,189,248,.14), rgba(96,165,250,.26))",
    filter: "blur(40px)",
    opacity: 0.95,
  },
  panelFrame: {
    position: "absolute",
    inset: 0,
    borderRadius: "30px",
    boxShadow: "0 0 0 3px rgba(56,189,248,.6), 0 0 40px rgba(56,189,248,.4), inset 0 0 20px rgba(56,189,248,.2)",
    padding: "10px",
    background:
      "linear-gradient(135deg, rgba(103,232,249,.95), rgba(56,189,248,.82), rgba(96,165,250,.88))",
    animation: "frameGlow 3.2s ease-in-out infinite",
    boxShadow:
      "0 0 24px rgba(56,189,248,.25), 0 0 80px rgba(56,189,248,.10), inset 0 0 18px rgba(56,189,248,.18)",
  },
  panelInner: {
    width: "100%",
    height: "100%",
    borderRadius: "22px",
    background:
      "linear-gradient(180deg, rgba(5,23,50,.98), rgba(6,28,58,.96))",
    border: "1px solid rgba(150,220,255,.16)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 30px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  topAccent: {
    alignSelf: "center",
    width: "58%",
    height: "20px",
    borderTop: "3px solid rgba(103,232,249,.9)",
    borderLeft: "3px solid transparent",
    borderRight: "3px solid transparent",
    opacity: 0.9,
    clipPath: "polygon(8% 100%, 0 0, 100% 0, 92% 100%)",
  },
  loginWord: {
    color: "#eef8ff",
    textAlign: "center",
    fontSize: "clamp(28px, 3vw, 40px)",
    fontWeight: 800,
    letterSpacing: ".04em",
    marginTop: "6px",
    marginBottom: "8px",
    textShadow: "0 0 18px rgba(56,189,248,.20)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "8px",
  },
  inputWrap: {
    position: "relative",
    height: "54px",
    borderRadius: "0px",
    background: "rgba(13,54,94,.72)",
    border: "1px solid rgba(77,174,255,.16)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)",
  },
  inputIcon: {
    width: "46px",
    minWidth: "46px",
    display: "grid",
    placeItems: "center",
    color: "#d8f4ff",
    fontSize: "14px",
    opacity: 0.9,
  },
  input: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#f0f9ff",
    fontSize: "15px",
    padding: "0 14px 0 0",
  },
  err: {
    color: "#fecaca",
    fontSize: "13px",
    textAlign: "center",
    background: "rgba(127,29,29,.22)",
    border: "1px solid rgba(248,113,113,.18)",
    padding: "10px 12px",
    borderRadius: "12px",
  },
  button: {
    marginTop: "6px",
    height: "54px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #67e8f9, #38bdf8, #60a5fa)",
    color: "#04111f",
    fontWeight: 800,
    fontSize: "15px",
    letterSpacing: ".08em",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(56,189,248,.24)",
  },
  bottomAccent: {
    alignSelf: "center",
    width: "58%",
    height: "20px",
    borderBottom: "3px solid rgba(103,232,249,.9)",
    borderLeft: "3px solid transparent",
    borderRight: "3px solid transparent",
    opacity: 0.9,
    clipPath: "polygon(8% 0, 0 100%, 100% 100%, 92% 0)",
  },
};



