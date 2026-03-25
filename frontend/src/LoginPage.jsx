import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const BRAND = {
  name: "NoComment",
  network: "NOCOMMENT NETWORK",
  phoneDisplay: "70411518",
  phoneIntl: "96170411518",
  facebook: "https://www.facebook.com/nocomment.lb/",
  whatsapp: "https://wa.me/96170411518",
  location:
    "https://www.google.com/search?sca_esv=5c685c3490d49ca4&sxsrf=ANbL-n42jIJIVD_C_u63mQueNeiKVKxulw:1774462014416&kgmid=/g/11v5_5rfkq&q=NoComment-ISP&shem=dlvs1&shndl=30&source=sh/x/loc/uni/m1/1&kgs=83c38a6d71611246&utm_source=dlvs1,sh/x/loc/uni/m1/1",
};

const HERO_SLIDES = [
  {
    eyebrow: "DIRECT ISP EXPERIENCE",
    titleA: "Fast setup.",
    titleB: "Clear plans.",
    titleC: "Direct support.",
    description:
      "Modern internet packages with quick communication, clean pricing, and direct contact when you need help.",
    primaryLabel: "View Plans",
    secondaryLabel: "Call Now",
  },
  {
    eyebrow: "HOME + BUSINESS READY",
    titleA: "Stable service.",
    titleB: "Real contact.",
    titleC: "No wasted time.",
    description:
      "Built for customers who want reliable installation, simple package choices, and support that answers fast.",
    primaryLabel: "See Coverage",
    secondaryLabel: "Support Login",
  },
  {
    eyebrow: "SMART NETWORK ACCESS",
    titleA: "Better signal.",
    titleB: "Better speed.",
    titleC: "Better support.",
    description:
      "A stronger digital front page for your network brand with premium visuals, better structure, and faster actions.",
    primaryLabel: "Explore Devices",
    secondaryLabel: "Contact Us",
  },
];

const PLANS = [
  {
    name: "Night 8",
    speed: "8 Mbps",
    cached: "Up to 30 Mbps cached",
    daily: "8 GB daily",
    monthly: "500 GB monthly",
    price: "$25",
    accent: "violet",
    badge: "Popular",
  },
  {
    name: "Night 12",
    speed: "12 Mbps",
    cached: "Up to 45 Mbps cached",
    daily: "12 GB daily",
    monthly: "700 GB monthly",
    price: "$35",
    accent: "blue",
    badge: "Balanced",
  },
  {
    name: "Night 20",
    speed: "20 Mbps",
    cached: "Up to 60 Mbps cached",
    daily: "18 GB daily",
    monthly: "950 GB monthly",
    price: "$50",
    accent: "cyan",
    badge: "Fast",
  },
  {
    name: "Night Max",
    speed: "30 Mbps",
    cached: "Up to 80 Mbps cached",
    daily: "25 GB daily",
    monthly: "1.4 TB monthly",
    price: "$70",
    accent: "violet",
    badge: "Pro",
  },
  {
    name: "Business Core",
    speed: "50 Mbps",
    cached: "Priority traffic",
    daily: "Unlimited usage",
    monthly: "Business policy",
    price: "$120",
    accent: "blue",
    badge: "Business",
  },
  {
    name: "Business Plus",
    speed: "100 Mbps",
    cached: "Priority + support",
    daily: "Unlimited usage",
    monthly: "Business policy",
    price: "$180",
    accent: "cyan",
    badge: "Premium",
  },
];

const DEVICES = [
  {
    name: "Dual Band CPE",
    desc: "Stable wireless coverage for apartments and homes.",
    tag: "Home Ready",
  },
  {
    name: "Outdoor Receiver",
    desc: "Cleaner long-distance signal for difficult areas.",
    tag: "Long Range",
  },
  {
    name: "Business Router",
    desc: "Better distribution and stronger control for offices.",
    tag: "Business",
  },
  {
    name: "Mesh Extension",
    desc: "Expand coverage inside large homes and multi-floor spaces.",
    tag: "Wide Coverage",
  },
];

