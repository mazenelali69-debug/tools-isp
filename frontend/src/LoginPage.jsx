import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

function makeDots(count = 22) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 8 + Math.random() * 84,
    y: 10 + Math.random() * 80,
    size: 2 + Math.random() * 2,
    opacity: 0.08 + Math.random() * 0.18,
  }));
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 920 : false
  );

  const dots = useMemo(() => makeDots(24), []);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onResize() {
      setIsMobile(window.innerWidth < 920);
    }

    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function submit(e) {
    e.preventDefault();

    const u = String(username || "").trim();
    const p = String(password || "");

    if (u === VALID_USERNAME && p === VALID_PASSWORD) {
      sessionStorage.setItem("noc_token", "ok");
      sessionStorage.setItem("noc_user", u);
      setErr("");
      onLogin?.();
      return;
    }

    setErr("Invalid credentials");
  }

  const styles = getStyles(isMobile);

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.grid} />
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      {dots.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: "999px",
            background: "rgba(103,232,249,.9)",
            boxShadow: "0 0 10px rgba(56,189,248,.25)",
            opacity: d.opacity,
            pointerEvents: "none",
          }}
        />
      ))}

      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroAccent} />
          <div style={styles.heroKicker}>Operations Layer</div>
          <h1 style={styles.heroTitle}>Network Control</h1>
          <p style={styles.heroText}>
            Secure access to monitoring, visibility, and control for the active
            infrastructure environment.
          </p>

          <div style={styles.heroStatRow}>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatLabel}>Status</div>
              <div style={styles.heroStatValue}>Protected</div>
            </div>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatLabel}>Access</div>
              <div style={styles.heroStatValue}>Restricted</div>
            </div>
          </div>
        </section>

        <section style={styles.cardWrap}>
          <div style={styles.cardGlow} />
          <div style={styles.card}>
            <div style={styles.cardTopBar} />
            <div style={styles.brand}>NoComment Network</div>
            <h2 style={styles.cardTitle}>Sign in</h2>
            <div style={styles.cardSub}>Authorized access only</div>

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

              <button
                type="submit"
                style={styles.button}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 14px 28px rgba(56,189,248,.20)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 18px rgba(56,189,248,.12)";
                }}
              >
                Enter Dashboard
              </button>
            </form>

            <div style={styles.footer}>Protected Network Control Access</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getStyles(isMobile) {
  return {
    page: {
      position: "relative",
      minHeight: "100dvh",
      overflow: "hidden",
      background: "#07111f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "18px" : "28px",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    bg: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(135deg, rgba(5,12,24,1) 0%, rgba(7,17,31,1) 45%, rgba(10,22,42,1) 100%)",
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
      backgroundSize: isMobile ? "26px 26px" : "34px 34px",
      opacity: 0.16,
    },

    glowLeft: {
      position: "absolute",
      width: isMobile ? "300px" : "520px",
      height: isMobile ? "300px" : "520px",
      borderRadius: "999px",
      left: isMobile ? "-120px" : "-180px",
      top: isMobile ? "-100px" : "-170px",
      background:
        "radial-gradient(circle, rgba(37,99,235,.18), rgba(37,99,235,0) 68%)",
      filter: "blur(40px)",
      opacity: 0.78,
    },

    glowRight: {
      position: "absolute",
      width: isMobile ? "320px" : "540px",
      height: isMobile ? "320px" : "540px",
      borderRadius: "999px",
      right: isMobile ? "-140px" : "-200px",
      bottom: isMobile ? "-120px" : "-190px",
      background:
        "radial-gradient(circle, rgba(56,189,248,.12), rgba(56,189,248,0) 68%)",
      filter: "blur(44px)",
      opacity: 0.86,
    },

    shell: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: isMobile ? "520px" : "1080px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.08fr 0.92fr",
      gap: isMobile ? "20px" : "30px",
      alignItems: "stretch",
    },

    hero: {
      minHeight: isMobile ? "200px" : "520px",
      borderRadius: "28px",
      padding: isMobile ? "24px" : "34px",
      background:
        "linear-gradient(180deg, rgba(9,18,34,.72), rgba(5,12,24,.56))",
      border: "1px solid rgba(148,163,184,.08)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },

    heroAccent: {
      width: "84px",
      height: "3px",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
      marginBottom: "18px",
      boxShadow: "0 0 18px rgba(56,189,248,.20)",
    },

    heroKicker: {
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: ".22em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    heroTitle: {
      margin: 0,
      color: "#f8fafc",
      fontSize: isMobile ? "42px" : "64px",
      fontWeight: 900,
      lineHeight: 0.96,
      letterSpacing: "-.055em",
    },

    heroText: {
      marginTop: "18px",
      marginBottom: 0,
      maxWidth: "520px",
      color: "#93a4bc",
      fontSize: isMobile ? "14px" : "15px",
      lineHeight: 1.75,
    },

    heroStatRow: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "30px",
    },

    heroStatCard: {
      minWidth: "140px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,.03)",
      border: "1px solid rgba(148,163,184,.08)",
    },

    heroStatLabel: {
      color: "#7f93ad",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: ".12em",
      textTransform: "uppercase",
    },

    heroStatValue: {
      marginTop: "8px",
      color: "#e8f2ff",
      fontSize: "18px",
      fontWeight: 800,
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
      background:
        "radial-gradient(circle at center, rgba(56,189,248,.085), rgba(0,0,0,0) 64%)",
      filter: "blur(24px)",
      pointerEvents: "none",
    },

    card: {
      width: "100%",
      maxWidth: isMobile ? "100%" : "460px",
      minHeight: isMobile ? "auto" : "520px",
      borderRadius: "28px",
      padding: isMobile ? "26px" : "34px",
      background:
        "linear-gradient(180deg, rgba(8,16,30,.92), rgba(5,10,22,.98))",
      border: "1px solid rgba(96,165,250,.14)",
      boxShadow:
        "0 18px 50px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.03)",
      backdropFilter: "blur(18px)",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },

    cardTopBar: {
      width: "64px",
      height: "3px",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
      marginBottom: "18px",
      boxShadow: "0 0 16px rgba(56,189,248,.18)",
    },

    brand: {
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: ".22em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    cardTitle: {
      margin: 0,
      color: "#f8fafc",
      fontSize: isMobile ? "40px" : "52px",
      fontWeight: 900,
      lineHeight: 0.98,
      letterSpacing: "-.05em",
    },

    cardSub: {
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
      background:
        "linear-gradient(135deg, #67e8f9 0%, #38bdf8 48%, #818cf8 100%)",
      boxShadow: "0 8px 18px rgba(56,189,248,.12)",
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
}


