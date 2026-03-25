import { useEffect, useMemo, useState } from "react";

/* ================= DATA ================= */
const PLANS = [
  { name: "Plan 1", speed: "5 Mbps", cached: "Up to 20 Mbps Cached", daily: "8GB Daily",  monthly: "500GB Monthly",  price: "$25"  },
  { name: "Plan 2", speed: "6 Mbps", cached: "Up to 30 Mbps Cached", daily: "12GB Daily", monthly: "600GB Monthly",  price: "$35"  },
  { name: "Plan 3", speed: "7 Mbps", cached: "Up to 40 Mbps Cached", daily: "15GB Daily", monthly: "700GB Monthly",  price: "$45"  },
  { name: "Plan 4", speed: "8 Mbps", cached: "Up to 50 Mbps Cached", daily: "20GB Daily", monthly: "800GB Monthly",  price: "$65"  },
  { name: "Plan 5", speed: "9 Mbps", cached: "Up to 60 Mbps Cached", daily: "30GB Daily", monthly: "900GB Monthly",  price: "$75"  },
  { name: "Plan 6", speed: "10 Mbps", cached: "Up to 100 Mbps Cached", daily: "40GB Daily", monthly: "1000GB Monthly", price: "$100", featured: true },
];

const DEVICES = [
  {
    title: "Tenda",
    lines: ["N300 4G — $20", "AC1200 4G & 5G — $25"],
    type: "router",
  },
  {
    title: "Netis",
    lines: ["N3 4G & 5G — $25"],
    type: "router",
  },
  {
    title: "V-Sol",
    lines: ["AC3000 4G / 5G / 6G — $40", "AC3200 4G / 5G / 6G / 7G — $100"],
    type: "router",
  },
  {
    title: "Cables",
    lines: ["Cat 5E — $0.30 / m", "Cat 6E++ — $0.40 / m"],
    type: "cable",
  },
];

const STATS = [
  { label: "Plans", value: "6+" },
  { label: "Coverage", value: "24/7" },
  { label: "Cached Speed", value: "100 Mbps" },
  { label: "Support", value: "Fast" },
];

/* ================= ICONS ================= */
function RouterIcon() {
  return (
    <svg viewBox="0 0 160 110" width="100%" height="100" aria-hidden="true">
      <defs>
        <linearGradient id="routerBody" x1="0" x2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="routerGlow" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      <path d="M120 20 C127 10, 142 10, 148 20" stroke="url(#routerGlow)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M126 30 C131 24, 139 24, 144 30" stroke="url(#routerGlow)" strokeWidth="3" strokeLinecap="round" fill="none" />

      <rect x="16" y="36" width="128" height="42" rx="14" fill="url(#routerBody)" stroke="rgba(255,255,255,0.18)" />
      <rect x="24" y="44" width="112" height="10" rx="5" fill="rgba(255,255,255,0.06)" />
      <rect x="28" y="62" width="20" height="4" rx="2" fill="rgba(255,255,255,0.10)" />
      <rect x="52" y="62" width="20" height="4" rx="2" fill="rgba(255,255,255,0.10)" />
      <rect x="76" y="62" width="20" height="4" rx="2" fill="rgba(255,255,255,0.10)" />
      <rect x="100" y="62" width="20" height="4" rx="2" fill="rgba(255,255,255,0.10)" />

      <circle cx="42" cy="49" r="3.2" fill="#22c55e" />
      <circle cx="54" cy="49" r="3.2" fill="#38bdf8" />
      <circle cx="66" cy="49" r="3.2" fill="#8b5cf6" />

      <rect x="30" y="82" width="100" height="4" rx="2" fill="rgba(56,189,248,0.35)" />
    </svg>
  );
}

function CableIcon() {
  return (
    <svg viewBox="0 0 160 110" width="100%" height="100" aria-hidden="true">
      <defs>
        <linearGradient id="cableLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>

      <path
        d="M15 68 C40 18, 74 18, 95 56 S130 94, 145 40"
        stroke="url(#cableLine)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      <rect x="8" y="60" width="14" height="16" rx="3" fill="#8b5cf6" />
      <rect x="138" y="32" width="14" height="16" rx="3" fill="#38bdf8" />

      <rect x="10" y="57" width="10" height="4" rx="1" fill="rgba(255,255,255,0.6)" />
      <rect x="140" y="29" width="10" height="4" rx="1" fill="rgba(255,255,255,0.6)" />

      <circle cx="66" cy="42" r="4" fill="rgba(56,189,248,0.85)" />
      <circle cx="92" cy="61" r="4" fill="rgba(139,92,246,0.85)" />
    </svg>
  );
}