const CONTACT_CARDS = [
  {
    title: "WhatsApp",
    value: BRAND.phoneDisplay,
    href: BRAND.whatsapp,
    hint: "Chat directly with support",
  },
  {
    title: "Facebook",
    value: "NoComment.lb",
    href: BRAND.facebook,
    hint: "Visit our official page",
  },
  {
    title: "Location",
    value: "Open on Google Maps",
    href: BRAND.location,
    hint: "See office / service location",
  },
];

function WifiIllustration() {
  return (
    <div style={styles.illustrationShell}>
      <div style={styles.illustrationGlowA} />
      <div style={styles.illustrationGlowB} />
      <div style={styles.illustrationGrid} />

      <div style={styles.routerCard}>
        <div style={styles.routerTopLine} />
        <div style={styles.routerBody}>
          <div style={styles.routerDot} />
          <div style={styles.routerDot} />
          <div style={styles.routerDot} />
        </div>
      </div>

      <div style={styles.wifiArcLarge} />
      <div style={styles.wifiArcMedium} />
      <div style={styles.wifiArcSmall} />

      <div style={styles.infoChipLeft}>
        <span style={styles.infoChipKicker}>Coverage</span>
        <strong>Optimized</strong>
      </div>

      <div style={styles.infoChipRight}>
        <span style={styles.infoChipKicker}>Support</span>
        <strong>Fast reply</strong>
      </div>

      <div style={styles.bottomInfoBar}>
        <div style={styles.bottomInfoItem}>
          <span style={styles.bottomInfoLabel}>Plans</span>
          <strong>6+</strong>
        </div>
        <div style={styles.bottomInfoItem}>
          <span style={styles.bottomInfoLabel}>Setup</span>
          <strong>Quick</strong>
        </div>
        <div style={styles.bottomInfoItem}>
          <span style={styles.bottomInfoLabel}>Status</span>
          <strong>Online</strong>
        </div>
      </div>
    </div>
  );
}

function PlanIcon() {
  return (
    <div style={styles.smallIconWrap}>
      <div style={styles.smallIconInner}>↗</div>
    </div>
  );
}

function DeviceIcon() {
  return (
    <div style={styles.smallIconWrap}>
      <div style={styles.smallIconInner}>◉</div>
    </div>
  );
}

function ContactIcon() {
  return (
    <div style={styles.smallIconWrap}>
      <div style={styles.smallIconInner}>✦</div>
    </div>
  );
}

function SocialRail() {
  return (
    <div style={styles.socialRail}>
      <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" style={styles.socialBtn} title="WhatsApp">
        <span style={styles.socialIcon}>W</span>
      </a>
      <a href={BRAND.facebook} target="_blank" rel="noreferrer" style={styles.socialBtn} title="Facebook">
        <span style={styles.socialIcon}>f</span>
      </a>
      <a href={BRAND.location} target="_blank" rel="noreferrer" style={styles.socialBtn} title="Location">
        <span style={styles.socialIcon}>⌖</span>
      </a>
    </div>
  );
}

