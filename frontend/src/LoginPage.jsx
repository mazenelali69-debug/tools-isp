import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

function buildLines(count = 32) {
  return Array.from({ length: count }, (_, i) => {
    const top = 4 + ((i * 91) % 92);
    const left = -8 + ((i * 37) % 108);
    const delay = ((i * 0.37) % 4).toFixed(2);
    const duration = (3.8 + ((i * 0.23) % 2.4)).toFixed(2);
    const opacity = (0.18 + ((i * 0.03) % 0.2)).toFixed(2);
    const rotate = [-18, -12, -8, 8, 12, 18][i % 6];
    return {
      id: i,
      top,
      left,
      delay,
      duration,
      opacity,
      rotate,
    };
  });
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const lines = useMemo(() => buildLines(), []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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
      <div style={styles.bg}>
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              ...styles.lineWrap,
              top: `${line.top}%`,
              left: `${line.left}%`,
              opacity: line.opacity,
              transform: `rotate(${line.rotate}deg)`,
              animationDelay: `${line.delay}s`,
              animationDuration: `${line.duration}s`,
            }}
          >
            <span style={styles.dot} />
            <span style={styles.line} />
            <span style={styles.dot} />
          </div>
        ))}
      </div>

      <div style={styles.overlay} />

      <form onSubmit={submit} style={styles.card}>
        <div style={styles.kicker}>NoComment Network</div>
        <h1 style={styles.title}>Tools ISP Login</h1>
        <div style={styles.sub}>Authorized access only</div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={styles.input}
          />
        </div>

        {err ? <div style={styles.err}>{err}</div> : null}

        <button type="submit" style={styles.button}>Login</button>

        <style>{`
          @keyframes driftLine {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(42px, -18px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes pulseGlow {
            0% { opacity: 0.28; }
            50% { opacity: 0.92; }
            100% { opacity: 0.28; }
          }

          input:focus {
            outline: none;
            border-color: rgba(103, 232, 249, 0.65) !important;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
          }

          button:hover {
            filter: brightness(1.05);
          }
        `}</style>
      </form>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 20% 20%, rgba(19,47,92,0.55) 0%, rgba(5,10,18,1) 42%, rgba(2,6,14,1) 100%)",
    padding: "24px",
  },
  bg: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(2,6,23,0.15), rgba(2,6,23,0.55) 50%, rgba(2,6,23,0.22))",
    backdropFilter: "blur(1px)",
  },
  lineWrap: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    animationName: "driftLine",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "rgba(125, 211, 252, 0.92)",
    boxShadow: "0 0 10px rgba(56, 189, 248, 0.65)",
    animation: "pulseGlow 2.8s ease-in-out infinite",
  },
  line: {
    width: "38px",
    height: "2px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, rgba(103,232,249,0.85), rgba(59,130,246,0.65))",
    boxShadow: "0 0 12px rgba(59, 130, 246, 0.22)",
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "430px",
    borderRadius: "22px",
    padding: "30px",
    background: "rgba(7, 14, 28, 0.82)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
    backdropFilter: "blur(14px)",
  },
  kicker: {
    color: "#7dd3fc",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    marginBottom: "10px",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "32px",
    fontWeight: 900,
    lineHeight: 1.1,
  },
  sub: {
    marginTop: "8px",
    marginBottom: "22px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  fieldWrap: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(2, 6, 23, 0.88)",
    color: "#f8fafc",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: "15px",
    transition: "all 160ms ease",
  },
  err: {
    borderRadius: "12px",
    padding: "11px 12px",
    marginBottom: "14px",
    background: "rgba(127, 29, 29, 0.28)",
    border: "1px solid rgba(248, 113, 113, 0.28)",
    color: "#fecaca",
    fontSize: "13px",
    fontWeight: 600,
  },
  button: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    color: "#082032",
    background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 100%)",
    transition: "filter 160ms ease",
  },
};
