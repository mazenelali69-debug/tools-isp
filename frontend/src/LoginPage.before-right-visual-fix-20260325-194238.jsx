import { useEffect, useMemo, useRef, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const HERO_IMAGES = ["/hero-1.svg", "/hero-2.svg", "/hero-3.svg"];

const HERO_WORDS = [
  ["Faster Internet.", "Stronger Service.", "Clear Pricing."],
  ["Unlimited Night.", "Fast Setup.", "Direct Contact."],
  ["Plans.", "Devices.", "Support."],
];

const HERO_META = [
  {
    lead: "Home internet plans, direct support, hardware options, and unlimited night upgrades for Jabal Mohssen and nearby areas.",
    leftLabel: "Free Night",
    leftValue: "1AM → 1PM",
    rightLabel: "Support",
    rightValue: "70411518",
  },
  {
    lead: "Clear packages, visible prices, and a faster path to installation without hidden steps.",
    leftLabel: "Coverage",
    leftValue: "Jabal Mohssen",
    rightLabel: "Status",
    rightValue: "Online",
  },
  {
    lead: "Everything in one place — packages, routers, cables, and support access for your operations team.",
    leftLabel: "Install",
    leftValue: "Fast",
    rightLabel: "Upgrade",
    rightValue: "Available",
  },
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
  { name: "Tenda", lines: ["N300 4G — $20", "AC1200 4G & 5G — $25"], kind: "router" },
  { name: "Netis", lines: ["N3 4G & 5G — $25"], kind: "router" },
  { name: "V-Sol", lines: ["AC3000 4G / 5G / 6G — $40", "AC3200 4G / 5G / 6G / 7G — $100"], kind: "router" },
  { name: "Cables", lines: ["Cat 5E — $0.30 / m", "Cat 6E++ — $0.40 / m"], kind: "cable" },
];

const QUICK_STATS = [
  { label: "Plans", value: "6+" },
  { label: "Support", value: "Fast" },
  { label: "Coverage", value: "Jabal Mohssen" },
  { label: "Upgrade", value: "Available" },
];

function makeDots(count = 18) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    size: 2 + Math.random() * 2,
    opacity: 0.04 + Math.random() * 0.10,
  }));
}

function RouterIcon() {
  return (
    <svg viewBox="0 0 140 90" width="100%" height="92" aria-hidden="true">
      <defs>
        <linearGradient id="routerFill" x1="0" x2="1">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect x="14" y="36" width="112" height="32" rx="12" fill="url(#routerFill)" stroke="rgba(255,255,255,.16)" />
      <circle cx="44" cy="52" r="3.2" fill="#7dd3fc" />
      <circle cx="56" cy="52" r="3.2" fill="#8b5cf6" />
      <circle cx="68" cy="52" r="3.2" fill="#38bdf8" />
      <path d="M80 24c8-10 22-10 30 0" stroke="#7dd3fc" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M84 31c5-6 14-6 19 0" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
      <rect x="28" y="44" width="88" height="7" rx="3.5" fill="rgba(255,255,255,.06)" />
      <rect x="30" y="72" width="80" height="4" rx="2" fill="rgba(56,189,248,.28)" />
    </svg>
  );
}

