import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const BRAND = {
  name: "NoComment",
  network: "NOCOMMENT NETWORK",
  phoneDisplay: "70411518",
  phoneIntl: "96170411518",
  whatsapp: "https://wa.me/96170411518",
  facebook: "https://www.facebook.com/nocomment.lb/",
  location:
    "https://www.google.com/search?sca_esv=5c685c3490d49ca4&sxsrf=ANbL-n42jIJIVD_C_u63mQueNeiKVKxulw:1774462014416&kgmid=/g/11v5_5rfkq&q=NoComment-ISP&shem=dlvs1&shndl=30&source=sh/x/loc/uni/m1/1&kgs=83c38a6d71611246&utm_source=dlvs1,sh/x/loc/uni/m1/1",
};

const HERO_SLIDES = [
  {
    kicker: "PREMIUM ISP EXPERIENCE",
    line1: "Fast internet.",
    line2: "Clean pricing.",
    line3: "Direct support.",
    desc:
      "A complete customer-facing landing experience rebuilt to feel modern, trustworthy, and conversion-ready from the first second.",
    primary: "View Plans",
    secondary: "Support Login",
  },
  {
    kicker: "HOME + BUSINESS READY",
    line1: "Better coverage.",
    line2: "Better devices.",
    line3: "Better control.",
    desc:
      "Packages, devices, direct actions, and support are now structured in a sharper system that feels like a real provider, not a noisy page.",
    primary: "See Devices",
    secondary: "Call Now",
  },
  {
    kicker: "NO WASTED SPACE",
    line1: "No ugly bars.",
    line2: "No messy blocks.",
    line3: "Just premium UI.",
    desc:
      "The page is rebuilt with stronger hierarchy, better rhythm, cleaner spacing, and a visual style designed to keep visitors engaged.",
    primary: "Open Contact",
    secondary: "Support Login",
  },
];

const PLANS = [
  {
    name: "Night 8",
    price: "$25",
    speed: "8 Mbps",
    cached: "Up to 30 Mbps cached",
    daily: "8 GB daily",
    monthly: "500 GB monthly",
    badge: "Popular",
    featured: false,
  },
  {
    name: "Night 12",
    price: "$35",
    speed: "12 Mbps",
    cached: "Up to 45 Mbps cached",
    daily: "12 GB daily",
    monthly: "700 GB monthly",
    badge: "Recommended",
    featured: true,
  },
  {
    name: "Night 20",
    price: "$50",
    speed: "20 Mbps",
    cached: "Up to 60 Mbps cached",
    daily: "18 GB daily",
    monthly: "950 GB monthly",
    badge: "Fast",
    featured: false,
  },
  {
    name: "Night Max",
    price: "$70",
    speed: "30 Mbps",
    cached: "Up to 80 Mbps cached",
    daily: "25 GB daily",
    monthly: "1.4 TB monthly",
    badge: "Pro",
    featured: false,
  },
  {
    name: "Business Core",
    price: "$120",
    speed: "50 Mbps",
    cached: "Priority traffic",
    daily: "Unlimited usage",
    monthly: "Business policy",
    badge: "Business",
    featured: false,
  },
  {
    name: "Business Plus",
    price: "$180",
    speed: "100 Mbps",
    cached: "Priority + support",
    daily: "Unlimited usage",
    monthly: "Business policy",
    badge: "Premium",
    featured: false,
  },
];

const DEVICES = [
  {
    name: "ISP Modem",
    type: "Modem",
    tag: "Essential",
    price: "$25",
    desc: "Clean modem handoff for stable WAN delivery and simple customer setup.",
    features: ["Stable Sync", "WAN Ready", "Easy Setup"],
  },
  {
    name: "Wi-Fi Router",
    type: "Router",
    tag: "Popular",
    price: "$30",
    desc: "Better indoor wireless distribution for homes, apartments, and daily use.",
    features: ["Better Range", "Multi Device", "Home Use"],
  },
  {
    name: "Outdoor Receiver",
    type: "Receiver",
    tag: "Long Range",
    price: "$45",
    desc: "Stronger signal capture for difficult streets, rooftops, and longer wireless paths.",
    features: ["Outdoor", "Long Reach", "Better Capture"],
  },
  {
    name: "Mesh Extension",
    type: "Extension",
    tag: "Wide Coverage",
    price: "$40",
    desc: "Expand coverage for larger homes and multi-floor customer spaces.",
    features: ["Mesh", "Multi Floor", "Coverage Boost"],
  },
  {
    name: "Dual Band CPE",
    type: "Receiver",
    tag: "Home Ready",
    price: "$35",
    desc: "Stable dual-band customer device for everyday residential connections.",
    features: ["2.4G + 5G", "Stable Link", "Clean Install"],
  },
  {
    name: "Business Router",
    type: "Router",
    tag: "Business",
    price: "$60",
    desc: "More reliable traffic distribution and better control for office environments.",
    features: ["Office Ready", "Reliable", "Better Control"],
  },
];

