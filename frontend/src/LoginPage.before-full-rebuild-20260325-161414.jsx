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
  const [showLogin, setShowLogin] = useState(false);
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

      <div style={styles.topStrip}>
        <div style={styles.topStripInner}>
          <div style={styles.topStripLeft}>Jabal Mohssen</div>
          <div style={styles.topStripRight}>Customer Support: 70411518</div>
        </div>
      </div>

      <div style={styles.navbar}>
        <div style={styles.navbarInner}>
          <div style={styles.navLogo}>NoComment</div>

          <div style={styles.navLinks}>
            <a href="#home" style={styles.navLink}>Home</a>
            <a href="#plans" style={styles.navLink}>Plans</a>
            <a href="#devices" style={styles.navLink}>Devices</a>
            <a href="#contact" style={styles.navLink}>Contact</a>
          </div>

          <div style={styles.navActions}>
            <button
              type="button"
              onClick={() => setShowLogin((v) => !v)}
              style={styles.supportBtn}
            >
              Support Login
            </button>

            <a href="tel:70411518" style={styles.callBtn}>
              Call Now
            </a>
          </div>
        </div>
      </div>

      <section id="home" style={styles.heroSection}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <div style={styles.heroKicker}>NoComment Network</div>
          <h1 style={styles.heroTitleLarge}>
            Fast Internet for
            <br />
            Home &amp; Business
          </h1>

          <p style={styles.heroLead}>
            Stable service, clear plans, unlimited night options, and direct support
            for Jabal Mohssen and nearby areas.
          </p>

          <div style={styles.heroActionRow}>
            <a href="#plans" style={styles.heroMainBtn}>View Plans</a>
            <a href="tel:70411518" style={styles.heroGhostBtn}>Call Now</a>
          </div>
        </div>
      </section>

      {showLogin && (
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
      )}
    </div>
  );
}
    </div>
  );
}

