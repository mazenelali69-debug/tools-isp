import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const PLANS = [
  { name: "Plan 1", speed: "5 Mbps", cached: "Up to 20 Mbps Cached", daily: "8GB Daily", monthly: "500GB Monthly", price: "$25" },
  { name: "Plan 2", speed: "6 Mbps", cached: "Up to 30 Mbps Cached", daily: "12GB Daily", monthly: "600GB Monthly", price: "$35" },
  { name: "Plan 3", speed: "7 Mbps", cached: "Up to 40 Mbps Cached", daily: "15GB Daily", monthly: "700GB Monthly", price: "$45" },
  { name: "Plan 4", speed: "8 Mbps", cached: "Up to 50 Mbps Cached", daily: "20GB Daily", monthly: "800GB Monthly", price: "$65" },
  { name: "Plan 5", speed: "9 Mbps", cached: "Up to 60 Mbps Cached", daily: "30GB Daily", monthly: "900GB Monthly", price: "$75" },
  { name: "Plan 6", speed: "10 Mbps", cached: "Up to 100 Mbps Cached", daily: "40GB Daily", monthly: "1000GB Monthly", price: "$100", featured: true },
];

function makeDots(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    size: 2 + Math.random() * 2,
    opacity: 0.05 + Math.random() * 0.16,
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

  const dots = useMemo(() => makeDots(22), []);

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
            background: "rgba(125,211,252,.95)",
            boxShadow: "0 0 12px rgba(56,189,248,.18)",
            opacity: d.opacity,
            pointerEvents: "none",
          }}
        />
      ))}

      <div style={styles.topStrip}>
        <div style={styles.topStripInner}>
          <div>Jabal Mohssen</div>
          <div>Customer Support 70411518</div>
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
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <div style={styles.heroKicker}>NoComment Network</div>
            <h1 style={styles.heroTitle}>
              Faster internet.
              <br />
              Stronger service.
              <br />
              Clear pricing.
            </h1>

            <p style={styles.heroLead}>
              Home internet plans, direct support, hardware options, and unlimited
              night upgrades for Jabal Mohssen and nearby areas.
            </p>

            <div style={styles.heroCtas}>
              <a href="#plans" style={styles.primaryBtn}>Explore Plans</a>
              <a href="tel:70411518" style={styles.secondaryBtn}>Call Now</a>
            </div>

            <div style={styles.trustRow}>
              <div style={styles.trustCard}>
                <div style={styles.trustNumber}>Fast</div>
                <div style={styles.trustLabel}>Installation</div>
              </div>
              <div style={styles.trustCard}>
                <div style={styles.trustNumber}>Night</div>
                <div style={styles.trustLabel}>Open Speed</div>
              </div>
              <div style={styles.trustCard}>
                <div style={styles.trustNumber}>Direct</div>
                <div style={styles.trustLabel}>Support</div>
              </div>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.visualShell}>
              <div style={styles.visualGlow} />

              <div style={styles.visualMainCard}>
                <div style={styles.visualEyebrow}>Featured Plan</div>
                <div style={styles.visualPlanSpeed}>10 Mbps</div>
                <div style={styles.visualPlanCached}>Up to 100 Mbps Cached</div>
                <div style={styles.visualPlanMeta}>40GB Daily • 1000GB Monthly</div>
                <div style={styles.visualPrice}>$100</div>
              </div>

              <div style={styles.visualMiniLeft}>
                <div style={styles.visualMiniLabel}>Free Night</div>
                <div style={styles.visualMiniValue}>1AM → 1PM</div>
              </div>

              <div style={styles.visualMiniRight}>
                <div style={styles.visualMiniLabel}>Call Us</div>
                <div style={styles.visualMiniValue}>70411518</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Internet Plans</div>
          <h2 style={styles.sectionTitle}>Plans that sell themselves.</h2>
          <p style={styles.sectionLead}>
            All prices, quotas, and cached speeds are visible directly — no hidden steps.
          </p>

          <div style={styles.planGrid}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={plan.featured ? styles.planCardFeatured : styles.planCard}>
                <div style={styles.planTop}>
                  <div style={styles.planName}>{plan.name}</div>
                  {plan.featured ? <div style={styles.planBadge}>Best Value</div> : null}
                </div>

                <div style={styles.planSpeed}>{plan.speed}</div>
                <div style={styles.planCached}>{plan.cached}</div>

                <div style={styles.planStat}>{plan.daily}</div>
                <div style={styles.planStat}>{plan.monthly}</div>

                <div style={styles.planPrice}>{plan.price}</div>
              </div>
            ))}
          </div>

          <div style={styles.addonCard}>
            <div>
              <div style={styles.addonTitle}>Free Night + Open Speed</div>
              <div style={styles.addonMeta}>1AM → 1PM</div>
            </div>
            <div style={styles.addonPrice}>+ $5</div>
          </div>
        </div>
      </section>

      <section id="devices" style={styles.sectionAlt}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Devices & Cables</div>
          <h2 style={styles.sectionTitle}>Hardware ready for deployment.</h2>

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
              <a href="tel:70411518" style={styles.primaryBtn}>Call Now</a>
              <button
                type="button"
                onClick={() => setShowLogin((v) => !v)}
                style={styles.secondaryButton}
              >
                Support Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {showLogin && (
        <div style={styles.loginOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.loginModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.loginTopBar} />
            <div style={styles.loginBrand}>NoComment Network</div>
            <h2 style={styles.loginTitle}>Support Login</h2>
            <div style={styles.loginSub}>Authorized access only</div>

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

              <button type="submit" style={styles.loginButton}>
                Enter Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStyles(isMobile) {
  return {
    page: {
      position: "relative",
      minHeight: "100dvh",
      overflowX: "hidden",
      background: "#050d1c",
      color: "#ffffff",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    bg: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, #06101f 0%, #071425 42%, #09192f 100%)",
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
      backgroundSize: isMobile ? "28px 28px" : "38px 38px",
      opacity: 0.18,
    },

    glowLeft: {
      position: "absolute",
      width: isMobile ? "320px" : "620px",
      height: isMobile ? "320px" : "620px",
      left: isMobile ? "-120px" : "-180px",
      top: isMobile ? "-80px" : "-180px",
      borderRadius: "999px",
      background:
        "radial-gradient(circle, rgba(59,130,246,.20), rgba(59,130,246,0) 68%)",
      filter: "blur(46px)",
      opacity: 0.82,
    },

    glowRight: {
      position: "absolute",
      width: isMobile ? "340px" : "640px",
      height: isMobile ? "340px" : "640px",
      right: isMobile ? "-120px" : "-220px",
      bottom: isMobile ? "-80px" : "-220px",
      borderRadius: "999px",
      background:
        "radial-gradient(circle, rgba(109,40,217,.22), rgba(109,40,217,0) 68%)",
      filter: "blur(52px)",
      opacity: 0.9,
    },

    topStrip: {
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(255,255,255,.04)",
      borderBottom: "1px solid rgba(255,255,255,.06)",
      backdropFilter: "blur(12px)",
    },

    topStripInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "38px",
      padding: "0 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "rgba(255,255,255,.82)",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: ".02em",
    },

    navbar: {
      position: "sticky",
      top: "38px",
      zIndex: 39,
      background: "rgba(6,16,31,.64)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
      backdropFilter: "blur(16px)",
    },

    navbarInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "88px",
      padding: "0 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "24px",
    },

    navLogo: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: 900,
      letterSpacing: "-.04em",
      color: "#ffffff",
      flexShrink: 0,
    },

    navLinks: {
      display: isMobile ? "none" : "flex",
      alignItems: "center",
      gap: "34px",
    },

    navLink: {
      textDecoration: "none",
      color: "rgba(255,255,255,.94)",
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
      height: "46px",
      padding: "0 18px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.16)",
      background: "rgba(255,255,255,.05)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
    },

    callBtn: {
      height: "46px",
      padding: "0 22px",
      borderRadius: "999px",
      border: "none",
      background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 48%, #818cf8 100%)",
      color: "#07111f",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: 900,
      boxShadow: "0 16px 34px rgba(56,189,248,.22)",
    },

    heroSection: {
      position: "relative",
      zIndex: 2,
      minHeight: isMobile ? "auto" : "820px",
      display: "flex",
      alignItems: "center",
      padding: isMobile ? "48px 0 54px" : "60px 0 94px",
    },

    heroInner: {
      maxWidth: "1280px",
      width: "100%",
      margin: "0 auto",
      padding: "0 28px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.08fr 0.92fr",
      gap: isMobile ? "34px" : "44px",
      alignItems: "center",
    },

    heroLeft: {
      position: "relative",
      zIndex: 2,
    },

    heroRight: {
      position: "relative",
      zIndex: 2,
      display: "flex",
      justifyContent: isMobile ? "flex-start" : "flex-end",
    },

    heroKicker: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: ".24em",
      textTransform: "uppercase",
      marginBottom: "18px",
    },

    heroTitle: {
      margin: "0 0 20px 0",
      color: "#ffffff",
      fontSize: isMobile ? "54px" : "98px",
      fontWeight: 900,
      lineHeight: 0.92,
      letterSpacing: "-.07em",
      maxWidth: "820px",
    },

    heroLead: {
      margin: "0 0 30px 0",
      color: "rgba(255,255,255,.80)",
      fontSize: isMobile ? "17px" : "21px",
      lineHeight: 1.68,
      maxWidth: "720px",
    },

    heroCtas: {
      display: "flex",
      flexWrap: "wrap",
      gap: "14px",
      marginBottom: "26px",
    },

    primaryBtn: {
      minWidth: "170px",
      height: "56px",
      padding: "0 24px",
      borderRadius: "999px",
      background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 60%, #c084fc 100%)",
      color: "#ffffff",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "15px",
      fontWeight: 900,
      border: "none",
      boxShadow: "0 18px 40px rgba(124,58,237,.30)",
      cursor: "pointer",
    },

    secondaryBtn: {
      minWidth: "170px",
      height: "56px",
      padding: "0 24px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(255,255,255,.05)",
      color: "#ffffff",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "15px",
      fontWeight: 800,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
    },

    trustRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "14px",
      maxWidth: "760px",
    },

    trustCard: {
      borderRadius: "22px",
      padding: "18px 18px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.08)",
      boxShadow: "0 12px 30px rgba(0,0,0,.14)",
    },

    trustNumber: {
      color: "#ffffff",
      fontSize: "22px",
      fontWeight: 900,
      marginBottom: "4px",
    },

    trustLabel: {
      color: "rgba(255,255,255,.70)",
      fontSize: "13px",
      fontWeight: 700,
    },

    visualShell: {
      position: "relative",
      width: "100%",
      maxWidth: "520px",
      minHeight: isMobile ? "360px" : "520px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    visualGlow: {
      position: "absolute",
      inset: "8%",
      borderRadius: "40px",
      background:
        "radial-gradient(circle at center, rgba(56,189,248,.14), rgba(124,58,237,.10), rgba(0,0,0,0) 72%)",
      filter: "blur(26px)",
    },

    visualMainCard: {
      position: "relative",
      zIndex: 3,
      width: "100%",
      maxWidth: "420px",
      borderRadius: "34px",
      padding: "30px",
      background: "linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.05))",
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "0 28px 80px rgba(0,0,0,.28)",
      backdropFilter: "blur(18px)",
    },

    visualEyebrow: {
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: ".20em",
      textTransform: "uppercase",
      marginBottom: "12px",
    },

    visualPlanSpeed: {
      color: "#ffffff",
      fontSize: isMobile ? "44px" : "58px",
      fontWeight: 900,
      lineHeight: 0.96,
      letterSpacing: "-.05em",
      marginBottom: "12px",
    },

    visualPlanCached: {
      color: "#dbeafe",
      fontSize: "16px",
      fontWeight: 700,
      marginBottom: "14px",
    },

    visualPlanMeta: {
      color: "rgba(255,255,255,.76)",
      fontSize: "14px",
      lineHeight: 1.5,
      marginBottom: "18px",
    },

    visualPrice: {
      color: "#38bdf8",
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-.04em",
    },

    visualMiniLeft: {
      position: "absolute",
      left: 0,
      bottom: isMobile ? "4px" : "26px",
      zIndex: 2,
      borderRadius: "20px",
      padding: "16px 18px",
      background: "linear-gradient(180deg, rgba(124,58,237,.24), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 14px 36px rgba(0,0,0,.18)",
    },

    visualMiniRight: {
      position: "absolute",
      right: 0,
      top: isMobile ? "0" : "26px",
      zIndex: 2,
      borderRadius: "20px",
      padding: "16px 18px",
      background: "linear-gradient(180deg, rgba(56,189,248,.20), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 14px 36px rgba(0,0,0,.18)",
    },

    visualMiniLabel: {
      color: "rgba(255,255,255,.68)",
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      marginBottom: "8px",
    },

    visualMiniValue: {
      color: "#ffffff",
      fontSize: "18px",
      fontWeight: 900,
    },

    section: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "56px 0" : "88px 0",
    },

    sectionAlt: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "56px 0" : "88px 0",
      background: "rgba(255,255,255,.025)",
      borderTop: "1px solid rgba(255,255,255,.05)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
    },

    sectionInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 28px",
    },

    sectionKicker: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: ".24em",
      textTransform: "uppercase",
      marginBottom: "10px",
    },

    sectionTitle: {
      margin: "0 0 16px 0",
      color: "#fff",
      fontSize: isMobile ? "32px" : "54px",
      fontWeight: 900,
      lineHeight: 0.98,
      letterSpacing: "-.05em",
      maxWidth: "760px",
    },

    sectionLead: {
      margin: "0 0 28px 0",
      color: "rgba(255,255,255,.72)",
      fontSize: "17px",
      lineHeight: 1.65,
      maxWidth: "760px",
    },

    planGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "20px",
    },

    planCard: {
      borderRadius: "28px",
      padding: "26px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 46px rgba(0,0,0,.18)",
    },

    planCardFeatured: {
      borderRadius: "28px",
      padding: "28px",
      background: "linear-gradient(180deg, rgba(124,58,237,.34), rgba(255,255,255,.05))",
      border: "1px solid rgba(196,181,253,.28)",
      boxShadow: "0 22px 58px rgba(124,58,237,.22)",
      transform: isMobile ? "none" : "translateY(-10px)",
    },

    planTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "16px",
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
      color: "#fff",
      fontSize: "11px",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: ".06em",
    },

    planSpeed: {
      color: "#ffffff",
      fontSize: "36px",
      fontWeight: 900,
      lineHeight: 1,
      marginBottom: "12px",
      letterSpacing: "-.04em",
    },

    planCached: {
      color: "#dbeafe",
      fontSize: "14px",
      fontWeight: 700,
      marginBottom: "14px",
    },

    planStat: {
      color: "rgba(255,255,255,.78)",
      fontSize: "14px",
      marginBottom: "8px",
    },

    planPrice: {
      marginTop: "18px",
      color: "#38bdf8",
      fontSize: "32px",
      fontWeight: 900,
      letterSpacing: "-.03em",
    },

    addonCard: {
      marginTop: "24px",
      borderRadius: "26px",
      padding: "24px 26px",
      background: "linear-gradient(180deg, rgba(45,212,191,.15), rgba(255,255,255,.04))",
      border: "1px solid rgba(45,212,191,.22)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: "14px",
      boxShadow: "0 18px 44px rgba(0,0,0,.14)",
    },

    addonTitle: {
      color: "#fff",
      fontSize: "22px",
      fontWeight: 900,
      marginBottom: "6px",
    },

    addonMeta: {
      color: "rgba(255,255,255,.78)",
      fontSize: "14px",
      fontWeight: 700,
    },

    addonPrice: {
      color: "#2dd4bf",
      fontSize: "28px",
      fontWeight: 900,
    },

    deviceGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
      gap: "20px",
    },

    infoCard: {
      borderRadius: "24px",
      padding: "24px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 44px rgba(0,0,0,.16)",
    },

    infoTitle: {
      color: "#fff",
      fontSize: "22px",
      fontWeight: 900,
      marginBottom: "16px",
    },

    infoLine: {
      color: "rgba(255,255,255,.78)",
      fontSize: "14px",
      lineHeight: 1.6,
      marginBottom: "10px",
    },

    contactCard: {
      borderRadius: "30px",
      padding: isMobile ? "24px" : "34px",
      background: "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: "26px",
      boxShadow: "0 20px 50px rgba(0,0,0,.16)",
    },

    contactLine: {
      color: "rgba(255,255,255,.80)",
      fontSize: "16px",
      lineHeight: 1.6,
      marginBottom: "8px",
    },

    contactActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
    },

    secondaryButton: {
      minWidth: "170px",
      height: "56px",
      padding: "0 24px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(255,255,255,.05)",
      color: "#ffffff",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "15px",
      fontWeight: 800,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
      cursor: "pointer",
    },

    loginOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "rgba(3,7,18,.68)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },

    loginModal: {
      width: "100%",
      maxWidth: "460px",
      borderRadius: "30px",
      padding: isMobile ? "26px" : "34px",
      background: "linear-gradient(180deg, rgba(8,16,30,.96), rgba(5,10,22,.99))",
      border: "1px solid rgba(96,165,250,.16)",
      boxShadow: "0 28px 80px rgba(0,0,0,.42)",
      position: "relative",
    },

    loginTopBar: {
      width: "70px",
      height: "4px",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #67e8f9, #60a5fa)",
      marginBottom: "18px",
      boxShadow: "0 0 16px rgba(56,189,248,.18)",
    },

    loginBrand: {
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: ".22em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    loginTitle: {
      margin: 0,
      color: "#f8fafc",
      fontSize: isMobile ? "42px" : "52px",
      fontWeight: 900,
      lineHeight: 0.98,
      letterSpacing: "-.05em",
    },

    loginSub: {
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

    loginButton: {
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
      boxShadow: "0 10px 24px rgba(56,189,248,.16)",
      transition: "all .16s ease",
    },
  };
}