const BENEFITS = [
  {
    title: "Fast support access",
    text: "Support Login, WhatsApp, phone, and social actions are always visible and easy to reach.",
  },
  {
    title: "Clean package clarity",
    text: "Plans are shown with stronger pricing hierarchy so customers understand options faster.",
  },
  {
    title: "Customer-ready devices",
    text: "Modem, router, receiver, and extension offers are displayed as proper sellable product cards.",
  },
  {
    title: "Premium first impression",
    text: "The full page is rebuilt to look more serious, modern, and aligned with a real ISP brand.",
  },
];

const ACTIONS = [
  {
    name: "WhatsApp",
    value: "Chat directly now",
    hint: "Open direct WhatsApp support",
    href: BRAND.whatsapp,
    kind: "whatsapp",
  },
  {
    name: "Facebook",
    value: "Visit our page",
    hint: "See updates and official page info",
    href: BRAND.facebook,
    kind: "facebook",
  },
  {
    name: "Location",
    value: "Open Google Maps",
    hint: "Open our location directly",
    href: BRAND.location,
    kind: "location",
  },
];

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M27.2 15.2C27.2 21.5 22 26.6 15.7 26.6C13.6 26.6 11.7 26 10 24.9L5.2 26.2L6.5 21.6C5.2 19.7 4.5 17.5 4.5 15.2C4.5 8.9 9.6 3.8 15.9 3.8C22.1 3.8 27.2 8.9 27.2 15.2Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.7 10.7C12.1 10.2 12.5 10.1 12.9 10.1C13.2 10.1 13.5 10.1 13.8 10.8C14.1 11.4 14.8 13 14.9 13.2C15 13.4 15.1 13.7 14.9 14C14.7 14.3 14.6 14.5 14.4 14.7C14.2 14.9 14 15.1 13.8 15.3C13.6 15.5 13.4 15.7 13.6 16C13.8 16.4 14.5 17.6 15.6 18.6C17 19.8 18.1 20.2 18.6 20.4C18.9 20.5 19.1 20.5 19.3 20.3C19.6 20 19.9 19.6 20.2 19.2C20.4 18.9 20.7 18.8 21 18.9C21.4 19.1 23.2 20 23.5 20.1C23.9 20.3 24.1 20.4 24.2 20.7C24.3 21 24.3 22.1 23.5 22.9C22.8 23.6 21.7 24 20.5 23.8C19.3 23.6 17.7 23.1 15.9 21.9C14 20.7 12.8 19.2 11.8 17.7C10.7 16 10.1 14.2 10.1 12.9C10.1 12.1 10.5 11.3 11.1 10.8L11.7 10.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M18.7 27V17.1H21.9L22.4 13.4H18.7V11C18.7 9.9 19 9.2 20.6 9.2H22.5V5.9C22.2 5.8 21.1 5.7 19.8 5.7C17 5.7 15.1 7.4 15.1 10.5V13.4H12V17.1H15.1V27H18.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LocationIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 27.2C16 27.2 24 20.1 24 13.6C24 9.2 20.4 5.7 16 5.7C11.6 5.7 8 9.2 8 13.6C8 20.1 16 27.2 16 27.2Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="13.6" r="2.8" fill="currentColor" />
    </svg>
  );
}

function SmallArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15L15 5M15 5H7.5M15 5V12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L11.6 6.1L16 7.7L11.6 9.3L10 13.4L8.4 9.3L4 7.7L8.4 6.1L10 2Z" fill="currentColor" />
    </svg>
  );
}

function ActionIcon({ kind }) {
  if (kind === "whatsapp") return <WhatsAppIcon size={18} />;
  if (kind === "facebook") return <FacebookIcon size={18} />;
  return <LocationIcon size={18} />;
}

function SocialDock() {
  return (
    <div style={styles.socialDock}>
      <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" style={styles.socialDockBtn} title="WhatsApp">
        <WhatsAppIcon size={18} />
      </a>
      <a href={BRAND.facebook} target="_blank" rel="noreferrer" style={styles.socialDockBtn} title="Facebook">
        <FacebookIcon size={18} />
      </a>
      <a href={BRAND.location} target="_blank" rel="noreferrer" style={styles.socialDockBtn} title="Location">
        <LocationIcon size={18} />
      </a>
    </div>
  );
}