function CableIcon() {
  return (
    <svg viewBox="0 0 140 90" width="100%" height="92" aria-hidden="true">
      <defs>
        <linearGradient id="cableGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <path d="M12 46 C40 18, 96 74, 128 42" stroke="url(#cableGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="8" y="38" width="12" height="14" rx="2" fill="#8b5cf6" />
      <rect x="120" y="35" width="12" height="14" rx="2" fill="#7dd3fc" />
      <circle cx="64" cy="38" r="3.5" fill="rgba(56,189,248,.9)" />
      <circle cx="84" cy="52" r="3.5" fill="rgba(139,92,246,.9)" />
    </svg>
  );
}

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

export default function LoginPage({ onLogin }) {
  const width = useViewport();
  const isMobile = width < 920;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRef = useRef(null);
  const dots = useMemo(() => makeDots(18), []);
  const styles = useMemo(() => getStyles(isMobile), [isMobile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showLogin) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => userRef.current?.focus?.(), 40);

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

  const words = HERO_WORDS[heroIndex];
  const meta = HERO_META[heroIndex];

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.grid} />

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
            background: "rgba(125,211,252,.9)",
            boxShadow: "0 0 10px rgba(56,189,248,.16)",
            opacity: d.opacity,
            pointerEvents: "none",
            zIndex: 1,
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
        {HERO_IMAGES.map((img, idx) => (
          <div
            key={img}
            style={{
              ...styles.heroBg,
              backgroundImage: `url(${img})`,
              opacity: idx === heroIndex ? 1 : 0,
              transform: idx === heroIndex ? "scale(1)" : "scale(1.03)",
            }}
          />
        ))}

        <div style={styles.heroOverlay} />

        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <div style={styles.heroCopyCard}>
              <div style={styles.heroKicker}>NoComment Network</div>

            <div style={styles.heroTitleWrap}>
              <div key={words[0] + heroIndex} style={styles.heroLine}>{words[0]}</div>
              <div key={words[1] + heroIndex} style={styles.heroLine}>{words[1]}</div>
              <div key={words[2] + heroIndex} style={styles.heroLineAccent}>{words[2]}</div>
            </div>

            <p key={meta.lead + heroIndex} style={styles.heroLead}>
              {meta.lead}
            </p>

            <div style={styles.heroCtas}>
              <a href="#plans" style={styles.primaryBtn}>View Plans</a>
              <a href="tel:70411518" style={styles.secondaryBtn}>Call Now</a>
            </div>

            <div style={styles.miniInfoRow}>
              <div style={styles.miniInfoCard}>
                <div style={styles.miniInfoLabel}>{meta.leftLabel}</div>
                <div style={styles.miniInfoValue}>{meta.leftValue}</div>
              </div>

              <div style={styles.miniInfoCard}>
                <div style={styles.miniInfoLabel}>{meta.rightLabel}</div>
                <div style={styles.miniInfoValue}>{meta.rightValue}</div>
              </div>
            </div>
          </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.heroRightCard}>
              <div style={styles.heroStatGrid}>
                {QUICK_STATS.map((item) => (
                  <div key={item.label} style={styles.heroStatCard}>
                    <div style={styles.heroStatValue}>{item.value}</div>
                    <div style={styles.heroStatLabel}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={styles.heroDots}>
                {HERO_IMAGES.map((_, idx) => (
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
            Routers and cables presented in a cleaner premium layout with stronger product cards.
          </p>

          <div style={styles.deviceGrid}>
            {DEVICES.map((item, idx) => (
              <div
                key={item.name}
                style={idx === 2 ? styles.infoCardAccent : styles.infoCard}
              >
                {item.kind === "router" ? <RouterIcon /> : <CableIcon />}
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
      background: "linear-gradient(180deg, #06101f 0%, #071425 42%, #09192f 100%)",
      zIndex: 0,
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
      backgroundSize: isMobile ? "28px 28px" : "38px 38px",
      opacity: 0.16,
      zIndex: 0,
    },

    topStrip: {
      position: "sticky",
      top: 0,
      zIndex: 50,
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
      zIndex: 49,
      background: "rgba(6,16,31,.64)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
      backdropFilter: "blur(16px)",
    },

    navbarInner: {
      maxWidth: "1280px",
      margin: "0 auto",
      minHeight: "88px",
      padding: "0 28px",
      display: "grid",
      gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto",
      alignItems: "center",
      gap: "18px",
    },

    navLogo: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: 900,
      letterSpacing: "-.04em",
      color: "#ffffff",
      flexShrink: 0,
    },

    navLinks: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
      justifyContent: "flex-end",
      gap: "12px",
      flexShrink: 0,
    },

    menuBtn: {
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.05)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "5px",
      cursor: "pointer",
      padding: 0,
    },

    menuLine: {
      width: "18px",
      height: "2px",
      borderRadius: "999px",
      background: "#fff",
      display: "block",
    },

    mobileMenu: {
      padding: "0 18px 16px",
      display: "grid",
      gap: "10px",
      background: "rgba(6,16,31,.94)",
      borderTop: "1px solid rgba(255,255,255,.04)",
    },

    mobileMenuLink: {
      minHeight: "44px",
      borderRadius: "14px",
      padding: "0 14px",
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
      color: "#ffffff",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.06)",
      fontWeight: 800,
    },

    supportBtn: {
      height: "46px",
      padding: isMobile ? "0 14px" : "0 18px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.16)",
      background: "rgba(255,255,255,.05)",
      color: "#ffffff",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
      whiteSpace: "nowrap",
    },

    callBtn: {
      height: "46px",
      padding: isMobile ? "0 16px" : "0 22px",
      borderRadius: "999px",
      border: "none",
      background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 48%, #818cf8 100%)",
      color: "#07111f",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: 900,
      boxShadow: "0 16px 34px rgba(56,189,248,.22)",
      whiteSpace: "nowrap",
    },

    heroSection: {
      position: "relative",
      zIndex: 2,
      minHeight: isMobile ? "700px" : "860px",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
    },

    heroBg: {
      position: "absolute",
      inset: 0,
      backgroundSize: "cover",
      backgroundPosition: "center",
      transition: "opacity 1s ease, transform 1s ease",
      zIndex: 0,
      willChange: "opacity, transform",
    },

    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg, rgba(4,8,18,.92) 0%, rgba(4,8,18,.78) 34%, rgba(4,8,18,.28) 72%, rgba(4,8,18,.14) 100%)",
      zIndex: 1,
    },

    heroInner: {
      position: "relative",
      zIndex: 2,
      maxWidth: "1280px",
      width: "100%",
      margin: "0 auto",
      padding: isMobile ? "60px 28px" : "80px 28px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.08fr 0.92fr",
      gap: isMobile ? "28px" : "36px",
      alignItems: "end",
    },

    heroLeft: {
      maxWidth: "640px",
    },

    heroRight: {
      display: "flex",
      justifyContent: isMobile ? "flex-start" : "center",
      alignItems: "flex-end",
      minHeight: isMobile ? "120px" : "240px",
    },

    heroRightCard: {
      width: "100%",
      maxWidth: "380px",
      borderRadius: "28px",
      padding: "16px",
      background: "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 40px rgba(0,0,0,.18)",
      backdropFilter: "blur(12px)",
    },

    heroCopyCard: {
      borderRadius: isMobile ? "24px" : "30px",
      padding: isMobile ? "18px 18px 20px" : "24px 26px 26px",
      background: "linear-gradient(180deg, rgba(7,17,31,.52), rgba(7,17,31,.18))",
      border: "1px solid rgba(255,255,255,.06)",
      boxShadow: "0 18px 40px rgba(0,0,0,.14)",
      backdropFilter: "blur(8px)",
    },

    heroKicker: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: ".24em",
      textTransform: "uppercase",
      marginBottom: "18px",
    },

    heroTitleWrap: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "8px" : "12px",
      marginBottom: "24px",
    },

    heroLine: {
      color: "#ffffff",
      fontSize: isMobile ? "42px" : "82px",
      fontWeight: 900,
      lineHeight: 1.02,
      letterSpacing: "-.05em",
      transition: "opacity .35s ease, transform .35s ease",
    },

    heroLineAccent: {
      color: "#7dd3fc",
      fontSize: isMobile ? "42px" : "82px",
      fontWeight: 900,
      lineHeight: 1.02,
      letterSpacing: "-.05em",
      textShadow: "0 0 24px rgba(56,189,248,.18)",
      transition: "opacity .35s ease, transform .35s ease",
    },

    heroLead: {
      margin: "8px 0 34px 0",
      color: "rgba(255,255,255,.82)",
      fontSize: isMobile ? "16px" : "19px",
      lineHeight: 1.68,
      maxWidth: "560px",
      transition: "opacity .4s ease, transform .4s ease",
    },

    heroCtas: {
      display: "flex",
      flexWrap: "wrap",
      gap: "14px",
      marginBottom: "24px",
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

    miniInfoRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "14px",
      maxWidth: "620px",
    },

    miniInfoCard: {
      borderRadius: "22px",
      padding: "18px 18px",
      background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 12px 30px rgba(0,0,0,.14)",
      backdropFilter: "blur(10px)",
    },

    miniInfoLabel: {
      color: "rgba(255,255,255,.68)",
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      marginBottom: "8px",
    },

    miniInfoValue: {
      color: "#ffffff",
      fontSize: "20px",
      fontWeight: 900,
    },

    heroStatGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "18px",
    },

    heroStatCard: {
      padding: "14px",
      borderRadius: "18px",
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.08)",
    },

    heroStatValue: {
      fontSize: "18px",
      fontWeight: 900,
      color: "#fff",
      marginBottom: "4px",
    },

    heroStatLabel: {
      color: "rgba(255,255,255,.66)",
      fontSize: "11px",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },

    heroDots: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },

    heroDot: {
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.22)",
      background: "rgba(255,255,255,.18)",
      cursor: "pointer",
      padding: 0,
    },

    heroDotActive: {
      width: "28px",
      height: "10px",
      borderRadius: "999px",
      border: "1px solid rgba(125,211,252,.34)",
      background: "linear-gradient(90deg, #38bdf8, #8b5cf6)",
      cursor: "pointer",
      padding: 0,
      boxShadow: "0 0 18px rgba(56,189,248,.20)",
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
      maxWidth: "640px",
    },

    sectionLead: {
      margin: "0 0 28px 0",
      color: "rgba(255,255,255,.72)",
      fontSize: "17px",
      lineHeight: 1.65,
      maxWidth: "640px",
    },

    planGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "20px",
    },

    planCard: {
      borderRadius: "28px",
      padding: "26px",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 46px rgba(0,0,0,.18)",
    },

    planCardFeatured: {
      borderRadius: "28px",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
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

    planStatsWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "16px",
    },

    planStatBox: {
      padding: "14px 12px",
      borderRadius: "18px",
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.06)",
    },

    planStatLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: ".08em",
      color: "rgba(255,255,255,.55)",
      marginBottom: "6px",
      fontWeight: 800,
    },

    planStatValue: {
      color: "#fff",
      fontSize: "14px",
      fontWeight: 800,
    },

    planFooter: {
      marginTop: "auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    },

    planPrice: {
      color: "#38bdf8",
      fontSize: "32px",
      fontWeight: 900,
      letterSpacing: "-.03em",
    },

    planActionBtn: {
      minWidth: "132px",
      height: "44px",
      padding: "0 16px",
      borderRadius: "999px",
      background: "linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)",
      color: "#fff",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: 900,
      boxShadow: "0 12px 24px rgba(56,189,248,.16)",
    },

    addonCard: {
      marginTop: "24px",
      borderRadius: "26px",
      padding: "24px 26px",
      background: "linear-gradient(180deg, rgba(45,212,191,.15), rgba(255,255,255,.04))",
      border: "1px solid rgba(45,212,191,.22)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    },

    addonTitle: {
      color: "#fff",
      fontSize: "20px",
      fontWeight: 900,
    },

    addonMeta: {
      color: "rgba(255,255,255,.72)",
      marginTop: "4px",
    },

    addonPrice: {
      color: "#99f6e4",
      fontSize: "28px",
      fontWeight: 900,
    },

    deviceGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
      gap: "20px",
    },

    infoCard: {
      borderRadius: "28px",
      padding: "24px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 46px rgba(0,0,0,.18)",
    },

    infoCardAccent: {
      borderRadius: "28px",
      padding: "24px",
      background: "linear-gradient(180deg, rgba(124,58,237,.24), rgba(255,255,255,.04))",
      border: "1px solid rgba(196,181,253,.20)",
      boxShadow: "0 18px 46px rgba(124,58,237,.14)",
    },

    infoTitle: {
      color: "#fff",
      fontSize: "22px",
      fontWeight: 900,
      marginTop: "12px",
      marginBottom: "10px",
    },

    infoLine: {
      color: "rgba(255,255,255,.74)",
      fontSize: "14px",
      lineHeight: 1.65,
      marginBottom: "6px",
    },

    contactCard: {
      borderRadius: "30px",
      padding: "28px",
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 46px rgba(0,0,0,.18)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "22px",
      flexWrap: "wrap",
    },

    contactLeft: {
      flex: "1 1 420px",
      minWidth: 0,
    },

    contactMetaGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "14px",
      marginTop: "16px",
    },

    contactMetaBox: {
      padding: "14px",
      borderRadius: "18px",
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.06)",
    },

    contactMetaLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: ".08em",
      color: "rgba(255,255,255,.55)",
      marginBottom: "6px",
      fontWeight: 800,
    },

    contactMetaValue: {
      color: "#fff",
      fontSize: "16px",
      fontWeight: 800,
      wordBreak: "break-word",
    },

    contactActions: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },

    secondaryButton: {
      minWidth: "170px",
      height: "56px",
      padding: "0 24px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,.14)",
      background: "rgba(255,255,255,.05)",
      color: "#ffffff",
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
      background: "rgba(3,8,18,.76)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backdropFilter: "blur(10px)",
    },

    loginModal: {
      width: "100%",
      maxWidth: "460px",
      borderRadius: "28px",
      overflow: "hidden",
      background: "linear-gradient(180deg, rgba(8,18,34,.98), rgba(9,22,40,.95))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 30px 80px rgba(0,0,0,.34)",
      padding: "0 24px 24px",
    },

    loginTopBar: {
      height: "5px",
      borderRadius: "0 0 18px 18px",
      background: "linear-gradient(90deg, #8b5cf6, #38bdf8, #2dd4bf)",
      marginBottom: "24px",
    },

    loginBrand: {
      color: "#7dd3fc",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: ".18em",
      textTransform: "uppercase",
      marginBottom: "8px",
    },

    loginTitle: {
      margin: 0,
      color: "#fff",
      fontSize: "32px",
      fontWeight: 900,
      letterSpacing: "-.04em",
    },

    loginSub: {
      color: "rgba(255,255,255,.64)",
      marginTop: "6px",
      marginBottom: "24px",
      fontSize: "14px",
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
      color: "rgba(255,255,255,.84)",
      fontSize: "13px",
      fontWeight: 800,
    },

    input: {
      width: "100%",
      height: "54px",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.05)",
      color: "#fff",
      padding: "0 16px",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },

    passwordWrap: {
      position: "relative",
    },

    passwordToggle: {
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.06)",
      color: "#fff",
      borderRadius: "10px",
      height: "36px",
      padding: "0 12px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 800,
    },

    err: {
      borderRadius: "14px",
      padding: "12px 14px",
      background: "rgba(239,68,68,.12)",
      border: "1px solid rgba(239,68,68,.24)",
      color: "#fecaca",
      fontSize: "13px",
      fontWeight: 700,
    },

    loginButton: {
      marginTop: "6px",
      height: "56px",
      border: "none",
      borderRadius: "16px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: "15px",
      letterSpacing: ".03em",
      color: "#04111f",
      background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 48%, #818cf8 100%)",
      boxShadow: "0 10px 24px rgba(56,189,248,.16)",
      transition: "all .16s ease",
    },

    loginButtonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
      filter: "saturate(.7)",
    },
  };
}