/* ================= HELPERS ================= */
function useViewport() {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
  });

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function SectionHeader({ kicker, title, lead, styles }) {
  return (
    <div style={styles.sectionHead}>
      <div style={styles.sectionKicker}>{kicker}</div>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {lead ? <p style={styles.sectionLead}>{lead}</p> : null}
    </div>
  );
}

function CardShell({ children, styles, accent = false }) {
  return (
    <div
      style={{
        ...styles.cardShell,
        ...(accent ? styles.cardShellAccent : null),
      }}
    >
      {children}
    </div>
  );
}

/* ================= PAGE ================= */
export default function LoginPage() {
  const width = useViewport();
  const isMobile = width < 920;
  const isTablet = width >= 920 && width < 1200;

  const styles = useMemo(() => getStyles({ isMobile, isTablet }), [isMobile, isTablet]);

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.radialA} />
      <div style={styles.radialB} />
      <div style={styles.grid} />

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.sectionInner}>
          <div style={styles.heroWrap}>
            <div style={styles.heroCopy}>
              <div style={styles.heroKicker}>NOC-READY INTERNET LANDING</div>

              <h1 style={styles.heroTitle}>
                Plans that sell themselves.
              </h1>

              <p style={styles.heroLead}>
                Clean pricing, clear quotas, premium device options, and a sharper
                presentation for NoComment — all in one production-style page.
              </p>

              <div style={styles.heroActions}>
                <a href="tel:70411518" style={styles.primaryBtn}>
                  Call Now
                </a>

                <a href="#plans" style={styles.secondaryBtn}>
                  View Plans
                </a>
              </div>

              <div style={styles.statsGrid}>
                {STATS.map((item) => (
                  <div key={item.label} style={styles.statCard}>
                    <div style={styles.statValue}>{item.value}</div>
                    <div style={styles.statLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.heroVisual}>
              <div style={styles.heroPanel}>
                <div style={styles.heroPanelGlow} />
                <div style={styles.heroMachineTop}>
                  <RouterIcon />
                </div>

                <div style={styles.heroSignalRow}>
                  <div style={styles.signalPill}>Fiber Ready</div>
                  <div style={styles.signalPill}>4G / 5G</div>
                  <div style={styles.signalPill}>Fast Setup</div>
                </div>

                <div style={styles.heroLines}>
                  <div style={styles.heroLineA} />
                  <div style={styles.heroLineB} />
                  <div style={styles.heroLineC} />
                </div>

                <div style={styles.heroMiniGrid}>
                  <div style={styles.heroMiniCard}>
                    <div style={styles.heroMiniLabel}>Best Value</div>
                    <div style={styles.heroMiniValue}>Plan 6</div>
                  </div>
                  <div style={styles.heroMiniCard}>
                    <div style={styles.heroMiniLabel}>Open Speed</div>
                    <div style={styles.heroMiniValue}>1AM → 1PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PLANS ================= */}
      <section id="plans" style={styles.section}>
        <div style={styles.sectionInner}>
          <SectionHeader
            kicker="Internet Plans"
            title="Simple pricing. Stronger presentation."
            lead="All prices, quotas, and cached speeds are visible directly with no hidden steps."
            styles={styles}
          />

          <div style={styles.planGrid}>
            {PLANS.map((p) => (
              <div
                key={p.name}
                style={{
                  ...styles.planCard,
                  ...(p.featured ? styles.planCardFeatured : null),
                }}
              >
                <div style={styles.planTop}>
                  <div style={styles.planName}>{p.name}</div>
                  {p.featured ? <div style={styles.planBadge}>Best Value</div> : null}
                </div>

                <div style={styles.planSpeed}>{p.speed}</div>
                <div style={styles.planCached}>{p.cached}</div>

                <div style={styles.planStatsWrap}>
                  <div style={styles.planStatBox}>
                    <div style={styles.planStatLabel}>Daily</div>
                    <div style={styles.planStatValue}>{p.daily}</div>
                  </div>

                  <div style={styles.planStatBox}>
                    <div style={styles.planStatLabel}>Monthly</div>
                    <div style={styles.planStatValue}>{p.monthly}</div>
                  </div>
                </div>

                <div style={styles.planFooter}>
                  <div style={styles.planPrice}>{p.price}</div>
                  <a href="tel:70411518" style={styles.planBtn}>
                    Order Now
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.addon}>
            <div>
              <div style={styles.addonTitle}>Free Night + Open Speed</div>
              <div style={styles.addonMeta}>1AM → 1PM</div>
            </div>
            <div style={styles.addonPrice}>+ $5</div>
          </div>
        </div>
      </section>

      {/* ================= DEVICES ================= */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionInner}>
          <SectionHeader
            kicker="Devices & Cables"
            title="Hardware ready for deployment."
            lead="Routers and cabling presented in a cleaner, more premium product layout."
            styles={styles}
          />

          <div style={styles.deviceGrid}>
            {DEVICES.map((item, idx) => (
              <CardShell
                key={item.title}
                styles={styles}
                accent={idx === 2}
              >
                {item.type === "router" ? <RouterIcon /> : <CableIcon />}
                <div style={styles.infoTitle}>{item.title}</div>
                <div style={styles.infoList}>
                  {item.lines.map((line) => (
                    <div key={line} style={styles.infoLine}>{line}</div>
                  ))}
                </div>
              </CardShell>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.contactCard}>
            <div style={styles.contactLeft}>
              <div style={styles.sectionKicker}>Contact</div>
              <h2 style={styles.contactTitle}>Talk to NoComment directly.</h2>

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
              <a href="tel:70411518" style={styles.primaryBtn}>
                Call Now
              </a>

              <a href="#plans" style={styles.secondaryBtn}>
                Explore Plans
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= STYLES ================= */
function getStyles({ isMobile, isTablet }) {
  const sectionPad = isMobile ? "60px 0" : "92px 0";
  const heroTitleSize = isMobile ? 44 : isTablet ? 62 : 82;
  const sectionTitleSize = isMobile ? 34 : 54;
  const heroGrid = isMobile ? "1fr" : "1.08fr 0.92fr";
  const plansCols = isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
  const deviceCols = isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const heroPanelMinHeight = isMobile ? 360 : 500;

  return {
    page: {
      minHeight: "100vh",
      position: "relative",
      overflowX: "hidden",
      background: "#050b16",
      color: "#fff",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    bg: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #040816 0%, #07101d 35%, #091625 100%)",
      zIndex: 0,
    },

    radialA: {
      position: "absolute",
      top: -120,
      left: -80,
      width: 420,
      height: 420,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(139,92,246,0.20), transparent 68%)",
      filter: "blur(18px)",
      zIndex: 0,
      pointerEvents: "none",
    },

    radialB: {
      position: "absolute",
      right: -120,
      top: 180,
      width: 460,
      height: 460,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(56,189,248,0.16), transparent 68%)",
      filter: "blur(18px)",
      zIndex: 0,
      pointerEvents: "none",
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      backgroundSize: "38px 38px",
      opacity: 0.18,
      zIndex: 0,
      pointerEvents: "none",
    },

    sectionInner: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: isMobile ? "0 18px" : "0 28px",
      position: "relative",
      zIndex: 2,
    },

    hero: {
      padding: isMobile ? "72px 0 46px" : "96px 0 58px",
      position: "relative",
      zIndex: 2,
    },

    heroWrap: {
      display: "grid",
      gridTemplateColumns: heroGrid,
      gap: isMobile ? 28 : 34,
      alignItems: "center",
    },

    heroCopy: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
    },

    heroKicker: {
      color: "#7dd3fc",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: ".24em",
    },

    heroTitle: {
      margin: 0,
      fontSize: heroTitleSize,
      lineHeight: 0.95,
      fontWeight: 950,
      letterSpacing: "-0.05em",
      maxWidth: 700,
      background: "linear-gradient(90deg, #ffffff 0%, #c4b5fd 30%, #7dd3fc 62%, #2dd4bf 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    heroLead: {
      margin: 0,
      maxWidth: 650,
      color: "rgba(255,255,255,0.74)",
      fontSize: isMobile ? 15 : 17,
      lineHeight: 1.7,
    },

    heroActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 4,
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: 14,
      marginTop: 14,
    },

    statCard: {
      padding: "16px 16px",
      borderRadius: 20,
      background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      backdropFilter: "blur(10px)",
    },

    statValue: {
      fontSize: isMobile ? 22 : 26,
      fontWeight: 900,
      color: "#fff",
      lineHeight: 1,
      marginBottom: 6,
    },

    statLabel: {
      fontSize: 12,
      color: "rgba(255,255,255,0.68)",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      fontWeight: 700,
    },

    heroVisual: {
      minWidth: 0,
    },

    heroPanel: {
      position: "relative",
      minHeight: heroPanelMinHeight,
      borderRadius: 34,
      overflow: "hidden",
      padding: isMobile ? 20 : 28,
      background: "linear-gradient(180deg, rgba(10,18,31,0.92), rgba(10,18,31,0.72))",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
      backdropFilter: "blur(14px)",
    },

    heroPanelGlow: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.28), transparent 30%), radial-gradient(circle at 80% 30%, rgba(56,189,248,0.24), transparent 34%), radial-gradient(circle at 50% 100%, rgba(45,212,191,0.12), transparent 40%)",
      pointerEvents: "none",
    },

    heroMachineTop: {
      position: "relative",
      zIndex: 2,
      padding: "16px 16px 8px",
      borderRadius: 24,
      background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.09)",
      maxWidth: isMobile ? "100%" : 340,
    },

    heroSignalRow: {
      position: "relative",
      zIndex: 2,
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },

    signalPill: {
      padding: "10px 14px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.09)",
      color: "#dbeafe",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: ".04em",
    },

    heroLines: {
      position: "relative",
      zIndex: 1,
      height: isMobile ? 120 : 170,
      marginTop: 24,
      marginBottom: 20,
    },

    heroLineA: {
      position: "absolute",
      left: "4%",
      right: "18%",
      top: "18%",
      height: 4,
      borderRadius: 999,
      background: "linear-gradient(90deg, rgba(139,92,246,0.90), rgba(56,189,248,0.92), rgba(45,212,191,0.85))",
      boxShadow: "0 0 26px rgba(56,189,248,0.35)",
      transform: "rotate(-7deg)",
    },

    heroLineB: {
      position: "absolute",
      left: "16%",
      right: "10%",
      top: "48%",
      height: 4,
      borderRadius: 999,
      background: "linear-gradient(90deg, rgba(56,189,248,0.88), rgba(139,92,246,0.80))",
      boxShadow: "0 0 24px rgba(139,92,246,0.30)",
      transform: "rotate(6deg)",
    },

    heroLineC: {
      position: "absolute",
      left: "10%",
      right: "26%",
      bottom: "18%",
      height: 4,
      borderRadius: 999,
      background: "linear-gradient(90deg, rgba(45,212,191,0.82), rgba(56,189,248,0.90))",
      boxShadow: "0 0 22px rgba(45,212,191,0.25)",
      transform: "rotate(-4deg)",
    },

    heroMiniGrid: {
      position: "relative",
      zIndex: 2,
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 14,
      marginTop: 8,
    },

    heroMiniCard: {
      padding: "16px 16px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
    },

    heroMiniLabel: {
      color: "rgba(255,255,255,0.62)",
      fontSize: 12,
      marginBottom: 6,
      fontWeight: 700,
    },

    heroMiniValue: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: 900,
      color: "#fff",
    },

    section: {
      padding: sectionPad,
      position: "relative",
      zIndex: 2,
    },

    sectionAlt: {
      padding: sectionPad,
      position: "relative",
      zIndex: 2,
      background: "linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.012))",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      backdropFilter: "blur(8px)",
    },

    sectionHead: {
      marginBottom: 28,
      maxWidth: 760,
    },

    sectionKicker: {
      color: "#7dd3fc",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: ".22em",
      marginBottom: 12,
      textTransform: "uppercase",
    },

    sectionTitle: {
      margin: 0,
      fontSize: sectionTitleSize,
      lineHeight: 1,
      fontWeight: 950,
      letterSpacing: "-0.045em",
      background: "linear-gradient(90deg, #8B5CF6 0%, #38BDF8 55%, #2DD4BF 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    sectionLead: {
      margin: "14px 0 0",
      color: "rgba(255,255,255,0.72)",
      lineHeight: 1.7,
      maxWidth: 650,
      fontSize: isMobile ? 15 : 16,
    },

    planGrid: {
      display: "grid",
      gridTemplateColumns: plansCols,
      gap: 20,
      alignItems: "stretch",
    },

    planCard: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 320,
      borderRadius: 28,
      padding: 24,
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
      backdropFilter: "blur(12px)",
    },

    planCardFeatured: {
      background: "linear-gradient(180deg, rgba(139,92,246,0.24), rgba(56,189,248,0.12), rgba(255,255,255,0.04))",
      border: "1px solid rgba(139,92,246,0.40)",
      boxShadow: "0 18px 48px rgba(91,33,182,0.22)",
    },

    planTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      minHeight: 26,
    },

    planName: {
      fontWeight: 900,
      fontSize: 18,
      letterSpacing: "-0.02em",
    },

    planBadge: {
      fontSize: 11,
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      fontWeight: 900,
      whiteSpace: "nowrap",
      border: "1px solid rgba(255,255,255,0.10)",
    },

    planSpeed: {
      fontSize: isMobile ? 34 : 42,
      fontWeight: 950,
      color: "#fff",
      lineHeight: 1,
      letterSpacing: "-0.05em",
      marginTop: 4,
    },

    planCached: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 14,
      marginBottom: 4,
    },

    planStatsWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
      marginTop: 8,
    },

    planStatBox: {
      padding: "14px 12px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.06)",
    },

    planStatLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: ".1em",
      color: "rgba(255,255,255,0.55)",
      marginBottom: 6,
      fontWeight: 800,
    },

    planStatValue: {
      fontSize: 15,
      fontWeight: 800,
      color: "#fff",
    },

    planFooter: {
      marginTop: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },

    planPrice: {
      color: "#67e8f9",
      fontSize: 30,
      fontWeight: 950,
      lineHeight: 1,
    },

    planBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 42,
      padding: "10px 16px",
      borderRadius: 999,
      textDecoration: "none",
      fontWeight: 900,
      fontSize: 13,
      color: "#fff",
      background: "linear-gradient(90deg, #8b5cf6, #38bdf8)",
      boxShadow: "0 10px 24px rgba(56,189,248,0.24)",
    },

    addon: {
      marginTop: 22,
      padding: isMobile ? 18 : 22,
      borderRadius: 24,
      background: "linear-gradient(90deg, rgba(45,212,191,0.22), rgba(56,189,248,0.16))",
      border: "1px solid rgba(45,212,191,0.30)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      boxShadow: "0 14px 30px rgba(0,0,0,0.16)",
    },

    addonTitle: {
      fontWeight: 950,
      fontSize: isMobile ? 18 : 20,
      color: "#fff",
    },

    addonMeta: {
      color: "rgba(255,255,255,0.72)",
      marginTop: 4,
      fontWeight: 600,
    },

    addonPrice: {
      fontSize: isMobile ? 24 : 28,
      fontWeight: 950,
      color: "#99f6e4",
      lineHeight: 1,
    },

    deviceGrid: {
      display: "grid",
      gridTemplateColumns: deviceCols,
      gap: 20,
    },

    cardShell: {
      borderRadius: 28,
      padding: 24,
      minHeight: 240,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
      backdropFilter: "blur(12px)",
    },

    cardShellAccent: {
      background: "linear-gradient(180deg, rgba(139,92,246,0.18), rgba(255,255,255,0.03))",
      border: "1px solid rgba(139,92,246,0.24)",
    },

    infoTitle: {
      fontSize: 21,
      fontWeight: 950,
      marginTop: 14,
      marginBottom: 10,
      letterSpacing: "-0.02em",
    },

    infoList: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },

    infoLine: {
      color: "rgba(255,255,255,0.74)",
      lineHeight: 1.6,
      fontSize: 14,
    },

    contactCard: {
      padding: isMobile ? 22 : 30,
      borderRadius: 30,
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 22,
      boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
      backdropFilter: "blur(12px)",
    },

    contactLeft: {
      minWidth: 0,
      flex: "1 1 460px",
    },

    contactTitle: {
      margin: 0,
      fontSize: isMobile ? 34 : 52,
      lineHeight: 1,
      fontWeight: 950,
      letterSpacing: "-0.04em",
      background: "linear-gradient(90deg, #ffffff, #c4b5fd, #7dd3fc)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    contactMetaGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: 14,
      marginTop: 18,
    },

    contactMetaBox: {
      padding: "14px 14px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.06)",
    },

    contactMetaLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: ".1em",
      color: "rgba(255,255,255,0.55)",
      marginBottom: 6,
      fontWeight: 800,
    },

    contactMetaValue: {
      fontSize: 16,
      fontWeight: 900,
      color: "#fff",
      wordBreak: "break-word",
    },

    contactActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
      justifyContent: isMobile ? "flex-start" : "flex-end",
      flex: "0 0 auto",
    },

    primaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      padding: "12px 22px",
      borderRadius: 999,
      color: "#fff",
      textDecoration: "none",
      fontWeight: 900,
      border: "none",
      background: "linear-gradient(90deg,#8b5cf6,#38bdf8)",
      boxShadow: "0 12px 28px rgba(56,189,248,0.24)",
      letterSpacing: ".01em",
    },

    secondaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      padding: "12px 22px",
      borderRadius: 999,
      color: "#fff",
      textDecoration: "none",
      fontWeight: 900,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(10px)",
      letterSpacing: ".01em",
    },
  };
}