function MotionStyles() {
  return (
    <style>{`
      @keyframes ncScanRotate {
        0% { transform: translate(-50%, -50%) rotate(0deg); opacity: .18; }
        50% { opacity: .42; }
        100% { transform: translate(-50%, -50%) rotate(360deg); opacity: .18; }
      }

      @keyframes ncWifiWaveA {
        0% { transform: translateX(-50%) translateY(0px); opacity: .72; }
        50% { transform: translateX(-50%) translateY(-7px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .72; }
      }

      @keyframes ncWifiWaveB {
        0% { transform: translateX(-50%) translateY(0px); opacity: .62; }
        50% { transform: translateX(-50%) translateY(-10px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .62; }
      }

      @keyframes ncWifiWaveC {
        0% { transform: translateX(-50%) translateY(0px); opacity: .78; }
        50% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .78; }
      }

      @keyframes ncDotBlink {
        0% { opacity: .55; box-shadow: 0 0 0 rgba(34,197,94,0); }
        50% { opacity: 1; box-shadow: 0 0 18px rgba(34,197,94,.75); }
        100% { opacity: .55; box-shadow: 0 0 0 rgba(34,197,94,0); }
      }

      .nc-scan-sweep {
        animation: ncScanRotate 5.8s linear infinite;
      }

      .nc-wifi-1 {
        animation: ncWifiWaveA 3.6s ease-in-out infinite;
      }

      .nc-wifi-2 {
        animation: ncWifiWaveB 4.1s ease-in-out infinite;
      }

      .nc-wifi-3 {
        animation: ncWifiWaveC 2.9s ease-in-out infinite;
      }

      .nc-status-dot {
        animation: ncDotBlink 2.2s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .nc-scan-sweep,
        .nc-wifi-1,
        .nc-wifi-2,
        .nc-wifi-3,
        .nc-status-dot {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function HeroVisual() {
  return (
    <div style={styles.visualWrap}>
      <div style={styles.visualGlowA} />
      <div style={styles.visualGlowB} />
      <div style={styles.visualGrid} />

      <div style={styles.visualTopRow}>
        <div style={styles.visualChip}>FINAL BUILD</div>
        <div style={styles.visualStatus}>
          <span className="nc-status-dot" style={styles.visualStatusDot} />
          Online
        </div>
      </div>

      <div style={styles.visualWifiZone}>
        <div className="nc-wifi-1" style={styles.visualArc1} />
        <div className="nc-wifi-2" style={styles.visualArc2} />
        <div className="nc-wifi-3" style={styles.visualArc3} />
      </div>

      <div style={styles.visualCoreShell}>
        <div style={styles.visualRingOuter}>
          <div style={styles.visualRingMid}>
            <div style={styles.visualRingInner}>
              <div className="nc-scan-sweep" style={styles.visualScanSweep} />
              <div style={styles.visualCenterCore}>
                <span style={styles.visualCoreText}>ISP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.visualFloatLeft}>
        <span style={styles.visualFloatKicker}>Support</span>
        <strong style={styles.visualFloatValue}>Direct reply</strong>
      </div>

      <div style={styles.visualFloatRight}>
        <span style={styles.visualFloatKicker}>Devices</span>
        <strong style={styles.visualFloatValue}>Modem + Router</strong>
      </div>

      <div style={styles.visualBottomGrid}>
        <div style={styles.visualMiniCard}>
          <span style={styles.visualMiniLabel}>Packages</span>
          <strong style={styles.visualMiniValue}>6 Plans</strong>
        </div>
        <div style={styles.visualMiniCard}>
          <span style={styles.visualMiniLabel}>Hardware</span>
          <strong style={styles.visualMiniValue}>LV3 Ready</strong>
        </div>
        <div style={styles.visualMiniCard}>
          <span style={styles.visualMiniLabel}>Actions</span>
          <strong style={styles.visualMiniValue}>Instant</strong>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#020617";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const slide = useMemo(() => HERO_SLIDES[activeSlide], [activeSlide]);

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  function handlePrimary(label) {
    const l = label.toLowerCase();
    if (l.includes("plan")) return scrollToId("plans");
    if (l.includes("device")) return scrollToId("devices");
    if (l.includes("contact")) return scrollToId("contact");
    scrollToId("plans");
  }

  function handleSecondary(label) {
    const l = label.toLowerCase();
    if (l.includes("login")) {
      setShowLogin(true);
      return;
    }
    if (l.includes("call")) {
      window.location.href = `tel:${BRAND.phoneDisplay}`;
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
        sessionStorage.setItem("noc_token", "ok");
        sessionStorage.setItem("noc_user", username.trim());
        setLoginError("");
        setSubmitting(false);

        if (typeof onLogin === "function") {
          onLogin({ username: username.trim() });
        } else {
          window.location.href = "/";
        }
      } else {
        setLoginError("Invalid username or password.");
        setSubmitting(false);
      }
    }, 650);
  }

  return (
    <div style={styles.page}>
      <MotionStyles />
      
      <div style={styles.bgBase} />
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGrid} />
      <div style={styles.bgVignette} />

      <SocialDock />

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button style={styles.brandBtn} onClick={() => scrollToId("home")}>
            <span style={styles.brandText}>{BRAND.name}</span>
          </button>

          {!isMobile ? (
            <nav style={styles.nav}>
              <button style={styles.navLink} onClick={() => scrollToId("home")}>Home</button>
              <button style={styles.navLink} onClick={() => scrollToId("plans")}>Plans</button>
              <button style={styles.navLink} onClick={() => scrollToId("devices")}>Devices</button>
              <button style={styles.navLink} onClick={() => scrollToId("whyus")}>Why Us</button>
              <button style={styles.navLink} onClick={() => scrollToId("contact")}>Contact</button>
            </nav>
          ) : (
            <button style={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
              <span style={styles.menuBar} />
              <span style={styles.menuBar} />
              <span style={styles.menuBar} />
            </button>
          )}

          {!isMobile && (
            <div style={styles.headerActions}>
              <button style={styles.headerGhostBtn} onClick={() => setShowLogin(true)}>
                Support Login
              </button>
              <a href={`tel:${BRAND.phoneDisplay}`} style={styles.headerMainBtn}>
                Call Now
              </a>
            </div>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={styles.mobileMenu}>
            <button style={styles.mobileLink} onClick={() => scrollToId("home")}>Home</button>
            <button style={styles.mobileLink} onClick={() => scrollToId("plans")}>Plans</button>
            <button style={styles.mobileLink} onClick={() => scrollToId("devices")}>Devices</button>
            <button style={styles.mobileLink} onClick={() => scrollToId("whyus")}>Why Us</button>
            <button style={styles.mobileLink} onClick={() => scrollToId("contact")}>Contact</button>
            <button style={styles.mobilePrimary} onClick={() => { setMenuOpen(false); setShowLogin(true); }}>
              Support Login
            </button>
            <a href={`tel:${BRAND.phoneDisplay}`} style={styles.mobileSecondary}>Call Now</a>
          </div>
        )}
      </header>

      <main style={styles.main}>
        <section id="home" style={styles.heroSection}>
          <div style={styles.heroGrid}>
            <div style={styles.heroLeft}>
              <div style={styles.heroKicker}>{slide.kicker}</div>

              <h1 style={styles.heroTitle}>
                <span>{slide.line1}</span>
                <span>{slide.line2}</span>
                <span style={styles.heroAccent}>{slide.line3}</span>
              </h1>

              <p style={styles.heroText}>{slide.desc}</p>

              <div style={styles.heroButtons}>
                <button style={styles.heroMainBtn} onClick={() => handlePrimary(slide.primary)}>
                  {slide.primary}
                </button>
                <button style={styles.heroAltBtn} onClick={() => handleSecondary(slide.secondary)}>
                  {slide.secondary}
                </button>
              </div>

              <div style={styles.quickStats}>
                <div style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Coverage</span>
                  <strong style={styles.quickStatValue}>Jabal Mohssen</strong>
                </div>
                <div style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Customer Flow</span>
                  <strong style={styles.quickStatValue}>Cleaner UX</strong>
                </div>
                <div style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Support</span>
                  <strong style={styles.quickStatValue}>Direct access</strong>
                </div>
              </div>

              <div style={styles.sliderDots}>
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    style={{
                      ...styles.sliderDot,
                      ...(index === activeSlide ? styles.sliderDotActive : {}),
                    }}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div style={styles.heroRight}>
              <HeroVisual />
            </div>
          </div>
        </section>

        <section id="plans" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Packages</div>
              <h2 style={styles.sectionTitle}>Plans rebuilt to feel premium, clear, and easy to choose.</h2>
            </div>
            <p style={styles.sectionText}>
              Better hierarchy, stronger pricing focus, cleaner benefits layout, and a highlighted plan for faster decision-making.
            </p>
          </div>

          <div style={styles.planGrid}>
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                style={{
                  ...styles.planCard,
                  ...(plan.featured ? styles.planCardFeatured : {}),
                }}
              >
                <div style={styles.planHeader}>
                  <div style={styles.planBadge}>{plan.badge}</div>
                  <div style={styles.planArrowWrap}>
                    <SmallArrowIcon />
                  </div>
                </div>

                <h3 style={styles.planName}>{plan.name}</h3>
                <div style={styles.planPrice}>{plan.price}</div>
                <div style={styles.planSpeed}>{plan.speed}</div>

                <div style={styles.planSpecs}>
                  <div style={styles.planSpecRow}>
                    <span>Cached</span>
                    <strong>{plan.cached}</strong>
                  </div>
                  <div style={styles.planSpecRow}>
                    <span>Daily</span>
                    <strong>{plan.daily}</strong>
                  </div>
                  <div style={styles.planSpecRow}>
                    <span>Monthly</span>
                    <strong>{plan.monthly}</strong>
                  </div>
                </div>

                <a href={`tel:${BRAND.phoneDisplay}`} style={styles.planAction}>
                  Request Plan
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="devices" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Devices</div>
              <h2 style={styles.sectionTitle}>Modem, router, and hardware offers shown as real customer-facing product cards.</h2>
            </div>
            <p style={styles.sectionText}>
              This section is upgraded to sell better: cleaner structure, visible pricing, clear tags, and stronger product hierarchy.
            </p>
          </div>

          <div style={styles.deviceGrid}>
            {DEVICES.map((device) => (
              <article key={device.name} style={styles.deviceCard}>
                <div style={styles.deviceTop}>
                  <div style={styles.deviceIconBox}>
                    <SparkIcon />
                  </div>
                  <span style={styles.deviceTag}>{device.tag}</span>
                </div>

                <div style={styles.deviceType}>{device.type}</div>
                <h3 style={styles.deviceName}>{device.name}</h3>
                <p style={styles.deviceDesc}>{device.desc}</p>

                <div style={styles.featureChips}>
                  {device.features.map((feature) => (
                    <span key={feature} style={styles.featureChip}>{feature}</span>
                  ))}
                </div>

                <div style={styles.deviceBottom}>
                  <div style={styles.devicePrice}>{device.price}</div>
                  <a href={`tel:${BRAND.phoneDisplay}`} style={styles.deviceAction}>
                    Order Device
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="whyus" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Why Us</div>
              <h2 style={styles.sectionTitle}>A more serious first impression with stronger control, cleaner structure, and better flow.</h2>
            </div>
            <p style={styles.sectionText}>
              The page is now organized to keep attention, show value faster, and make direct action easier for customers.
            </p>
          </div>

          <div style={styles.benefitGrid}>
            {BENEFITS.map((item) => (
              <article key={item.title} style={styles.benefitCard}>
                <div style={styles.benefitIconWrap}>
                  <SparkIcon />
                </div>
                <h3 style={styles.benefitTitle}>{item.title}</h3>
                <p style={styles.benefitText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Direct Actions</div>
              <h2 style={styles.sectionTitle}>WhatsApp, Facebook, and location placed in a cleaner action system.</h2>
            </div>
            <p style={styles.sectionText}>
              No wasted top bar and no random clutter. Just proper direct paths to contact and action.
            </p>
          </div>

          <div style={styles.actionGrid}>
            {ACTIONS.map((item) => (
              <a key={item.name} href={item.href} target="_blank" rel="noreferrer" style={styles.actionCard}>
                <div style={styles.actionIconWrap}>
                  <ActionIcon kind={item.kind} />
                </div>
                <div style={styles.actionName}>{item.name}</div>
                <div style={styles.actionValue}>{item.value}</div>
                <p style={styles.actionHint}>{item.hint}</p>
              </a>
            ))}
          </div>
        </section>
      </main>

      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalLine} />
            <div style={styles.modalKicker}>{BRAND.network}</div>
            <h3 style={styles.modalTitle}>Support Login</h3>
            <p style={styles.modalText}>Authorized dashboard access only.</p>

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
                  style={styles.passwordInput}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <button type="button" style={styles.showBtn} onClick={() => setShowPassword((v) => !v)}>
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

const glass = "rgba(15, 23, 42, 0.74)";
const line = "rgba(148, 163, 184, 0.16)";
const textMain = "#f8fafc";
const textSoft = "rgba(226, 232, 240, 0.82)";
const textMuted = "rgba(148, 163, 184, 0.96)";
const gradientMain = "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 50%, #c084fc 100%)";
const gradientButton = "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)";
const gradientCard = "linear-gradient(180deg, rgba(20,28,48,0.92), rgba(11,18,32,0.92))";

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    color: textMain,
    background: "linear-gradient(180deg, #020617 0%, #020817 50%, #020617 100%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  bgBase: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(180deg, rgba(2,6,23,0.94), rgba(2,8,23,0.98))",
    pointerEvents: "none",
  },

  bgGlowA: {
    position: "fixed",
    top: "-180px",
    right: "-100px",
    width: "520px",
    height: "520px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(96,165,250,0.18), transparent 66%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgGlowB: {
    position: "fixed",
    left: "-120px",
    top: "260px",
    width: "440px",
    height: "440px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(192,132,252,0.14), transparent 66%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgGrid: {
    position: "fixed",
    inset: 0,
    opacity: 0.07,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "58px 58px",
    pointerEvents: "none",
  },

  bgVignette: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(circle at center, transparent 20%, rgba(2,6,23,0.38) 100%)",
    pointerEvents: "none",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(18px)",
    background: "rgba(2,6,23,0.58)",
    borderBottom: `1px solid ${line}`,
  },

  headerInner: {
    width: "min(1240px, calc(100% - 32px))",
    minHeight: "84px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },

  brandBtn: {
    border: 0,
    background: "transparent",
    color: textMain,
    padding: 0,
    cursor: "pointer",
  },

  brandText: {
    fontSize: "2rem",
    fontWeight: 950,
    letterSpacing: "-0.07em",
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
    fontWeight: 800,
    fontSize: "0.96rem",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: "12px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  headerGhostBtn: {
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "14px",
    border: `1px solid ${line}`,
    background: "rgba(15,23,42,0.72)",
    color: textMain,
    fontWeight: 900,
    cursor: "pointer",
  },

  headerMainBtn: {
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#08111f",
    background: gradientButton,
    fontWeight: 900,
    boxShadow: "0 14px 36px rgba(96,165,250,0.22)",
  },

  menuBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    border: `1px solid ${line}`,
    background: "rgba(15,23,42,0.78)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
  },

  menuBar: {
    width: "18px",
    height: "2px",
    borderRadius: "999px",
    background: "#f8fafc",
  },

  mobileMenu: {
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto 14px",
    borderRadius: "22px",
    background: "rgba(8,15,32,0.96)",
    border: `1px solid ${line}`,
    boxShadow: "0 18px 40px rgba(2,8,23,0.3)",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  mobileLink: {
    minHeight: "44px",
    borderRadius: "14px",
    border: `1px solid ${line}`,
    background: "rgba(255,255,255,0.03)",
    color: textMain,
    fontWeight: 800,
    cursor: "pointer",
  },

  mobilePrimary: {
    minHeight: "48px",
    borderRadius: "14px",
    border: 0,
    background: gradientButton,
    color: "#08111f",
    fontWeight: 900,
    cursor: "pointer",
  },

  mobileSecondary: {
    minHeight: "48px",
    borderRadius: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: `1px solid ${line}`,
    background: "rgba(255,255,255,0.04)",
    color: textMain,
    fontWeight: 900,
  },

  socialDock: {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: 60,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  socialDockBtn: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    color: textMain,
    background: "rgba(15,23,42,0.82)",
    border: `1px solid ${line}`,
    backdropFilter: "blur(16px)",
    boxShadow: "0 16px 34px rgba(2,8,23,0.32)",
  },

  main: {
    position: "relative",
    zIndex: 2,
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    paddingBottom: "88px",
  },

  heroSection: {
    padding: "44px 0 26px",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.02fr) minmax(460px, 0.98fr)",
    gap: "34px",
    alignItems: "center",
  },

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  heroKicker: {
    width: "fit-content",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(15,23,42,0.72)",
    border: `1px solid ${line}`,
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.78rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
  },

  heroTitle: {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontWeight: 950,
    fontSize: "clamp(3.4rem, 8vw, 6.2rem)",
    lineHeight: 0.92,
    letterSpacing: "-0.08em",
    maxWidth: "720px",
  },

  heroAccent: {
    background: gradientMain,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroText: {
    margin: 0,
    maxWidth: "700px",
    fontSize: "1.18rem",
    lineHeight: 1.72,
    color: textSoft,
  },

  heroButtons: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "6px",
  },

  heroMainBtn: {
    minHeight: "58px",
    padding: "0 26px",
    borderRadius: "18px",
    border: 0,
    background: gradientButton,
    color: "#08111f",
    fontWeight: 900,
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(96,165,250,0.22)",
  },

  heroAltBtn: {
    minHeight: "58px",
    padding: "0 26px",
    borderRadius: "18px",
    border: `1px solid ${line}`,
    background: "rgba(15,23,42,0.72)",
    color: textMain,
    fontWeight: 900,
    fontSize: "1rem",
    cursor: "pointer",
  },

  quickStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "8px",
  },

  quickStatCard: {
    minHeight: "112px",
    borderRadius: "24px",
    padding: "18px 20px",
    background: glass,
    border: `1px solid ${line}`,
    boxShadow: "0 16px 38px rgba(2,8,23,0.24)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  quickStatLabel: {
    color: textMuted,
    fontWeight: 800,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },

  quickStatValue: {
    fontSize: "1.24rem",
    fontWeight: 900,
  },

  sliderDots: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "2px",
  },

  sliderDot: {
    width: "34px",
    height: "8px",
    borderRadius: "999px",
    border: 0,
    background: "rgba(148,163,184,0.26)",
    cursor: "pointer",
  },

  sliderDotActive: {
    width: "50px",
    background: gradientButton,
  },

  heroRight: {
    minWidth: 0,
  },

  visualWrap: {
    position: "relative",
    minHeight: "680px",
    borderRadius: "34px",
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(9,16,30,0.95), rgba(8,14,26,0.92))",
    border: `1px solid ${line}`,
    boxShadow: "0 30px 80px rgba(2,8,23,0.38)",
  },

  visualGlowA: {
    position: "absolute",
    right: "4%",
    top: "6%",
    width: "250px",
    height: "250px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(96,165,250,0.24), transparent 68%)",
    filter: "blur(12px)",
  },

  visualGlowB: {
    position: "absolute",
    left: "10%",
    bottom: "8%",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(192,132,252,0.18), transparent 68%)",
    filter: "blur(14px)",
  },

  visualGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "42px 42px",
  },

  visualTopRow: {
    position: "absolute",
    left: "5%",
    right: "5%",
    top: "5%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  visualChip: {
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    color: "#cbd5e1",
    fontWeight: 900,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  visualStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "999px",
    background: "rgba(10,18,32,0.78)",
    border: `1px solid ${line}`,
    color: textMain,
    fontWeight: 800,
  },

  visualStatusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 16px rgba(34,197,94,0.7)",
  },

  visualCoreShell: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "340px",
    height: "340px",
    display: "grid",
    placeItems: "center",
  },

  visualRingOuter: {
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    border: "1px solid rgba(56,189,248,0.16)",
    background: "radial-gradient(circle at center, rgba(13,22,41,0.96), rgba(7,13,24,0.98))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.02), inset 0 0 60px rgba(59,130,246,0.08)",
    display: "grid",
    placeItems: "center",
  },

  visualRingMid: {
    width: "255px",
    height: "255px",
    borderRadius: "999px",
    border: "1px solid rgba(96,165,250,0.18)",
    boxShadow: "inset 0 0 42px rgba(59,130,246,0.07)",
    display: "grid",
    placeItems: "center",
  },

  visualRingInner: {
    position: "relative",
    width: "176px",
    height: "176px",
    borderRadius: "999px",
    border: "1px solid rgba(168,85,247,0.18)",
    background: "radial-gradient(circle at center, rgba(17,28,50,0.98), rgba(8,14,26,0.98))",
    boxShadow: "inset 0 0 30px rgba(168,85,247,0.06)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },

  visualScanSweep: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "170px",
    height: "170px",
    borderRadius: "999px",
    background: "conic-gradient(from 0deg, rgba(0,0,0,0) 0deg, rgba(0,0,0,0) 300deg, rgba(96,165,250,0.18) 332deg, rgba(125,211,252,0.42) 350deg, rgba(255,255,255,0.08) 360deg)",
    filter: "blur(0.3px)",
    pointerEvents: "none",
  },

  visualCenterCore: {
    position: "relative",
    zIndex: 2,
    width: "94px",
    height: "94px",
    borderRadius: "999px",
    background: "linear-gradient(180deg, rgba(19,30,54,0.98), rgba(10,18,32,0.98))",
    border: "1px solid rgba(125,211,252,0.18)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 0 20px rgba(96,165,250,0.10)",
  },

  

  

  visualCoreText: {
    fontWeight: 950,
    color: "#7dd3fc",
    letterSpacing: "-0.05em",
    fontSize: "2rem",
  },

  visualWifiZone: {
    position: "absolute",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "460px",
    height: "170px",
    pointerEvents: "none",
  },

  visualArc1: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "420px",
    height: "210px",
    borderTopLeftRadius: "250px",
    borderTopRightRadius: "250px",
    border: "15px solid transparent",
    borderTopColor: "rgba(56,189,248,0.86)",
  },

  

  

  

  

  visualFloatLeft: {
    position: "absolute",
    left: "5%",
    top: "48%",
    minWidth: "148px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.74)",
    border: `1px solid ${line}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 16px 34px rgba(2,8,23,0.24)",
  },

  visualFloatRight: {
    position: "absolute",
    right: "5%",
    top: "42%",
    minWidth: "148px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.74)",
    border: `1px solid ${line}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 16px 34px rgba(2,8,23,0.24)",
  },

  visualFloatKicker: {
    color: textMuted,
    fontWeight: 800,
    fontSize: "0.76rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  visualFloatValue: {
    fontWeight: 900,
    fontSize: "1rem",
  },

  visualBottomGrid: {
    position: "absolute",
    left: "5%",
    right: "5%",
    bottom: "5%",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  visualMiniCard: {
    minHeight: "110px",
    borderRadius: "22px",
    padding: "18px 20px",
    background: "linear-gradient(180deg, rgba(20,28,48,0.86), rgba(11,18,32,0.86))",
    border: `1px solid ${line}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  visualMiniLabel: {
    color: textMuted,
    fontWeight: 800,
    fontSize: "0.76rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  visualMiniValue: {
    fontWeight: 900,
    fontSize: "1.18rem",
  },

  section: {
    padding: "60px 0 18px",
  },

  sectionHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  sectionKicker: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.78rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.05em",
    maxWidth: "800px",
  },

  sectionText: {
    margin: 0,
    maxWidth: "560px",
    color: textSoft,
    fontSize: "1.02rem",
    lineHeight: 1.75,
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  planCard: {
    minHeight: "372px",
    borderRadius: "30px",
    padding: "22px",
    background: gradientCard,
    border: `1px solid ${line}`,
    boxShadow: "0 22px 54px rgba(2,8,23,0.24)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    overflow: "hidden",
  },

  planCardFeatured: {
    transform: "translateY(-4px)",
    boxShadow: "0 28px 62px rgba(96,165,250,0.22)",
    border: "1px solid rgba(125,211,252,0.26)",
  },

  planHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  planBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${line}`,
    color: "#cbd5e1",
    fontWeight: 900,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  planArrowWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${line}`,
    color: "#7dd3fc",
  },

  planName: {
    margin: 0,
    fontSize: "1.44rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  planPrice: {
    fontWeight: 950,
    fontSize: "2.5rem",
    letterSpacing: "-0.06em",
  },

  planSpeed: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "1.04rem",
  },

  planSpecs: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "4px",
  },

  planSpecRow: {
    minHeight: "58px",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid rgba(255,255,255,0.06)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: textSoft,
    fontSize: "0.92rem",
  },

  planAction: {
    marginTop: "auto",
    minHeight: "52px",
    borderRadius: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontWeight: 900,
    background: gradientButton,
    color: "#08111f",
    boxShadow: "0 14px 34px rgba(96,165,250,0.22)",
  },

  deviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  deviceCard: {
    minHeight: "330px",
    borderRadius: "30px",
    padding: "22px",
    background: gradientCard,
    border: `1px solid ${line}`,
    boxShadow: "0 22px 52px rgba(2,8,23,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  deviceTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  deviceIconBox: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    color: "#7dd3fc",
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

  deviceType: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.88rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  deviceName: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  deviceDesc: {
    margin: 0,
    color: textSoft,
    fontSize: "1rem",
    lineHeight: 1.75,
  },

  featureChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  featureChip: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    color: "#dbeafe",
    fontWeight: 800,
    fontSize: "0.78rem",
  },

  deviceBottom: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  devicePrice: {
    fontSize: "2rem",
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },

  deviceAction: {
    minHeight: "48px",
    padding: "0 18px",
    borderRadius: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontWeight: 900,
    background: gradientButton,
    color: "#08111f",
  },

  benefitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  benefitCard: {
    minHeight: "220px",
    borderRadius: "28px",
    padding: "22px",
    background: gradientCard,
    border: `1px solid ${line}`,
    boxShadow: "0 20px 52px rgba(2,8,23,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  benefitIconWrap: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    color: "#7dd3fc",
  },

  benefitTitle: {
    margin: 0,
    fontSize: "1.28rem",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  benefitText: {
    margin: 0,
    color: textSoft,
    lineHeight: 1.75,
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  actionCard: {
    minHeight: "224px",
    borderRadius: "30px",
    padding: "22px",
    background: gradientCard,
    border: `1px solid ${line}`,
    boxShadow: "0 22px 52px rgba(2,8,23,0.2)",
    textDecoration: "none",
    color: textMain,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  actionIconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${line}`,
    color: "#7dd3fc",
  },

  actionName: {
    color: textMuted,
    fontWeight: 900,
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
  },

  actionValue: {
    fontSize: "1.42rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  actionHint: {
    margin: 0,
    color: textSoft,
    lineHeight: 1.7,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(2,6,23,0.66)",
    backdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    padding: "16px",
  },

  modalCard: {
    width: "min(100%, 470px)",
    borderRadius: "30px",
    padding: "22px",
    background: "linear-gradient(180deg, rgba(8,15,32,0.97), rgba(5,10,22,0.97))",
    border: `1px solid rgba(148,163,184,0.2)`,
    boxShadow: "0 32px 80px rgba(2,8,23,0.46)",
  },

  modalLine: {
    width: "100%",
    height: "4px",
    borderRadius: "999px",
    background: gradientButton,
    marginBottom: "18px",
  },

  modalKicker: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.78rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "2.8rem",
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
    minHeight: "54px",
    borderRadius: "18px",
    border: "1px solid rgba(96,165,250,0.2)",
    padding: "0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.78)",
    color: textMain,
    fontSize: "1rem",
  },

  passwordWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  passwordInput: {
    width: "100%",
    minHeight: "54px",
    borderRadius: "18px",
    border: "1px solid rgba(96,165,250,0.2)",
    padding: "0 92px 0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.78)",
    color: textMain,
    fontSize: "1rem",
  },

  showBtn: {
    position: "absolute",
    right: "8px",
    height: "38px",
    padding: "0 14px",
    borderRadius: "12px",
    border: `1px solid ${line}`,
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
    borderRadius: "18px",
    border: 0,
    background: gradientButton,
    color: "#08111f",
    fontWeight: 900,
    fontSize: "1.02rem",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(96,165,250,0.24)",
  },
};

function applyResponsiveStyles() {
  if (typeof window === "undefined") return;
  const w = window.innerWidth;

  if (w < 1180) {
    styles.heroGrid.gridTemplateColumns = "1fr";
    styles.planGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.deviceGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.benefitGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.actionGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  } else {
    styles.heroGrid.gridTemplateColumns = "minmax(0, 1.02fr) minmax(460px, 0.98fr)";
    styles.planGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.deviceGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.benefitGrid.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
    styles.actionGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  }

  if (w < 760) {
    styles.headerInner.width = "min(100%, calc(100% - 20px))";
    styles.main.width = "min(100%, calc(100% - 20px))";
    styles.heroSection.padding = "26px 0 12px";
    styles.heroTitle.fontSize = "clamp(2.4rem, 12vw, 4rem)";
    styles.heroText.fontSize = "1rem";
    styles.quickStats.gridTemplateColumns = "1fr";
    styles.planGrid.gridTemplateColumns = "1fr";
    styles.deviceGrid.gridTemplateColumns = "1fr";
    styles.benefitGrid.gridTemplateColumns = "1fr";
    styles.actionGrid.gridTemplateColumns = "1fr";
    styles.visualBottomGrid.gridTemplateColumns = "1fr";
    styles.visualWrap.minHeight = "560px";
    styles.visualFloatLeft.display = "none";
    styles.visualFloatRight.display = "none";
    styles.socialDock.right = "12px";
    styles.socialDock.bottom = "12px";
  } else {
    styles.quickStats.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.visualBottomGrid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    styles.visualWrap.minHeight = "680px";
    styles.visualFloatLeft.display = "flex";
    styles.visualFloatRight.display = "flex";
    styles.socialDock.right = "18px";
    styles.socialDock.bottom = "18px";
  }
}

applyResponsiveStyles();
window.addEventListener("resize", applyResponsiveStyles);




