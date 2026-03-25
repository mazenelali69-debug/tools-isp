import { useEffect, useMemo, useRef, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const HERO_SLIDES = [
  {
    lines: ["Faster Internet.", "Stronger Service.", "Clear Pricing."],
    lead:
      "Home internet plans, direct support, hardware options, and unlimited night upgrades for Jabal Mohssen and nearby areas.",
    leftLabel: "Free Night",
    leftValue: "1AM → 1PM",
    rightLabel: "Support",
    rightValue: "70411518",
    accent: "cyan",
  },
  {
    lines: ["Unlimited Night.", "Fast Setup.", "Direct Contact."],
    lead:
      "Clean packages, quick communication, and faster installation without hidden steps or confusing offers.",
    leftLabel: "Coverage",
    leftValue: "Jabal Mohssen",
    rightLabel: "Status",
    rightValue: "Online",
    accent: "violet",
  },
  {
    lines: ["Plans.", "Devices.", "Support."],
    lead:
      "Everything in one place — packages, routers, cables, and direct access for your support operations.",
    leftLabel: "Install",
    leftValue: "Fast",
    rightLabel: "Upgrade",
    rightValue: "Available",
    accent: "cyan",
  },
];

const QUICK_STATS = [
  { value: "6+", label: "Plans" },
  { value: "Fast", label: "Support" },
  { value: "Jabal Mohssen", label: "Coverage" },
  { value: "Available", label: "Upgrade" },
];

const PLANS = [
  { name: "Plan 1", speed: "5 Mbps", cached: "Up to 20 Mbps Cached", daily: "8GB Daily", monthly: "500GB Monthly", price: "$25" },
  { name: "Plan 2", speed: "6 Mbps", cached: "Up to 30 Mbps Cached", daily: "12GB Daily", monthly: "600GB Monthly", price: "$35" },
  { name: "Plan 3", speed: "7 Mbps", cached: "Up to 40 Mbps Cached", daily: "15GB Daily", monthly: "700GB Monthly", price: "$45" },
  { name: "Plan 4", speed: "8 Mbps", cached: "Up to 50 Mbps Cached", daily: "20GB Daily", monthly: "800GB Monthly", price: "$65" },
  { name: "Plan 5", speed: "9 Mbps", cached: "Up to 60 Mbps Cached", daily: "30GB Daily", monthly: "900GB Monthly", price: "$75" },
  { name: "Plan 6", speed: "10 Mbps", cached: "Up to 100 Mbps Cached", daily: "40GB Daily", monthly: "1000GB Monthly", price: "$100", featured: true },
];

const DEVICES = [
  { name: "Tenda", lines: ["N300 4G — $20", "AC1200 4G & 5G — $25"], type: "router" },
  { name: "Netis", lines: ["N3 4G & 5G — $25"], type: "router" },
  { name: "V-Sol", lines: ["AC3000 4G / 5G / 6G — $40", "AC3200 4G / 5G / 6G / 7G — $100"], type: "router" },
  { name: "Cables", lines: ["Cat 5E — $0.30 / m", "Cat 6E++ — $0.40 / m"], type: "cable" },
];

function useViewport() {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function RouterIcon() {
  return (
    <svg viewBox="0 0 140 90" width="100%" height="90" aria-hidden="true">
      <defs>
        <linearGradient id="routerBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#131d31" />
          <stop offset="100%" stopColor="#1d2a43" />
        </linearGradient>
      </defs>
      <rect x="14" y="36" width="112" height="30" rx="12" fill="url(#routerBase)" stroke="rgba(255,255,255,.14)" />
      <rect x="28" y="46" width="62" height="5" rx="2.5" fill="rgba(255,255,255,.08)" />
      <circle cx="98" cy="51" r="3" fill="#7dd3fc" />
      <circle cx="108" cy="51" r="3" fill="#a78bfa" />
      <path d="M79 24c8-10 21-10 29 0" stroke="#7dd3fc" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M84 31c5-6 13-6 18 0" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="72" width="92" height="4" rx="2" fill="rgba(56,189,248,.18)" />
    </svg>
  );
}

function CableIcon() {
  return (
    <svg viewBox="0 0 140 90" width="100%" height="90" aria-hidden="true">
      <defs>
        <linearGradient id="cableGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <path d="M14 48 C40 16, 98 78, 126 42" stroke="url(#cableGlow)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="10" y="40" width="12" height="14" rx="2" fill="#8b5cf6" />
      <rect x="118" y="35" width="12" height="14" rx="2" fill="#7dd3fc" />
      <circle cx="66" cy="38" r="3.5" fill="rgba(56,189,248,.9)" />
      <circle cx="86" cy="52" r="3.5" fill="rgba(139,92,246,.9)" />
    </svg>
  );
}

function HeroVisual({ accent = "cyan", isMobile }) {
  const accentGlow =
    accent === "violet"
      ? "radial-gradient(circle at 72% 24%, rgba(139,92,246,.34), rgba(139,92,246,0) 42%)"
      : "radial-gradient(circle at 72% 24%, rgba(56,189,248,.34), rgba(56,189,248,0) 42%)";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isMobile ? "100%" : "510px",
        minHeight: isMobile ? "420px" : "560px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "20px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "36px",
          background: accentGlow,
          filter: "blur(12px)",
          opacity: 0.95,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          borderRadius: "34px",
          minHeight: isMobile ? "220px" : "260px",
          background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05))",
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow: "0 26px 80px rgba(0,0,0,.32)",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "22px" : "28px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              accent === "violet"
                ? "radial-gradient(circle at 62% 32%, rgba(139,92,246,.22), transparent 38%)"
                : "radial-gradient(circle at 62% 32%, rgba(56,189,248,.18), transparent 38%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgba(9,16,34,.58), rgba(9,16,34,.32))",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <svg viewBox="0 0 320 220" width="100%" height="100%" aria-hidden="true">
            <path d="M116 96c24-32 64-32 88 0" stroke="#7dd3fc" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M132 128c15-18 41-18 56 0" stroke="#c084fc" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M148 158c8-9 18-9 26 0" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="161" cy="188" r="9" fill="white" />
          </svg>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          borderRadius: "30px",
          background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.045))",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 22px 60px rgba(0,0,0,.28)",
          backdropFilter: "blur(16px)",
          padding: isMobile ? "18px" : "20px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "14px",
        }}
      >
        {QUICK_STATS.map((item, idx) => (
          <div
            key={item.label}
            style={{
              minHeight: "86px",
              borderRadius: "18px",
              padding: "14px 14px 12px",
              background:
                idx === 1 || idx === 3
                  ? "linear-gradient(180deg, rgba(56,189,248,.18), rgba(255,255,255,.06))"
                  : "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: item.value.length > 10 ? "14px" : "18px",
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.68)",
              }}
            >
              {item.label}
            </div>
          </div>
        ))}

        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            paddingTop: "4px",
          }}
        >
          <span style={{ width: 26, height: 8, borderRadius: 999, background: "linear-gradient(90deg, #8b5cf6, #38bdf8)" }} />
          <span style={{ width: 26, height: 8, borderRadius: 999, background: "rgba(255,255,255,.18)" }} />
          <span style={{ width: 26, height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)" }} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const width = useViewport();
  const isMobile = width < 980;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRef = useRef(null);
  const styles = useMemo(() => getStyles(isMobile), [isMobile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showLogin) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => userRef.current?.focus?.(), 50);

    function onKeyDown(e) {
      if (e.key === "Escape") setShowLogin(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showLogin]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function submit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const u = String(username || "").trim();
    const p = String(password || "");

    if (!u || !p) {
      setErr("Please enter username and password");
      setIsSubmitting(false);
      return;
    }

    if (u === VALID_USERNAME && p === VALID_PASSWORD) {
      sessionStorage.setItem("noc_token", "ok");
      sessionStorage.setItem("noc_user", u);
      setErr("");
      setIsSubmitting(false);
      onLogin?.();
      return;
    }

    setErr("Invalid credentials");
    setIsSubmitting(false);
  }

  function closeMenuAndGo() {
    setMenuOpen(false);
  }

  const slide = HERO_SLIDES[heroIndex];

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />
      <div style={styles.grid} />

      <div style={styles.topStrip}>
        <div style={styles.topStripInner}>
          <div>Jabal Mohssen</div>
          <div>Customer Support 70411518</div>
        </div>
      </div>

      <div style={styles.navbar}>
        <div style={styles.navbarInner}>
          <div style={styles.navLogo}>NoComment</div>

          {!isMobile ? (
            <div style={styles.navLinks}>
              <a href="#home" style={styles.navLink}>Home</a>
              <a href="#plans" style={styles.navLink}>Plans</a>
              <a href="#devices" style={styles.navLink}>Devices</a>
              <a href="#contact" style={styles.navLink}>Contact</a>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
              style={styles.menuBtn}
            >
              <span style={styles.menuLine} />
              <span style={styles.menuLine} />
              <span style={styles.menuLine} />
            </button>
          )}

          <div style={styles.navActions}>
            <button type="button" onClick={() => setShowLogin(true)} style={styles.supportBtn}>
              Support Login
            </button>
            <a href="tel:70411518" style={styles.callBtn}>
              Call Now
            </a>
          </div>
        </div>

        {isMobile && menuOpen ? (
          <div style={styles.mobileMenu}>
            <a href="#home" style={styles.mobileMenuLink} onClick={closeMenuAndGo}>Home</a>
            <a href="#plans" style={styles.mobileMenuLink} onClick={closeMenuAndGo}>Plans</a>
            <a href="#devices" style={styles.mobileMenuLink} onClick={closeMenuAndGo}>Devices</a>
            <a href="#contact" style={styles.mobileMenuLink} onClick={closeMenuAndGo}>Contact</a>
          </div>
        ) : null}
      </div>

      <section id="home" style={styles.heroSection}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <div style={styles.heroKicker}>NoComment Network</div>

            <div style={styles.heroTitleWrap}>
              <div style={styles.heroLine}>{slide.lines[0]}</div>
              <div style={styles.heroLine}>{slide.lines[1]}</div>
              <div style={styles.heroLineAccent}>{slide.lines[2]}</div>
            </div>

            <p style={styles.heroLead}>{slide.lead}</p>

            <div style={styles.heroCtas}>
              <a href="#plans" style={styles.primaryBtn}>View Plans</a>
              <a href="tel:70411518" style={styles.secondaryBtn}>Call Now</a>
            </div>

            <div style={styles.miniInfoRow}>
              <div style={styles.miniInfoCard}>
                <div style={styles.miniInfoLabel}>{slide.leftLabel}</div>
                <div style={styles.miniInfoValue}>{slide.leftValue}</div>
              </div>

              <div style={styles.miniInfoCard}>
                <div style={styles.miniInfoLabel}>{slide.rightLabel}</div>
                <div style={styles.miniInfoValue}>{slide.rightValue}</div>
              </div>
            </div>

            <div style={styles.heroDots}>
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setHeroIndex(idx)}
                  style={idx === heroIndex ? styles.heroDotActive : styles.heroDot}
                />
              ))}
            </div>
          </div>

          <div style={styles.heroRight}>
            <HeroVisual accent={slide.accent} isMobile={isMobile} />
          </div>
        </div>
      </section>

      <section id="plans" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Internet Plans</div>
          <h2 style={styles.sectionTitle}>Plans that sell themselves.</h2>
          <p style={styles.sectionLead}>
            Clear packages, visible prices, stronger layout, and a featured offer that actually stands out.
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

                <div style={styles.planStatsWrap}>
                  <div style={styles.planStatBox}>
                    <div style={styles.planStatLabel}>Daily</div>
                    <div style={styles.planStatValue}>{plan.daily}</div>
                  </div>
                  <div style={styles.planStatBox}>
                    <div style={styles.planStatLabel}>Monthly</div>
                    <div style={styles.planStatValue}>{plan.monthly}</div>
                  </div>
                </div>

                <div style={styles.planFooter}>
                  <div style={styles.planPrice}>{plan.price}</div>
                  <a href="tel:70411518" style={styles.planActionBtn}>Order Now</a>
                </div>
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
          <p style={styles.sectionLead}>
            Cleaner product cards, better spacing, and stronger visual hierarchy without messy overlap.
          </p>

          <div style={styles.deviceGrid}>
            {DEVICES.map((item, idx) => (
              <div key={item.name} style={idx === 2 ? styles.infoCardAccent : styles.infoCard}>
                {item.type === "router" ? <RouterIcon /> : <CableIcon />}
                <div style={styles.infoTitle}>{item.name}</div>
                {item.lines.map((line) => (
                  <div key={line} style={styles.infoLine}>{line}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.contactCard}>
            <div style={styles.contactLeft}>
              <div style={styles.sectionKicker}>Contact</div>
              <h2 style={styles.sectionTitle}>Talk to NoComment directly.</h2>

              <div style={styles.contactMetaGrid}>
                <div style={styles.contactMetaBox}>
                  <div style={styles.contactMetaLabel}>Phone</div>
                  <div style={styles.contactMetaValue}>70411518</div>
                </div>
                <div style={styles.contactMetaBox}>
                  <div style={styles.contactMetaLabel}>Location</div>
                  <div style={styles.contactMetaValue}>Jabal Mohssen</div>
                </div>
                <div style={styles.contactMetaBox}>
                  <div style={styles.contactMetaLabel}>Network</div>
                  <div style={styles.contactMetaValue}>NoComment</div>
                </div>
              </div>
            </div>

            <div style={styles.contactActions}>
              <a href="tel:70411518" style={styles.primaryBtn}>Call Now</a>
              <button type="button" onClick={() => setShowLogin(true)} style={styles.secondaryButton}>
                Support Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {showLogin ? (
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
                  ref={userRef}
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
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {err ? <div style={styles.err}>{err}</div> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.loginButton,
                  ...(isSubmitting ? styles.loginButtonDisabled : null),
                }}
              >
                {isSubmitting ? "Checking..." : "Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getStyles(isMobile) {
  const shell = "rgba(255,255,255,.06)";
  const border = "1px solid rgba(255,255,255,.10)";

  return {
    page: {
      position: "relative",
      minHeight: "100dvh",
      overflowX: "hidden",
      background: "#040b18",
      color: "#ffffff",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    bg: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #040b18 0%, #071120 45%, #09172b 100%)",
      zIndex: 0,
    },

    bgGlowTop: {
      position: "absolute",
      top: "-120px",
      right: "-80px",
      width: "620px",
      height: "620px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(56,189,248,.26), rgba(56,189,248,0) 58%)",
      filter: "blur(30px)",
      zIndex: 0,
      pointerEvents: "none",
    },

    bgGlowBottom: {
      position: "absolute",
      left: "-140px",
      bottom: "120px",
      width: "560px",
      height: "560px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(139,92,246,.24), rgba(139,92,246,0) 58%)",
      filter: "blur(34px)",
      zIndex: 0,
      pointerEvents: "none",
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
      backgroundSize: isMobile ? "28px 28px" : "44px 44px",
      opacity: 0.18,
      zIndex: 0,
      pointerEvents: "none",
    },

    topStrip: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(8,15,30,.82)",
      borderBottom: "1px solid rgba(255,255,255,.06)",
      backdropFilter: "blur(12px)",
    },

    topStripInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "38px",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      color: "rgba(255,255,255,.82)",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: ".02em",
    },

    navbar: {
      position: "sticky",
      top: "38px",
      zIndex: 49,
      background: "rgba(6,14,27,.80)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
      backdropFilter: "blur(18px)",
    },

    navbarInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "76px",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "18px",
    },

    navLogo: {
      fontSize: isMobile ? "30px" : "32px",
      fontWeight: 950,
      lineHeight: 1,
      letterSpacing: "-.05em",
      whiteSpace: "nowrap",
    },

    navLinks: {
      display: "flex",
      alignItems: "center",
      gap: "28px",
    },

    navLink: {
      color: "rgba(255,255,255,.92)",
      textDecoration: "none",
      fontSize: "15px",
      fontWeight: 800,
    },

    navActions: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginLeft: "auto",
    },

    supportBtn: {
      height: "42px",
      padding: "0 18px",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.03)",
      color: "#fff",
      fontWeight: 900,
      fontSize: "14px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
    },

    callBtn: {
      height: "42px",
      padding: "0 22px",
      borderRadius: "16px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      background: "linear-gradient(135deg, #38bdf8, #7c8cff)",
      color: "#071120",
      fontWeight: 950,
      fontSize: "14px",
      whiteSpace: "nowrap",
      boxShadow: "0 12px 30px rgba(56,189,248,.22)",
    },

    menuBtn: {
      width: "46px",
      height: "46px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.03)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "5px",
      padding: "0 11px",
      cursor: "pointer",
    },

    menuLine: {
      width: "100%",
      height: "2px",
      borderRadius: "999px",
      background: "#fff",
      opacity: 0.9,
    },

    mobileMenu: {
      borderTop: "1px solid rgba(255,255,255,.05)",
      display: "flex",
      flexDirection: "column",
      padding: "8px 18px 18px",
      gap: "8px",
    },

    mobileMenuLink: {
      textDecoration: "none",
      color: "rgba(255,255,255,.92)",
      fontWeight: 800,
      padding: "10px 8px",
      borderRadius: "12px",
      background: "rgba(255,255,255,.03)",
    },

    heroSection: {
      position: "relative",
      zIndex: 1,
      padding: isMobile ? "38px 0 56px" : "52px 0 72px",
    },

    heroInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 24px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.08fr) minmax(420px, .92fr)",
      gap: isMobile ? "34px" : "44px",
      alignItems: "center",
    },

    heroLeft: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "8px 0" : "18px 0",
      maxWidth: "700px",
    },

    heroRight: {
      position: "relative",
      zIndex: 2,
      display: "flex",
      justifyContent: isMobile ? "stretch" : "flex-end",
    },

    heroKicker: {
      display: "inline-flex",
      alignItems: "center",
      minHeight: "30px",
      padding: "0 12px",
      borderRadius: "999px",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
      color: "#7dd3fc",
      fontWeight: 900,
      fontSize: "12px",
      letterSpacing: ".20em",
      textTransform: "uppercase",
      marginBottom: "22px",
    },

    heroTitleWrap: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "0px" : "2px",
      marginBottom: "20px",
    },

    heroLine: {
      fontSize: isMobile ? "56px" : "92px",
      lineHeight: isMobile ? 0.94 : 0.90,
      fontWeight: 950,
      letterSpacing: "-.07em",
      color: "#ffffff",
      textWrap: "balance",
    },

    heroLineAccent: {
      fontSize: isMobile ? "56px" : "92px",
      lineHeight: isMobile ? 0.94 : 0.90,
      fontWeight: 950,
      letterSpacing: "-.07em",
      color: "#7dd3fc",
      textWrap: "balance",
      textShadow: "0 0 34px rgba(56,189,248,.16)",
    },

    heroLead: {
      margin: 0,
      maxWidth: "720px",
      fontSize: isMobile ? "21px" : "19px",
      lineHeight: 1.65,
      color: "rgba(255,255,255,.80)",
    },

    heroCtas: {
      display: "flex",
      flexWrap: "wrap",
      gap: "14px",
      marginTop: "28px",
      marginBottom: "26px",
    },

    primaryBtn: {
      minWidth: "148px",
      height: "54px",
      borderRadius: "18px",
      padding: "0 24px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      background: "linear-gradient(135deg, #7c3aed, #a855f7 50%, #38bdf8 120%)",
      color: "#fff",
      fontSize: "15px",
      fontWeight: 950,
      boxShadow: "0 18px 42px rgba(124,58,237,.28)",
    },

    secondaryBtn: {
      minWidth: "148px",
      height: "54px",
      borderRadius: "18px",
      padding: "0 24px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      background: "rgba(255,255,255,.03)",
      color: "#fff",
      fontSize: "15px",
      fontWeight: 900,
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
    },

    miniInfoRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "14px",
      maxWidth: "640px",
    },

    miniInfoCard: {
      borderRadius: "22px",
      padding: "18px 18px 16px",
      background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 16px 42px rgba(0,0,0,.18)",
    },

    miniInfoLabel: {
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,.58)",
      marginBottom: "8px",
    },

    miniInfoValue: {
      fontSize: "18px",
      lineHeight: 1.2,
      fontWeight: 900,
      color: "#fff",
    },

    heroDots: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      marginTop: "22px",
    },

    heroDot: {
      width: "26px",
      height: "8px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.12)",
      cursor: "pointer",
      padding: 0,
    },

    heroDotActive: {
      width: "34px",
      height: "8px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "linear-gradient(90deg, #8b5cf6, #38bdf8)",
      cursor: "pointer",
      padding: 0,
      boxShadow: "0 0 16px rgba(56,189,248,.18)",
    },

    section: {
      position: "relative",
      zIndex: 1,
      padding: isMobile ? "34px 0 54px" : "44px 0 72px",
    },

    sectionAlt: {
      position: "relative",
      zIndex: 1,
      padding: isMobile ? "18px 0 54px" : "24px 0 72px",
    },

    sectionInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 24px",
    },

    sectionKicker: {
      color: "#7dd3fc",
      fontWeight: 900,
      fontSize: "12px",
      letterSpacing: ".24em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    sectionTitle: {
      margin: 0,
      fontSize: isMobile ? "34px" : "52px",
      lineHeight: 1.02,
      fontWeight: 950,
      letterSpacing: "-.05em",
    },

    sectionLead: {
      margin: "16px 0 0",
      maxWidth: "760px",
      fontSize: isMobile ? "17px" : "19px",
      lineHeight: 1.7,
      color: "rgba(255,255,255,.76)",
    },

    planGrid: {
      marginTop: "28px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "18px",
    },

    planCard: {
      borderRadius: "28px",
      padding: "22px",
      background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.035))",
      border,
      boxShadow: "0 20px 54px rgba(0,0,0,.20)",
      backdropFilter: "blur(14px)",
    },

    planCardFeatured: {
      borderRadius: "28px",
      padding: "22px",
      background: "linear-gradient(180deg, rgba(56,189,248,.12), rgba(124,58,237,.10), rgba(255,255,255,.035))",
      border: "1px solid rgba(125,211,252,.20)",
      boxShadow: "0 24px 64px rgba(0,0,0,.24)",
      backdropFilter: "blur(14px)",
      transform: isMobile ? "none" : "translateY(-8px)",
    },

    planTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      marginBottom: "18px",
    },

    planName: {
      fontSize: "20px",
      fontWeight: 900,
      lineHeight: 1.1,
    },

    planBadge: {
      height: "28px",
      padding: "0 12px",
      borderRadius: "999px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(125,211,252,.14)",
      border: "1px solid rgba(125,211,252,.18)",
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: ".10em",
      whiteSpace: "nowrap",
    },

    planSpeed: {
      fontSize: "34px",
      lineHeight: 1,
      fontWeight: 950,
      letterSpacing: "-.04em",
      marginBottom: "10px",
    },

    planCached: {
      fontSize: "15px",
      color: "rgba(255,255,255,.68)",
      marginBottom: "18px",
      lineHeight: 1.45,
    },

    planStatsWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "20px",
    },

    planStatBox: {
      borderRadius: "18px",
      padding: "14px",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
    },

    planStatLabel: {
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,.54)",
      marginBottom: "8px",
    },

    planStatValue: {
      fontSize: "15px",
      fontWeight: 850,
      lineHeight: 1.35,
      color: "#fff",
    },

    planFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    },

    planPrice: {
      fontSize: "28px",
      fontWeight: 950,
      letterSpacing: "-.03em",
    },

    planActionBtn: {
      minWidth: "116px",
      height: "44px",
      padding: "0 16px",
      borderRadius: "14px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      background: "rgba(255,255,255,.05)",
      color: "#fff",
      fontWeight: 900,
      fontSize: "14px",
      border: "1px solid rgba(255,255,255,.10)",
    },

    addonCard: {
      marginTop: "20px",
      borderRadius: "24px",
      padding: isMobile ? "18px" : "20px 22px",
      background: "linear-gradient(90deg, rgba(124,58,237,.14), rgba(56,189,248,.12))",
      border: "1px solid rgba(255,255,255,.10)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "18px",
      flexWrap: "wrap",
      boxShadow: "0 18px 46px rgba(0,0,0,.18)",
    },

    addonTitle: {
      fontSize: "18px",
      fontWeight: 900,
      marginBottom: "6px",
    },

    addonMeta: {
      fontSize: "14px",
      color: "rgba(255,255,255,.70)",
      fontWeight: 700,
    },

    addonPrice: {
      fontSize: "28px",
      fontWeight: 950,
      letterSpacing: "-.03em",
      color: "#fff",
    },

    deviceGrid: {
      marginTop: "28px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
      gap: "18px",
    },

    infoCard: {
      borderRadius: "28px",
      padding: "20px",
      background: "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.035))",
      border,
      boxShadow: "0 20px 50px rgba(0,0,0,.18)",
      backdropFilter: "blur(14px)",
    },

    infoCardAccent: {
      borderRadius: "28px",
      padding: "20px",
      background: "linear-gradient(180deg, rgba(124,58,237,.15), rgba(56,189,248,.12), rgba(255,255,255,.035))",
      border: "1px solid rgba(125,211,252,.18)",
      boxShadow: "0 22px 56px rgba(0,0,0,.20)",
      backdropFilter: "blur(14px)",
    },

    infoTitle: {
      marginTop: "12px",
      marginBottom: "10px",
      fontSize: "22px",
      lineHeight: 1.1,
      fontWeight: 900,
      letterSpacing: "-.03em",
    },

    infoLine: {
      fontSize: "15px",
      lineHeight: 1.6,
      color: "rgba(255,255,255,.76)",
    },

    contactCard: {
      marginTop: "24px",
      borderRadius: "32px",
      padding: isMobile ? "22px" : "26px",
      background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.035))",
      border,
      boxShadow: "0 22px 62px rgba(0,0,0,.22)",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
      gap: "24px",
      alignItems: "center",
      backdropFilter: "blur(14px)",
    },

    contactLeft: {
      minWidth: 0,
    },

    contactMetaGrid: {
      marginTop: "22px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "14px",
    },

    contactMetaBox: {
      borderRadius: "20px",
      padding: "16px",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
    },

    contactMetaLabel: {
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,.54)",
      marginBottom: "8px",
    },

    contactMetaValue: {
      fontSize: "17px",
      lineHeight: 1.35,
      fontWeight: 900,
      color: "#fff",
    },

    contactActions: {
      display: "flex",
      flexDirection: isMobile ? "row" : "column",
      flexWrap: "wrap",
      gap: "14px",
      justifyContent: isMobile ? "flex-start" : "center",
      alignItems: isMobile ? "stretch" : "stretch",
    },

    secondaryButton: {
      minWidth: "160px",
      height: "54px",
      borderRadius: "18px",
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.03)",
      color: "#fff",
      fontWeight: 900,
      fontSize: "15px",
      cursor: "pointer",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
    },

    loginOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "rgba(2,6,15,.62)",
      backdropFilter: "blur(16px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    },

    loginModal: {
      width: "100%",
      maxWidth: "470px",
      borderRadius: "28px",
      padding: "22px",
      background: "linear-gradient(180deg, rgba(7,17,33,.94), rgba(9,20,40,.92))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 36px 90px rgba(0,0,0,.42)",
      position: "relative",
      overflow: "hidden",
    },

    loginTopBar: {
      position: "absolute",
      top: 0,
      left: "22px",
      right: "22px",
      height: "4px",
      borderBottomLeftRadius: "999px",
      borderBottomRightRadius: "999px",
      background: "linear-gradient(90deg, #8b5cf6, #38bdf8, #2dd4bf)",
    },

    loginBrand: {
      marginTop: "8px",
      color: "#7dd3fc",
      fontWeight: 900,
      fontSize: "12px",
      letterSpacing: ".22em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    loginTitle: {
      margin: 0,
      fontSize: "48px",
      lineHeight: 0.95,
      fontWeight: 950,
      letterSpacing: "-.05em",
    },

    loginSub: {
      marginTop: "10px",
      marginBottom: "24px",
      color: "rgba(255,255,255,.66)",
      fontSize: "15px",
      lineHeight: 1.5,
      fontWeight: 600,
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },

    label: {
      fontSize: "13px",
      fontWeight: 900,
      color: "rgba(255,255,255,.82)",
    },

    input: {
      width: "100%",
      height: "56px",
      borderRadius: "18px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.025))",
      color: "#fff",
      padding: "0 16px",
      fontSize: "15px",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: "inset 0 0 0 1px rgba(56,189,248,.10)",
    },

    passwordWrap: {
      position: "relative",
    },

    passwordToggle: {
      position: "absolute",
      top: "50%",
      right: "10px",
      transform: "translateY(-50%)",
      minWidth: "62px",
      height: "38px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.05)",
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },

    err: {
      borderRadius: "16px",
      padding: "12px 14px",
      background: "rgba(239,68,68,.10)",
      border: "1px solid rgba(239,68,68,.24)",
      color: "#fecaca",
      fontWeight: 800,
      fontSize: "14px",
      lineHeight: 1.4,
    },

    loginButton: {
      marginTop: "2px",
      width: "100%",
      height: "56px",
      borderRadius: "18px",
      border: "none",
      background: "linear-gradient(135deg, #4dd0f0, #7a8cff)",
      color: "#071120",
      fontWeight: 950,
      fontSize: "18px",
      cursor: "pointer",
      boxShadow: "0 18px 40px rgba(56,189,248,.22)",
    },

    loginButtonDisabled: {
      opacity: 0.72,
      cursor: "wait",
    },
  };
}
