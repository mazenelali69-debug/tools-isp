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
    document.body.style.overflow = "auto";

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

      <section id="plans" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Internet Plans</div>
          <h2 style={styles.sectionTitle}>Simple plans. Clear pricing.</h2>

          <div style={styles.planGrid}>
            {[
              { name: "Plan 1", speed: "5 Mbps", cached: "Up to 20 Mbps Cached", daily: "8GB Daily", monthly: "500GB Monthly", price: "$25" },
              { name: "Plan 2", speed: "6 Mbps", cached: "Up to 30 Mbps Cached", daily: "12GB Daily", monthly: "600GB Monthly", price: "$35" },
              { name: "Plan 3", speed: "7 Mbps", cached: "Up to 40 Mbps Cached", daily: "15GB Daily", monthly: "700GB Monthly", price: "$45" },
              { name: "Plan 4", speed: "8 Mbps", cached: "Up to 50 Mbps Cached", daily: "20GB Daily", monthly: "800GB Monthly", price: "$65" },
              { name: "Plan 5", speed: "9 Mbps", cached: "Up to 60 Mbps Cached", daily: "30GB Daily", monthly: "900GB Monthly", price: "$75" },
              { name: "Plan 6", speed: "10 Mbps", cached: "Up to 100 Mbps Cached", daily: "40GB Daily", monthly: "1000GB Monthly", price: "$100", featured: true },
            ].map((plan) => (
              <div key={plan.name} style={plan.featured ? styles.planCardFeatured : styles.planCard}>
                <div style={styles.planNameRow}>
                  <div style={styles.planName}>{plan.name}</div>
                  {plan.featured ? <div style={styles.planBadge}>Most Popular</div> : null}
                </div>
                <div style={styles.planSpeed}>{plan.speed}</div>
                <div style={styles.planCached}>{plan.cached}</div>
                <div style={styles.planMeta}>{plan.daily}</div>
                <div style={styles.planMeta}>{plan.monthly}</div>
                <div style={styles.planPrice}>{plan.price}</div>
              </div>
            ))}
          </div>

          <div style={styles.addonCard}>
            <div style={styles.addonTitle}>Free Night + Open Speed</div>
            <div style={styles.addonMeta}>1AM → 1PM</div>
            <div style={styles.addonPrice}>+ $5</div>
          </div>
        </div>
      </section>

      <section id="devices" style={styles.sectionAlt}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Devices & Cables</div>
          <h2 style={styles.sectionTitle}>Ready hardware for every setup.</h2>

          <div style={styles.deviceGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Tenda</div>
              <div style={styles.infoLine}>N300 4G — $20</div>
              <div style={styles.infoLine}>AC1200 4G &amp; 5G — $25</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Netis</div>
              <div style={styles.infoLine}>N3 4G &amp; 5G — $25</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>V-Sol</div>
              <div style={styles.infoLine}>AC3000 4G / 5G / 6G — $40</div>
              <div style={styles.infoLine}>AC3200 4G / 5G / 6G / 7G — $100</div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Cables</div>
              <div style={styles.infoLine}>Cat 5E — $0.30 / m</div>
              <div style={styles.infoLine}>Cat 6E++ — $0.40 / m</div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.contactCard}>
            <div>
              <div style={styles.sectionKicker}>Contact</div>
              <h2 style={styles.sectionTitle}>Talk to NoComment directly.</h2>
              <div style={styles.contactLine}>Phone: 70411518</div>
              <div style={styles.contactLine}>Location: Jabal Mohssen</div>
              <div style={styles.contactLine}>Network: NoComment</div>
            </div>

            <div style={styles.contactActions}>
              <a href="tel:70411518" style={styles.heroMainBtn}>Call Now</a>
              <button
                type="button"
                onClick={() => setShowLogin((v) => !v)}
                style={styles.heroGhostButton}
              >
                Support Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {showLogin && (
        <section style={styles.loginSection}>
          <div style={styles.loginInner}>
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

                <button type="submit" style={styles.button}>
                  Enter Dashboard
                </button>
              </form>

              <div style={styles.footer}>Protected Network Control Access</div>
            </div>
          </div>
        </section>
      )}
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
      color: "#fff",
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
      position: "sticky",
      top: 0,
      zIndex: 20,
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

    topStripLeft: { opacity: 0.95 },
    topStripRight: { opacity: 0.95 },

    navbar: {
  position: "sticky",
  top: "38px",
  zIndex: 50,
  background: "rgba(7,17,31,0.55)",
  backdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(255,255,255,0.05)"
},

    navbarInner: {
  maxWidth: "1280px",
  margin: "0 auto",
  minHeight: "88px",
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px"
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
  minHeight: isMobile ? "520px" : "820px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: isMobile ? "90px" : "140px",
  paddingBottom: isMobile ? "60px" : "120px",
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
  padding: "0 24px",
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
  gap: "40px",
  alignItems: "center"
},

    heroKicker: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: ".22em",
      textTransform: "uppercase",
      marginBottom: "14px",
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
      border: "none",
      cursor: "pointer",
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

    heroGhostButton: {
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
      cursor: "pointer",
    },

    section: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "44px 0" : "70px 0",
    },

    sectionAlt: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "44px 0" : "70px 0",
      background: "rgba(255,255,255,.02)",
      borderTop: "1px solid rgba(255,255,255,.05)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
    },

    sectionInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 24px",
    },

    sectionKicker: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: ".2em",
      textTransform: "uppercase",
      marginBottom: "10px",
    },

    sectionTitle: {
      margin: "0 0 26px 0",
      color: "#fff",
      fontSize: isMobile ? "28px" : "44px",
      fontWeight: 900,
      lineHeight: 1.05,
      letterSpacing: "-.04em",
    },

    planGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "18px",
    },

    planCard: {
  borderRadius: "26px",
  padding: "26px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.12)",
  transition: "all .25s ease",
  cursor: "pointer"
},

    planCardFeatured: {
  borderRadius: "26px",
  padding: "28px",
  background: "linear-gradient(180deg, rgba(139,92,246,0.35), rgba(255,255,255,0.06))",
  border: "1px solid rgba(139,92,246,0.5)",
  transform: "scale(1.05)",
  boxShadow: "0 20px 60px rgba(139,92,246,0.25)"
},

    planNameRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginBottom: "14px",
    },

    planName: {
      fontSize: "18px",
      fontWeight: 900,
      color: "#fff",
    },

    planBadge: {
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,.12)",
      fontSize: "11px",
      fontWeight: 800,
      color: "#fff",
      letterSpacing: ".05em",
      textTransform: "uppercase",
    },

    planSpeed: {
      fontSize: "34px",
      lineHeight: 1,
      fontWeight: 900,
      color: "#fff",
      marginBottom: "12px",
      letterSpacing: "-.04em",
    },

    planCached: {
      color: "#dbeafe",
      fontSize: "14px",
      marginBottom: "14px",
      fontWeight: 700,
    },

    planMeta: {
      color: "rgba(255,255,255,.78)",
      fontSize: "14px",
      marginBottom: "8px",
    },

    planPrice: {
      marginTop: "18px",
      color: "#7dd3fc",
      fontSize: "30px",
      fontWeight: 900,
      letterSpacing: "-.03em",
    },

    addonCard: {
      marginTop: "24px",
      borderRadius: "24px",
      padding: "22px 24px",
      background: "linear-gradient(180deg, rgba(45,212,191,.14), rgba(255,255,255,.04))",
      border: "1px solid rgba(45,212,191,.22)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: "12px",
    },

    addonTitle: {
      fontSize: "20px",
      fontWeight: 900,
      color: "#fff",
    },

    addonMeta: {
      color: "rgba(255,255,255,.82)",
      fontSize: "14px",
      fontWeight: 700,
    },

    addonPrice: {
      color: "#2dd4bf",
      fontSize: "24px",
      fontWeight: 900,
    },

    deviceGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
      gap: "18px",
    },

    infoCard: {
      borderRadius: "22px",
      padding: "22px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 14px 40px rgba(0,0,0,.18)",
    },

    infoTitle: {
      fontSize: "20px",
      fontWeight: 900,
      color: "#fff",
      marginBottom: "14px",
    },

    infoLine: {
      color: "rgba(255,255,255,.82)",
      fontSize: "14px",
      marginBottom: "10px",
      lineHeight: 1.5,
    },

    contactCard: {
      borderRadius: "28px",
      padding: isMobile ? "24px" : "32px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: "24px",
      boxShadow: "0 18px 50px rgba(0,0,0,.18)",
    },

    contactLine: {
      color: "rgba(255,255,255,.82)",
      fontSize: "16px",
      marginBottom: "10px",
      lineHeight: 1.5,
    },

    contactActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
    },

    loginSection: {
      position: "relative",
      zIndex: 3,
      padding: isMobile ? "0 0 44px" : "0 0 70px",
    },

    loginInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 24px",
      display: "flex",
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
      position: "relative",
      width: "100%",
      maxWidth: "460px",
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