export default function LoginPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 980);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#020817";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const slide = useMemo(() => HERO_SLIDES[activeSlide], [activeSlide]);

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePrimaryAction(label) {
    if (label.toLowerCase().includes("plan")) scrollToId("plans");
    else if (label.toLowerCase().includes("coverage")) scrollToId("contact");
    else if (label.toLowerCase().includes("device")) scrollToId("devices");
    else scrollToId("plans");
  }

  function handleSecondaryAction(label) {
    if (label.toLowerCase().includes("call")) {
      window.location.href = `tel:${BRAND.phoneDisplay}`;
      return;
    }
    if (label.toLowerCase().includes("login")) {
      setShowLogin(true);
      return;
    }
    scrollToId("contact");
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setLoginError("");

    window.setTimeout(() => {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        localStorage.setItem("nnc_logged_in", "true");
        window.location.href = "/";
      } else {
        setLoginError("Invalid username or password.");
      }
      setSubmitting(false);
    }, 700);
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgBase} />
      <div style={styles.bgOrbA} />
      <div style={styles.bgOrbB} />
      <div style={styles.bgLines} />

      <SocialRail />

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button style={styles.logoWrap} onClick={() => scrollToId("home")}>
            <span style={styles.logoText}>{BRAND.name}</span>
          </button>

          {!isMobile && (
            <nav style={styles.nav}>
              <button style={styles.navLink} onClick={() => scrollToId("home")}>Home</button>
              <button style={styles.navLink} onClick={() => scrollToId("plans")}>Plans</button>
              <button style={styles.navLink} onClick={() => scrollToId("devices")}>Devices</button>
              <button style={styles.navLink} onClick={() => scrollToId("contact")}>Contact</button>
            </nav>
          )}

          <div style={styles.headerActions}>
            <button style={styles.headerGhostBtn} onClick={() => setShowLogin(true)}>
              Support Login
            </button>
            <a href={`tel:${BRAND.phoneDisplay}`} style={styles.headerPrimaryBtn}>
              Call Now
            </a>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section id="home" style={styles.heroSection}>
          <div style={styles.heroGrid}>
            <div style={styles.heroCopy}>
              <div style={styles.eyebrow}>{slide.eyebrow}</div>

              <h1 style={styles.heroTitle}>
                <span>{slide.titleA}</span>
                <span>{slide.titleB}</span>
                <span style={styles.heroAccent}>{slide.titleC}</span>
              </h1>

              <p style={styles.heroDescription}>{slide.description}</p>

              <div style={styles.heroActions}>
                <button
                  style={styles.heroPrimary}
                  onClick={() => handlePrimaryAction(slide.primaryLabel)}
                >
                  {slide.primaryLabel}
                </button>

                <button
                  style={styles.heroSecondary}
                  onClick={() => handleSecondaryAction(slide.secondaryLabel)}
                >
                  {slide.secondaryLabel}
                </button>
              </div>

              <div style={styles.heroMetaGrid}>
                <div style={styles.metaCard}>
                  <span style={styles.metaLabel}>Coverage</span>
                  <strong style={styles.metaValue}>Jabal Mohssen</strong>
                </div>
                <div style={styles.metaCard}>
                  <span style={styles.metaLabel}>Support</span>
                  <strong style={styles.metaValue}>Direct contact</strong>
                </div>
                <div style={styles.metaCard}>
                  <span style={styles.metaLabel}>Network</span>
                  <strong style={styles.metaValue}>Modern setup</strong>
                </div>
              </div>

              <div style={styles.dotsRow}>
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    style={{
                      ...styles.dot,
                      ...(activeSlide === index ? styles.dotActive : {}),
                    }}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div style={styles.heroVisual}>
              <WifiIllustration />
            </div>
          </div>
        </section>

        <section id="plans" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionEyebrow}>Packages</div>
              <h2 style={styles.sectionTitle}>Plans that look cleaner and sell better.</h2>
            </div>
            <p style={styles.sectionText}>
              Better hierarchy, cleaner pricing blocks, stronger layout, and less visual mess.
            </p>
          </div>

          <div style={styles.cardsGrid}>
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                style={{
                  ...styles.planCard,
                  ...(plan.accent === "violet"
                    ? styles.planCardViolet
                    : plan.accent === "cyan"
                    ? styles.planCardCyan
                    : styles.planCardBlue),
                }}
              >
                <div style={styles.planTop}>
                  <div style={styles.planNameWrap}>
                    <span style={styles.planBadge}>{plan.badge}</span>
                    <h3 style={styles.planName}>{plan.name}</h3>
                  </div>
                  <PlanIcon />
                </div>

                <div style={styles.planPrice}>{plan.price}</div>
                <div style={styles.planSpeed}>{plan.speed}</div>

                <div style={styles.planList}>
                  <div style={styles.planListItem}><span>Cached</span><strong>{plan.cached}</strong></div>
                  <div style={styles.planListItem}><span>Daily</span><strong>{plan.daily}</strong></div>
                  <div style={styles.planListItem}><span>Monthly</span><strong>{plan.monthly}</strong></div>
                </div>

                <a href={`tel:${BRAND.phoneDisplay}`} style={styles.planBtn}>
                  Request Plan
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="devices" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionEyebrow}>Equipment</div>
              <h2 style={styles.sectionTitle}>Devices shown in a cleaner premium layout.</h2>
            </div>
            <p style={styles.sectionText}>
              Device cards rebuilt with less clutter, stronger spacing, and a better visual rhythm.
            </p>
          </div>

          <div style={styles.devicesGrid}>
            {DEVICES.map((device) => (
              <article key={device.name} style={styles.deviceCard}>
                <div style={styles.deviceHeader}>
                  <DeviceIcon />
                  <span style={styles.deviceTag}>{device.tag}</span>
                </div>
                <h3 style={styles.deviceName}>{device.name}</h3>
                <p style={styles.deviceDesc}>{device.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionEyebrow}>Reach Us</div>
              <h2 style={styles.sectionTitle}>Direct actions without the old annoying top bar.</h2>
            </div>
            <p style={styles.sectionText}>
              WhatsApp, Facebook, and Location are now proper direct actions, not random wasted space.
            </p>
          </div>

          <div style={styles.contactGrid}>
            {CONTACT_CARDS.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={styles.contactCard}
              >
                <div style={styles.contactCardTop}>
                  <ContactIcon />
                  <span style={styles.contactTitle}>{item.title}</span>
                </div>
                <strong style={styles.contactValue}>{item.value}</strong>
                <p style={styles.contactHint}>{item.hint}</p>
              </a>
            ))}
          </div>
        </section>
      </main>

      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTopBar} />
            <div style={styles.modalEyebrow}>{BRAND.network}</div>
            <h3 style={styles.modalTitle}>Support Login</h3>
            <p style={styles.modalText}>Authorized access only</p>

            <form style={styles.form} onSubmit={handleLoginSubmit}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />

              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrap}>
                <input
                  style={styles.inputPassword}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  style={styles.showBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {loginError ? <div style={styles.errorText}>{loginError}</div> : null}

              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Checking..." : "Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const glass = "rgba(15, 23, 42, 0.72)";
const line = "rgba(148, 163, 184, 0.16)";
const textMain = "#f8fafc";
const textSoft = "rgba(226, 232, 240, 0.8)";
const textMute = "rgba(148, 163, 184, 0.95)";
const gradientA = "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(96,165,250,0.95))";
const gradientB = "linear-gradient(135deg, rgba(34,211,238,0.95), rgba(96,165,250,0.95))";

const styles = {
  page: {
    minHeight: "100vh",
    color: textMain,
    background:
      "radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 30%), linear-gradient(180deg, #020617 0%, #020817 45%, #020617 100%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    position: "relative",
    overflow: "hidden",
  },

  bgBase: {
    position: "fixed",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.92), rgba(2,8,23,0.96))",
    pointerEvents: "none",
  },

  bgOrbA: {
    position: "fixed",
    top: "-120px",
    right: "-80px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(56,189,248,0.22), transparent 66%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgOrbB: {
    position: "fixed",
    left: "-120px",
    top: "220px",
    width: "380px",
    height: "380px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(168,85,247,0.16), transparent 70%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgLines: {
    position: "fixed",
    inset: 0,
    opacity: 0.08,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    pointerEvents: "none",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    backdropFilter: "blur(18px)",
    background: "rgba(2, 6, 23, 0.6)",
    borderBottom: `1px solid ${line}`,
  },

  headerInner: {
    width: "min(1240px, calc(100% - 32px))",
    minHeight: "82px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },

  logoWrap: {
    border: 0,
    background: "transparent",
    color: textMain,
    padding: 0,
    cursor: "pointer",
  },

  logoText: {
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "-0.06em",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  navLink: {
    border: 0,
    background: "transparent",
    color: textSoft,
    fontSize: "0.98rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "0.2s ease",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  headerGhostBtn: {
    border: `1px solid ${line}`,
    background: "rgba(15, 23, 42, 0.75)",
    color: textMain,
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  headerPrimaryBtn: {
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "14px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#08111f",
    background: gradientA,
    boxShadow: "0 12px 30px rgba(96, 165, 250, 0.24)",
  },

  main: {
    position: "relative",
    zIndex: 2,
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    paddingBottom: "80px",
  },

  heroSection: {
    padding: "44px 0 28px",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.02fr) minmax(420px, 0.98fr)",
    gap: "34px",
    alignItems: "center",
  },

  heroCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  eyebrow: {
    display: "inline-flex",
    width: "fit-content",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: 900,
    letterSpacing: "0.24em",
    color: "#7dd3fc",
    background: "rgba(15, 23, 42, 0.7)",
    border: `1px solid ${line}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },

  heroTitle: {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "clamp(3.6rem, 8vw, 6.2rem)",
    lineHeight: 0.9,
    fontWeight: 950,
    letterSpacing: "-0.08em",
    maxWidth: "680px",
  },

  heroAccent: {
    background: "linear-gradient(135deg, #7dd3fc, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroDescription: {
    margin: 0,
    maxWidth: "690px",
    color: textSoft,
    fontSize: "1.24rem",
    lineHeight: 1.7,
  },

  heroActions: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  heroPrimary: {
    minHeight: "58px",
    padding: "0 28px",
    border: 0,
    borderRadius: "18px",
    fontWeight: 900,
    fontSize: "1rem",
    color: "#08111f",
    background: gradientA,
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(168, 85, 247, 0.28)",
  },

  heroSecondary: {
    minHeight: "58px",
    padding: "0 28px",
    borderRadius: "18px",
    border: `1px solid ${line}`,
    background: "rgba(15, 23, 42, 0.72)",
    color: textMain,
    fontWeight: 900,
    fontSize: "1rem",
    cursor: "pointer",
  },

  heroMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "8px",
  },

  metaCard: {
    minHeight: "112px",
    borderRadius: "24px",
    padding: "18px 20px",
    background: glass,
    border: `1px solid ${line}`,
    boxShadow: "0 14px 40px rgba(2, 8, 23, 0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  metaLabel: {
    color: textMute,
    fontSize: "0.82rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },

  metaValue: {
    fontSize: "1.28rem",
    fontWeight: 900,
  },

  dotsRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "4px",
  },

  dot: {
    width: "34px",
    height: "8px",
    borderRadius: "999px",
    border: 0,
    background: "rgba(148, 163, 184, 0.26)",
    cursor: "pointer",
  },

  dotActive: {
    width: "48px",
    background: gradientA,
  },

  heroVisual: {
    minWidth: 0,
  },

  illustrationShell: {
    position: "relative",
    minHeight: "660px",
    borderRadius: "36px",
    border: `1px solid ${line}`,
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(8,15,32,0.84))",
    boxShadow:
      "0 32px 80px rgba(2, 8, 23, 0.38), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "hidden",
  },

  illustrationGlowA: {
    position: "absolute",
    top: "5%",
    right: "5%",
    width: "260px",
    height: "260px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(56,189,248,0.26), transparent 68%)",
    filter: "blur(12px)",
  },

  illustrationGlowB: {
    position: "absolute",
    left: "8%",
    bottom: "10%",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 68%)",
    filter: "blur(12px)",
  },

  illustrationGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "46px 46px",
  },

  routerCard: {
    position: "absolute",
    top: "18%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "270px",
    height: "150px",
    borderRadius: "28px",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92), rgba(15,23,42,0.85))",
    border: `1px solid rgba(148,163,184,0.18)`,
    boxShadow: "0 20px 60px rgba(2, 8, 23, 0.42)",
    overflow: "hidden",
  },

  routerTopLine: {
    width: "100%",
    height: "6px",
    background: gradientA,
  },

  routerBody: {
    height: "calc(100% - 6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },

  routerDot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#f8fafc",
    boxShadow: "0 0 18px rgba(255,255,255,0.32)",
  },

  wifiArcLarge: {
    position: "absolute",
    top: "39%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "260px",
    height: "130px",
    borderTopLeftRadius: "200px",
    borderTopRightRadius: "200px",
    border: "16px solid transparent",
    borderTopColor: "#7dd3fc",
    opacity: 0.95,
  },

  wifiArcMedium: {
    position: "absolute",
    top: "46%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "170px",
    height: "84px",
    borderTopLeftRadius: "160px",
    borderTopRightRadius: "160px",
    border: "14px solid transparent",
    borderTopColor: "#c084fc",
    opacity: 0.95,
  },

  wifiArcSmall: {
    position: "absolute",
    top: "53%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "86px",
    height: "42px",
    borderTopLeftRadius: "120px",
    borderTopRightRadius: "120px",
    border: "12px solid transparent",
    borderTopColor: "#ffffff",
    opacity: 0.95,
  },

  infoChipLeft: {
    position: "absolute",
    left: "5%",
    top: "48%",
    minWidth: "136px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.72)",
    border: `1px solid ${line}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 18px 40px rgba(2,8,23,0.26)",
  },

  infoChipRight: {
    position: "absolute",
    right: "5%",
    top: "42%",
    minWidth: "136px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.72)",
    border: `1px solid ${line}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 18px 40px rgba(2,8,23,0.26)",
  },

  infoChipKicker: {
    color: textMute,
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontWeight: 800,
  },

  bottomInfoBar: {
    position: "absolute",
    left: "5%",
    right: "5%",
    bottom: "5%",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  bottomInfoItem: {
    minHeight: "112px",
    borderRadius: "22px",
    background:
      "linear-gradient(180deg, rgba(30,41,59,0.72), rgba(15,23,42,0.82))",
    border: `1px solid ${line}`,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 18px 40px rgba(2,8,23,0.22)",
  },

  bottomInfoLabel: {
    color: textMute,
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontWeight: 800,
  },

  section: {
    padding: "56px 0 18px",
  },

  sectionHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  sectionEyebrow: {
    color: "#7dd3fc",
    fontWeight: 900,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontSize: "0.78rem",
    marginBottom: "10px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.05em",
    maxWidth: "760px",
  },

  sectionText: {
    margin: 0,
    maxWidth: "560px",
    color: textSoft,
    fontSize: "1.02rem",
    lineHeight: 1.75,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  planCard: {
    position: "relative",
    minHeight: "360px",
    borderRadius: "28px",
    padding: "22px",
    border: `1px solid ${line}`,
    background: glass,
    boxShadow: "0 20px 52px rgba(2,8,23,0.24)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "hidden",
  },

  planCardViolet: {
    background:
      "linear-gradient(180deg, rgba(29, 19, 57, 0.86), rgba(15, 23, 42, 0.9))",
  },

  planCardBlue: {
    background:
      "linear-gradient(180deg, rgba(16, 35, 58, 0.86), rgba(15, 23, 42, 0.9))",
  },

  planCardCyan: {
    background:
      "linear-gradient(180deg, rgba(9, 44, 56, 0.86), rgba(15, 23, 42, 0.9))",
  },

  planTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  planNameWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  planBadge: {
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: `1px solid ${line}`,
    color: "#cbd5e1",
    fontSize: "0.76rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  planName: {
    margin: 0,
    fontSize: "1.42rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  planPrice: {
    fontSize: "2.5rem",
    fontWeight: 950,
    letterSpacing: "-0.06em",
  },

  planSpeed: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "1.08rem",
  },

  planList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "4px",
  },

  planListItem: {
    minHeight: "58px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid rgba(255,255,255,0.06)`,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: textSoft,
    fontSize: "0.92rem",
  },

  planBtn: {
    marginTop: "auto",
    minHeight: "52px",
    borderRadius: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontWeight: 900,
    color: "#08111f",
    background: gradientB,
    boxShadow: "0 14px 34px rgba(56,189,248,0.24)",
  },

  devicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  deviceCard: {
    minHeight: "220px",
    borderRadius: "28px",
    padding: "22px",
    border: `1px solid ${line}`,
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(11,18,32,0.88))",
    boxShadow: "0 20px 52px rgba(2,8,23,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  deviceHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  deviceTag: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "0.74rem",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#cbd5e1",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${line}`,
  },

  deviceName: {
    margin: 0,
    fontSize: "1.36rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  deviceDesc: {
    margin: 0,
    color: textSoft,
    lineHeight: 1.75,
    fontSize: "1rem",
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  contactCard: {
    minHeight: "210px",
    borderRadius: "28px",
    padding: "22px",
    textDecoration: "none",
    color: textMain,
    border: `1px solid ${line}`,
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(9,16,29,0.9))",
    boxShadow: "0 20px 52px rgba(2,8,23,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  contactCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  contactTitle: {
    fontSize: "0.84rem",
    color: textMute,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    fontWeight: 900,
  },

  contactValue: {
    fontSize: "1.42rem",
    lineHeight: 1.2,
    letterSpacing: "-0.04em",
  },

  contactHint: {
    margin: 0,
    color: textSoft,
    lineHeight: 1.7,
  },

  smallIconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },

  smallIconInner: {
    fontSize: "1.1rem",
    fontWeight: 900,
    color: "#7dd3fc",
  },

  socialRail: {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: 60,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  socialBtn: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    color: textMain,
    background: "rgba(15,23,42,0.82)",
    border: `1px solid ${line}`,
    backdropFilter: "blur(14px)",
    boxShadow: "0 16px 34px rgba(2,8,23,0.32)",
  },

  socialIcon: {
    fontSize: "1.18rem",
    fontWeight: 900,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 90,
    background: "rgba(2, 6, 23, 0.6)",
    backdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    padding: "16px",
  },

  modalCard: {
    width: "min(100%, 470px)",
    borderRadius: "28px",
    padding: "22px",
    background:
      "linear-gradient(180deg, rgba(8,15,32,0.96), rgba(6,11,24,0.96))",
    border: `1px solid rgba(148,163,184,0.2)`,
    boxShadow: "0 30px 80px rgba(2,8,23,0.45)",
  },

  modalTopBar: {
    width: "100%",
    height: "4px",
    borderRadius: "999px",
    background: gradientA,
    marginBottom: "18px",
  },

  modalEyebrow: {
    color: "#7dd3fc",
    fontSize: "0.78rem",
    fontWeight: 900,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "3rem",
    lineHeight: 0.95,
    letterSpacing: "-0.07em",
  },

  modalText: {
    marginTop: "8px",
    marginBottom: "18px",
    color: textSoft,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "0.92rem",
    fontWeight: 800,
    color: "#e2e8f0",
    marginTop: "6px",
  },

  input: {
    minHeight: "52px",
    borderRadius: "18px",
    border: `1px solid rgba(59,130,246,0.22)`,
    padding: "0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.78)",
    color: textMain,
    fontSize: "1rem",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },

  passwordWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  inputPassword: {
    width: "100%",
    minHeight: "52px",
    borderRadius: "18px",
    border: `1px solid rgba(59,130,246,0.22)`,
    padding: "0 92px 0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.78)",
    color: textMain,
    fontSize: "1rem",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },

  showBtn: {
    position: "absolute",
    right: "8px",
    height: "38px",
    padding: "0 14px",
    borderRadius: "12px",
    border: `1px solid rgba(148,163,184,0.18)`,
    background: "rgba(255,255,255,0.06)",
    color: textMain,
    fontWeight: 800,
    cursor: "pointer",
  },

  errorText: {
    marginTop: "6px",
    color: "#fca5a5",
    fontWeight: 700,
    fontSize: "0.92rem",
  },

  submitBtn: {
    marginTop: "10px",
    minHeight: "54px",
    border: 0,
    borderRadius: "18px",
    background: gradientB,
    color: "#08111f",
    fontWeight: 900,
    fontSize: "1.02rem",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(96,165,250,0.26)",
  },
};

function applyResponsiveStyles() {
  if (typeof window === "undefined") return;
  const width = window.innerWidth;

  if (width < 1180) {
    styles.heroGrid.gridTemplateColumns = "1fr";
    styles.cardsGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.devicesGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.contactGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.heroMetaGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  } else {
    styles.heroGrid.gridTemplateColumns = "minmax(0, 1.02fr) minmax(420px, 0.98fr)";
    styles.cardsGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.devicesGrid.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
    styles.contactGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.heroMetaGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  }

  if (width < 760) {
    styles.headerInner.width = "min(100%, calc(100% - 20px))";
    styles.main.width = "min(100%, calc(100% - 20px))";
    styles.heroSection.padding = "26px 0 16px";
    styles.heroTitle.fontSize = "clamp(2.4rem, 12vw, 4rem)";
    styles.heroDescription.fontSize = "1rem";
    styles.heroMetaGrid.gridTemplateColumns = "1fr";
    styles.cardsGrid.gridTemplateColumns = "1fr";
    styles.devicesGrid.gridTemplateColumns = "1fr";
    styles.contactGrid.gridTemplateColumns = "1fr";
    styles.bottomInfoBar.gridTemplateColumns = "1fr";
    styles.illustrationShell.minHeight = "540px";
    styles.socialRail.right = "12px";
    styles.socialRail.bottom = "12px";
  }
}

applyResponsiveStyles();
window.addEventListener("resize", applyResponsiveStyles);