function getStyles(isMobile) {
function getStyles(isMobile) {
  return {
    page: {
      position: "relative",
      minHeight: "100dvh",
      overflow: "hidden",
      background: "#07111f",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "flex-start",
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

    topStrip: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 8,
      background: "rgba(255,255,255,.06)",
      borderBottom: "1px solid rgba(255,255,255,.08)",
      backdropFilter: "blur(10px)",
    },

    topStripInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "38px",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "rgba(255,255,255,.88)",
      fontSize: "13px",
      fontWeight: 700,
    },

    topStripLeft: {
      opacity: 0.95,
    },

    topStripRight: {
      opacity: 0.95,
    },

    navbar: {
      position: "absolute",
      top: "38px",
      left: 0,
      right: 0,
      zIndex: 8,
    },

    navbarInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "82px",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "18px",
    },

    navLogo: {
      color: "#ffffff",
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: 900,
      letterSpacing: "-.03em",
      flexShrink: 0,
    },

    navLinks: {
      display: isMobile ? "none" : "flex",
      alignItems: "center",
      gap: "28px",
    },

    navLink: {
      color: "rgba(255,255,255,.95)",
      textDecoration: "none",
      fontSize: "15px",
      fontWeight: 700,
    },

    navActions: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexShrink: 0,
    },

    supportBtn: {
      height: "44px",
      padding: "0 16px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.24)",
      background: "rgba(255,255,255,.06)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
      backdropFilter: "blur(8px)",
    },

    callBtn: {
      height: "44px",
      padding: "0 20px",
      borderRadius: "999px",
      background: "linear-gradient(135deg, #2dd4bf 0%, #38bdf8 48%, #818cf8 100%)",
      color: "#08111f",
      display: isMobile ? "none" : "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 900,
      boxShadow: "0 12px 28px rgba(56,189,248,.22)",
    },

    heroSection: {
      position: "relative",
      width: "100%",
      minHeight: isMobile ? "520px" : "760px",
      display: "flex",
      alignItems: "center",
      paddingTop: isMobile ? "140px" : "150px",
      paddingBottom: isMobile ? "60px" : "90px",
      overflow: "hidden",
    },

    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg, rgba(3,7,18,.84) 0%, rgba(3,7,18,.56) 42%, rgba(3,7,18,.18) 100%)",
      zIndex: 1,
    },

    heroContent: {
      position: "relative",
      zIndex: 2,
      maxWidth: "1280px",
      width: "100%",
      margin: "0 auto",
      padding: isMobile ? "0 24px" : "0 24px",
    },

    heroTitleLarge: {
      margin: "0 0 18px 0",
      color: "#ffffff",
      fontSize: isMobile ? "52px" : "92px",
      fontWeight: 900,
      lineHeight: 0.92,
      letterSpacing: "-.06em",
      maxWidth: "760px",
    },

    heroLead: {
      margin: "0 0 28px 0",
      color: "rgba(255,255,255,.82)",
      fontSize: isMobile ? "16px" : "20px",
      lineHeight: 1.65,
      maxWidth: "700px",
    },

    heroActionRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "14px",
      marginTop: "10px",
    },

    heroMainBtn: {
      minWidth: "160px",
      height: "54px",
      padding: "0 22px",
      borderRadius: "999px",
      background: "#6d28d9",
      color: "#ffffff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      fontSize: "15px",
      fontWeight: 900,
      boxShadow: "0 12px 28px rgba(109,40,217,.28)",
    },

    heroGhostBtn: {
      minWidth: "160px",
      height: "54px",
      padding: "0 22px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.22)",
      background: "rgba(255,255,255,.06)",
      color: "#ffffff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      fontSize: "15px",
      fontWeight: 800,
      backdropFilter: "blur(8px)",
    },
    topBar: {
      position: "absolute",
      top: isMobile ? "16px" : "22px",
      left: isMobile ? "16px" : "24px",
      right: isMobile ? "16px" : "24px",
      zIndex: 5,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: "12px",
    },

    topBrand: {
      color: "#e8f2ff",
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: 900,
      letterSpacing: ".04em",
      textTransform: "uppercase",
    },

    topLoginBtn: {
      height: "42px",
      padding: "0 16px",
      borderRadius: "12px",
      border: "1px solid rgba(148,163,184,.18)",
      background: "rgba(255,255,255,.05)",
      color: "#f8fafc",
      fontSize: "13px",
      fontWeight: 800,
      letterSpacing: ".03em",
      cursor: "pointer",
      backdropFilter: "blur(8px)",
    },

    shell: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: "1280px",
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "20px" : "30px",
      alignItems: "stretch",
    },

    hero: {
      minHeight: isMobile ? "320px" : "560px",
      borderRadius: "0px",
      padding: isMobile ? "24px" : "34px",
      background:
        "linear-gradient(180deg, rgba(9,18,34,.72), rgba(5,12,24,.56))",
      border: "none",
      boxShadow: "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
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
      border: "none",
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

    heroMeta: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "10px",
      marginTop: "26px",
      marginBottom: "26px",
    },

    heroMetaItem: {
      display: "inline-flex",
      alignItems: "stretch",
      gap: "8px",
      padding: "12px 14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(148,163,184,.10)",
      color: "#dbeafe",
      fontSize: "14px",
      fontWeight: 700,
    },

    heroActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "4px",
    },

    heroPrimaryBtn: {
      height: "50px",
      padding: "0 18px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 48%, #818cf8 100%)",
      color: "#04111f",
      fontSize: "14px",
      fontWeight: 900,
      letterSpacing: ".02em",
      cursor: "pointer",
      boxShadow: "0 10px 22px rgba(56,189,248,.16)",
    },

    heroCallBtn: {
      height: "50px",
      padding: "0 18px",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,.18)",
      background: "rgba(255,255,255,.04)",
      color: "#f8fafc",
      fontSize: "14px",
      fontWeight: 800,
      letterSpacing: ".02em",
      display: "inline-flex",
      alignItems: "stretch",
      justifyContent: "flex-start",
      textDecoration: "none",
      backdropFilter: "blur(8px)",
    },
    cardWrap: {
      position: "relative",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "flex-start",
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
      maxWidth: isMobile ? "100%" : "420px",
      minHeight: "auto",
      borderRadius: "0px",
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
      justifyContent: "flex-start",
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





















