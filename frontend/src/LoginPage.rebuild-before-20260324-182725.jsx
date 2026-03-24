import { useEffect, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

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
<div className="bg-lines"></div>

      <div style={styles.grid} />
      <div style={styles.glowA} />
      <div style={styles.glowB} />

      <div style={styles.shell}>
        <div style={styles.hero}>
          <div style={styles.heroLine} />
          <div style={styles.heroTitle}>Network Control</div>
          <div style={styles.heroSub}>
            Secure operations access for monitoring, control, and live infrastructure visibility.
          </div>
          <div style={styles.heroBars}>
            <span style={styles.bar1} />
            <span style={styles.bar2} />
            <span style={styles.bar3} />
          </div>
        </div>

        <div style={styles.cardWrap}>
          <div style={styles.cardGlow} />
          <div style={styles.card}>
            <div style={styles.cardTopLine} />
            <div style={styles.kicker}>NoComment Network</div>
            <h1 style={styles.title}>Sign in</h1>
            <div style={styles.sub}>Authorized access only</div>

            <form onSubmit={submit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Enter username"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  style={styles.input}
                />
              </div>

              {err ? <div style={styles.err}>{err}</div> : null}

              <button type="submit" style={styles.button}>
                Enter Dashboard
              </button>
            </form>

            <div style={styles.footer}>Protected Network Control Access</div>
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder {
          color: rgba(203, 213, 225, 0.42);
        }

        input:focus {
          outline: none;
          border-color: rgba(96,165,250,.50) !important;
          box-shadow:
            0 0 0 3px rgba(59,130,246,.08),
            0 0 16px rgba(56,189,248,.08);
        }

        button:hover {
  box-shadow: 0 0 30px rgba(56,189,248,.45);

          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(59,130,246,.16);
        }

        button:active {
          transform: translateY(0);
        }

        @media (max-width: 920px) {
          .login-shell {
            grid-template-columns: 1fr !important;
            gap: 22px !important;
            max-width: 520px !important;
          }

          .login-hero {
            min-height: 180px !important;
            padding: 24px !important;
          }

          .login-card {
            max-width: 100% !important;
          }
        }
      `}

  50% { transform: translateX(20px); opacity: 1 }
  100% { transform: translateX(-20px); opacity: .4 }
}


  100% { transform: translateY(-40px) }
}


</style>
    <style>{
input::placeholder {
  color: rgba(203,213,225,.4);
}

input:focus {
  outline: none;
  border-color: rgba(96,165,250,.5);
  box-shadow: 0 0 0 3px rgba(59,130,246,.08);
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(56,189,248,.25);
}

.bg-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(56,189,248,.03) 0px,
    rgba(56,189,248,.03) 1px,
    transparent 1px,
    transparent 100px
  );
  opacity: .4;
}
}</style>
</div>
);
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#07111f",
    padding: "24px",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(5,12,24,1) 0%, rgba(7,17,31,1) 42%, rgba(10,22,42,1) 100%)",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    opacity: 0.18,
    maskImage: "radial-gradient(circle at center, black 48%, transparent 100%)",
    WebkitMaskImage: "radial-gradient(circle at center, black 48%, transparent 100%)",
  },
  glowA: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "999px",
    left: "-180px",
    top: "-160px",
    background: "radial-gradient(circle, rgba(37,99,235,.18), rgba(37,99,235,0) 68%)",
    filter: "blur(42px)",
    opacity: 0.85,
  },
  glowB: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "999px",
    right: "-180px",
    bottom: "-180px",
    background: "radial-gradient(circle, rgba(56,189,248,.12), rgba(56,189,248,0) 68%)",
    filter: "blur(42px)",
    opacity: 0.85,
  },
  shell: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "1080px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "30px",
    alignItems: "stretch",
    className: "login-shell",
  },
  hero: {
    minHeight: "520px",
    borderRadius: "28px",
    padding: "34px",
    background: "linear-gradient(180deg, rgba(9,18,34,.72), rgba(5,12,24,.58))",
    border: "1px solid rgba(148,163,184,.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    className: "login-hero",
  },
  heroLine: {
    width: "84px",
    height: "3px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
    marginBottom: "22px",
    animation: "lineMove 2s linear infinite"
  }, {
    width: "84px",
    height: "3px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
    marginBottom: "22px",
    boxShadow: "0 0 18px rgba(56,189,248,.24)",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: "clamp(34px, 4vw, 56px)",
    fontWeight: 900,
    lineHeight: 0.96,
    letterSpacing: "-.05em",
  },
  heroSub: {
    marginTop: "18px",
    maxWidth: "520px",
    color: "#93a4bc",
    fontSize: "15px",
    lineHeight: 1.7,
  },
  heroBars: {
    display: "flex",
    gap: "10px",
    marginTop: "34px",
    alignItems: "center",
  },
  bar1: {
    width: "68px",
    height: "10px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, rgba(103,232,249,.85), rgba(56,189,248,.5))",
  },
  bar2: {
    width: "42px",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(96,165,250,.28)",
  },
  bar3: {
    width: "24px",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(148,163,184,.18)",
  },
  cardWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    inset: "-18px",
    borderRadius: "34px",
    background: "radial-gradient(circle at center, rgba(56,189,248,.09), rgba(0,0,0,0) 64%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    minHeight: "520px",
    borderRadius: "28px",
    padding: "34px",
    background: "linear-gradient(180deg, rgba(8,16,30,.92), rgba(5,10,22,.98))",
    border: "1px solid rgba(96,165,250,.14)",
    boxShadow:
      "0 18px 50px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.03)",
    backdropFilter: "blur(18px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    className: "login-card",
  },
  cardTopLine: {
    width: "64px",
    height: "3px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
    marginBottom: "20px",
    boxShadow: "0 0 16px rgba(56,189,248,.18)",
  },
  kicker: {
    color: "#7dd3fc",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".22em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "46px",
    fontWeight: 900,
    lineHeight: 0.98,
    letterSpacing: "-.05em",
  },
  sub: {
    marginTop: "12px",
    marginBottom: "28px",
    color: "#93a4bc",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  field: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#d3deea",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: "58px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,.14)",
    background: "rgba(2,6,23,.82)",
    color: "#f8fafc",
    padding: "0 18px",
    boxSizing: "border-box",
    fontSize: "15px",
    transition: "all .16s ease",
  },
  err: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(127,29,29,.22)",
    border: "1px solid rgba(248,113,113,.18)",
    color: "#fecaca",
    fontSize: "13px",
    fontWeight: 700,
  },
  button: {
    marginTop: "6px",
    height: "58px",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    letterSpacing: ".03em",
    color: "#04111f",
    background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 48%, #818cf8 100%)",
    boxShadow: "0 0 20px rgba(56,189,248,.25)",
    transition: "all .16s ease",
  },
  footer: {
    marginTop: "18px",
    color: "#64748b",
    fontSize: "11px",
    letterSpacing: ".16em",
    textTransform: "uppercase",
  },
};



