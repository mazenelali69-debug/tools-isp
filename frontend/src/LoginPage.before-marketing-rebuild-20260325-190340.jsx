import { useEffect, useMemo, useState } from "react";

/* ================= DATA ================= */
const PLANS = [
  { name: "Plan 1", speed: "5 Mbps", cached: "Up to 20 Mbps Cached", daily: "8GB Daily", monthly: "500GB Monthly", price: "$25" },
  { name: "Plan 2", speed: "6 Mbps", cached: "Up to 30 Mbps Cached", daily: "12GB Daily", monthly: "600GB Monthly", price: "$35" },
  { name: "Plan 3", speed: "7 Mbps", cached: "Up to 40 Mbps Cached", daily: "15GB Daily", monthly: "700GB Monthly", price: "$45" },
  { name: "Plan 4", speed: "8 Mbps", cached: "Up to 50 Mbps Cached", daily: "20GB Daily", monthly: "800GB Monthly", price: "$65" },
  { name: "Plan 5", speed: "9 Mbps", cached: "Up to 60 Mbps Cached", daily: "30GB Daily", monthly: "900GB Monthly", price: "$75" },
  { name: "Plan 6", speed: "10 Mbps", cached: "Up to 100 Mbps Cached", daily: "40GB Daily", monthly: "1000GB Monthly", price: "$100", featured: true },
];

function RouterIcon() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="80">
      <rect x="10" y="30" width="100" height="30" rx="10" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)"/>
      <circle cx="40" cy="45" r="3" fill="#7dd3fc"/>
      <circle cx="50" cy="45" r="3" fill="#8b5cf6"/>
      <circle cx="60" cy="45" r="3" fill="#38bdf8"/>
      <path d="M70 20c8-10 22-10 30 0" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round"/>
      <path d="M74 26c5-6 14-6 19 0" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function CableIcon() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="80">
      <path d="M10 40 C40 10, 80 70, 110 40" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <rect x="8" y="34" width="10" height="12" rx="2" fill="#8b5cf6"/>
      <rect x="102" y="34" width="10" height="12" rx="2" fill="#7dd3fc"/>
    </svg>
  );
}

function CardShell({ children }) {
  return (
    <div style={{
      borderRadius: 26,
      padding: 24,
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
      border: "1px solid rgba(255,255,255,.10)",
      boxShadow: "0 18px 44px rgba(0,0,0,.16)",
      transition: "transform .18s ease, box-shadow .18s ease",
    }}>
      {children}
    </div>
  );
}

/* ================= PAGE ================= */
export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 920);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 920);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const styles = getStyles(isMobile);

  return (
    <div style={styles.page}>
      <div style={styles.bg}/>
      <div style={styles.grid}/>

      {/* ================= PLANS ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionKicker}>Internet Plans</div>

          <h2 style={styles.sectionTitle}>
            Plans that sell themselves.
          </h2>

          <p style={styles.sectionLead}>
            All prices, quotas, and cached speeds are visible directly — no hidden steps.
          </p>

          <div style={styles.planGrid}>
            {PLANS.map((p) => (
              <div
                key={p.name}
                style={p.featured ? styles.planCardFeatured : styles.planCard}
              >
                <div style={styles.planTop}>
                  <div style={styles.planName}>{p.name}</div>
                  {p.featured && <div style={styles.planBadge}>Best Value</div>}
                </div>

                <div style={styles.planSpeed}>{p.speed}</div>
                <div style={styles.planCached}>{p.cached}</div>
                <div style={styles.planStat}>{p.daily}</div>
                <div style={styles.planStat}>{p.monthly}</div>

                <div style={styles.planPrice}>{p.price}</div>
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
          <div style={styles.sectionKicker}>Devices & Cables</div>

          <h2 style={styles.sectionTitle}>
            Hardware ready for deployment.
          </h2>

          <div style={styles.deviceGrid}>
            <CardShell>
              <RouterIcon/>
              <div style={styles.infoTitle}>Tenda</div>
              <div style={styles.infoLine}>N300 4G — $20</div>
              <div style={styles.infoLine}>AC1200 4G & 5G — $25</div>
            </CardShell>

            <CardShell>
              <RouterIcon/>
              <div style={styles.infoTitle}>Netis</div>
              <div style={styles.infoLine}>N3 4G & 5G — $25</div>
            </CardShell>

            <CardShell>
              <RouterIcon/>
              <div style={styles.infoTitle}>V-Sol</div>
              <div style={styles.infoLine}>AC3000 4G / 5G / 6G — $40</div>
              <div style={styles.infoLine}>AC3200 4G / 5G / 6G / 7G — $100</div>
            </CardShell>

            <CardShell>
              <CableIcon/>
              <div style={styles.infoTitle}>Cables</div>
              <div style={styles.infoLine}>Cat 5E — $0.30 / m</div>
              <div style={styles.infoLine}>Cat 6E++ — $0.40 / m</div>
            </CardShell>
          </div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.contactCard}>
            <div>
              <div style={styles.sectionKicker}>Contact</div>
              <h2 style={styles.sectionTitle}>
                Talk to NoComment directly.
              </h2>
              <div style={styles.contactLine}>Phone: 70411518</div>
              <div style={styles.contactLine}>Location: Jabal Mohssen</div>
              <div style={styles.contactLine}>Network: NoComment</div>
            </div>

            <div style={styles.contactActions}>
              <a href="tel:70411518" style={styles.primaryBtn}>Call Now</a>
              <button style={styles.secondaryBtn}>Support Login</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= STYLES ================= */
function getStyles(isMobile) {
  return {
    page: {
      minHeight: "100vh",
      background: "#050d1c",
      color: "#fff",
      fontFamily: "Inter, sans-serif",
      position: "relative",
      overflowX: "hidden",
    },

    bg: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #06101f, #071425, #09192f)",
      zIndex: 0,
    },

    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      backgroundSize: "36px 36px",
      opacity: 0.2,
    },

    section: {
      padding: isMobile ? "60px 0" : "90px 0",
      position: "relative",
      zIndex: 2,
    },

    sectionAlt: {
      padding: isMobile ? "60px 0" : "90px 0",
      background: "rgba(255,255,255,.02)",
      borderTop: "1px solid rgba(255,255,255,.05)",
      borderBottom: "1px solid rgba(255,255,255,.05)",
      position: "relative",
      zIndex: 2,
    },

    sectionInner: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 28px",
    },

    sectionKicker: {
      color: "#7dd3fc",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: ".2em",
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: isMobile ? 34 : 56,
      fontWeight: 900,
      lineHeight: 1,
      letterSpacing: "-.04em",
      marginBottom: 16,

      background: "linear-gradient(90deg, #8B5CF6, #38BDF8)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    sectionLead: {
      color: "rgba(255,255,255,.7)",
      marginBottom: 28,
      maxWidth: 600,
    },

    planGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
      gap: 20,
    },

    planCard: {
      borderRadius: 24,
      padding: 24,
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.1)",
    },

    planCardFeatured: {
      borderRadius: 24,
      padding: 24,
      background: "linear-gradient(180deg, rgba(139,92,246,.3), rgba(255,255,255,.05))",
      border: "1px solid rgba(139,92,246,.3)",
    },

    planTop: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    planName: { fontWeight: 900 },

    planBadge: {
      fontSize: 11,
      padding: "4px 8px",
      background: "rgba(255,255,255,.1)",
      borderRadius: 10,
    },

    planSpeed: { fontSize: 32, fontWeight: 900 },
    planCached: { opacity: .7, marginBottom: 10 },
    planStat: { opacity: .7 },
    planPrice: { marginTop: 14, color: "#38bdf8", fontSize: 28, fontWeight: 900 },

    addon: {
      marginTop: 20,
      padding: 20,
      borderRadius: 20,
      background: "rgba(45,212,191,.1)",
      border: "1px solid rgba(45,212,191,.3)",
      display: "flex",
      justifyContent: "space-between",
    },

    addonTitle: { fontWeight: 900 },
    addonMeta: { opacity: .7 },
    addonPrice: { fontSize: 24, fontWeight: 900 },

    deviceGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)",
      gap: 20,
    },

    infoTitle: { fontSize: 20, fontWeight: 900, marginTop: 10 },
    infoLine: { opacity: .7 },

    contactCard: {
      padding: 30,
      borderRadius: 24,
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.1)",
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 20,
    },

    contactLine: { opacity: .7 },

    contactActions: {
      display: "flex",
      gap: 10,
    },

    primaryBtn: {
      background: "linear-gradient(90deg,#8b5cf6,#38bdf8)",
      border: "none",
      padding: "12px 20px",
      borderRadius: 999,
      color: "#fff",
      textDecoration: "none",
      fontWeight: 900,
    },

    secondaryBtn: {
      border: "1px solid rgba(255,255,255,.2)",
      background: "transparent",
      padding: "12px 20px",
      borderRadius: 999,
      color: "#fff",
      fontWeight: 900,
    },
  };
}
