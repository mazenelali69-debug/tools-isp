import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const BRAND = {
  name: "NoComment",
  label: "NOCOMMENT NETWORK",
  phoneDisplay: "70411518",
  whatsapp: "https://wa.me/96170411518",
  facebook: "https://www.facebook.com/nocomment.lb/",
  location:
    "https://www.google.com/search?sca_esv=5c685c3490d49ca4&sxsrf=ANbL-n42jIJIVD_C_u63mQueNeiKVKxulw:1774462014416&kgmid=/g/11v5_5rfkq&q=NoComment-ISP&shem=dlvs1&shndl=30&source=sh/x/loc/uni/m1/1&kgs=83c38a6d71611246&utm_source=dlvs1,sh/x/loc/uni/m1/1",
};

const HERO_SLIDES = [
  {
    eyebrow: "PREMIUM ISP EXPERIENCE",
    title1: "Fast internet.",
    title2: "Luxury layout.",
    title3: "Direct support.",
    desc:
      "A full landing rebuild designed to feel premium from the first second: sharper hierarchy, cleaner sections, stronger trust, and faster actions.",
    primary: "View Plans",
    secondary: "Support Login",
  },
  {
    eyebrow: "HOME + BUSINESS READY",
    title1: "Clear packages.",
    title2: "Real hardware.",
    title3: "Zero clutter.",
    desc:
      "Plans, devices, actions, and support are arranged like a serious provider brand instead of a noisy page full of random blocks.",
    primary: "See Devices",
    secondary: "Call Now",
  },
  {
    eyebrow: "FINAL CUSTOMER FLOW",
    title1: "Modern visual.",
    title2: "Better trust.",
    title3: "Higher conversion.",
    desc:
      "This version is rebuilt to feel cleaner, darker, sharper, and more intentional, with a hero that looks designed instead of patched.",
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
    desc: "Stable WAN handoff with clean installation and reliable line sync for customer setups.",
    features: ["WAN Ready", "Stable Sync", "Easy Setup"],
  },
  {
    name: "Wi-Fi Router",
    type: "Router",
    tag: "Popular",
    price: "$30",
    desc: "Better indoor wireless spread for homes, apartments, and multi-device daily usage.",
    features: ["Better Range", "Multi Device", "Home Use"],
  },
  {
    name: "Outdoor Receiver",
    type: "Receiver",
    tag: "Long Range",
    price: "$45",
    desc: "Stronger signal capture for rooftops, difficult areas, and longer wireless paths.",
    features: ["Outdoor", "Long Reach", "Better Capture"],
  },
  {
    name: "Mesh Extension",
    type: "Extension",
    tag: "Coverage",
    price: "$40",
    desc: "Extend wireless coverage in larger homes and multi-floor customer environments.",
    features: ["Mesh Ready", "Multi Floor", "Coverage Boost"],
  },
  {
    name: "Dual Band CPE",
    type: "Receiver",
    tag: "Home Ready",
    price: "$35",
    desc: "Dual-band customer device built for stable residential installation and daily signal use.",
    features: ["2.4G + 5G", "Stable Link", "Clean Install"],
  },
  {
    name: "Business Router",
    type: "Router",
    tag: "Business",
    price: "$60",
    desc: "Better traffic distribution, stronger device control, and cleaner office networking.",
    features: ["Office Ready", "Reliable", "Better Control"],
  },
];

const BENEFITS = [
  {
    title: "Premium first impression",
    text: "A cleaner landing flow that feels intentional, polished, and more trustworthy from the first look.",
  },
  {
    title: "Stronger package clarity",
    text: "Plans are arranged with better pricing hierarchy so customers understand the options faster.",
  },
  {
    title: "Real hardware offers",
    text: "Modem, router, receiver, and extension products are shown as sellable cards, not random boxes.",
  },
  {
    title: "Faster direct action",
    text: "Support Login, WhatsApp, Facebook, phone, and location are easier to reach and act on.",
  },
];

const ACTIONS = [
  {
    kind: "whatsapp",
    name: "WhatsApp",
    value: "Chat directly now",
    hint: "Open direct support",
    href: BRAND.whatsapp,
  },
  {
    kind: "facebook",
    name: "Facebook",
    value: "Visit our page",
    hint: "See updates and page info",
    href: BRAND.facebook,
  },
  {
    kind: "location",
    name: "Location",
    value: "Open Google Maps",
    hint: "Go directly to our location",
    href: BRAND.location,
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

function BoltIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10.5 1.5L4.5 10H9L8.5 18.5L15.5 8.5H11L10.5 1.5Z" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15L15 5M15 5H7.5M15 5V12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionIcon({ kind }) {
  if (kind === "whatsapp") return <WhatsAppIcon size={18} />;
  if (kind === "facebook") return <FacebookIcon size={18} />;
  return <LocationIcon size={18} />;
}

function MotionStyles() {
  return (
    <style>{`
      @keyframes ncScan {
        0% { transform: translate(-50%, -50%) rotate(0deg); opacity: .18; }
        50% { opacity: .38; }
        100% { transform: translate(-50%, -50%) rotate(360deg); opacity: .18; }
      }

      @keyframes ncWifiA {
        0% { transform: translateX(-50%) translateY(0px); opacity: .75; }
        50% { transform: translateX(-50%) translateY(-7px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .75; }
      }

      @keyframes ncWifiB {
        0% { transform: translateX(-50%) translateY(0px); opacity: .62; }
        50% { transform: translateX(-50%) translateY(-11px); opacity: .95; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .62; }
      }

      @keyframes ncWifiC {
        0% { transform: translateX(-50%) translateY(0px); opacity: .8; }
        50% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .8; }
      }

      @keyframes ncBlink {
        0% { opacity: .55; box-shadow: 0 0 0 rgba(34,197,94,0); }
        50% { opacity: 1; box-shadow: 0 0 18px rgba(34,197,94,.78); }
        100% { opacity: .55; box-shadow: 0 0 0 rgba(34,197,94,0); }
      }

      .nc-scan {
        animation: ncScan 5.8s linear infinite;
      }

      .nc-wifi-1 {
        animation: ncWifiA 3.7s ease-in-out infinite;
      }

      .nc-wifi-2 {
        animation: ncWifiB 4.1s ease-in-out infinite;
      }

      .nc-wifi-3 {
        animation: ncWifiC 2.9s ease-in-out infinite;
      }

      .nc-dot {
        animation: ncBlink 2.2s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .nc-scan,
        .nc-wifi-1,
        .nc-wifi-2,
        .nc-wifi-3,
        .nc-dot {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function HeroVisual() {
  return (
    <div className="visual-wrap">
      <div className="visual-glow visual-glow-a" />
      <div className="visual-glow visual-glow-b" />
      <div className="visual-grid" />

      <div className="visual-top">
        <div className="visual-chip">CHATGPT 2099 BUILD</div>
        <div className="visual-status">
          <span className="visual-status-dot nc-dot" />
          Online
        </div>
      </div>

      <div className="wifi-zone">
        <div className="wifi-arc wifi-arc-1 nc-wifi-1" />
        <div className="wifi-arc wifi-arc-2 nc-wifi-2" />
        <div className="wifi-arc wifi-arc-3 nc-wifi-3" />
      </div>

      <div className="core-shell">
        <div className="core-ring outer">
          <div className="core-ring mid">
            <div className="core-ring inner">
              <div className="scan-sweep nc-scan" />
              <div className="core-center">
                <div className="core-mark">
                  <div className="core-mark-arcs">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="core-mark-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="visual-float visual-float-left">
        <span className="float-kicker">Support</span>
        <strong className="float-value">Direct reply</strong>
      </div>

      <div className="visual-float visual-float-right">
        <span className="float-kicker">Hardware</span>
        <strong className="float-value">Modem + Router</strong>
      </div>

      <div className="visual-bottom">
        <div className="mini-card">
          <span className="mini-label">Packages</span>
          <strong className="mini-value">6 Plans</strong>
        </div>
        <div className="mini-card">
          <span className="mini-label">Design</span>
          <strong className="mini-value">Final Feel</strong>
        </div>
        <div className="mini-card">
          <span className="mini-label">Actions</span>
          <strong className="mini-value">Instant</strong>
        </div>
      </div>
    </div>
  );
}

function SocialDock() {
  return (
    <div className="social-dock">
      <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="social-btn" title="WhatsApp">
        <WhatsAppIcon size={18} />
      </a>
      <a href={BRAND.facebook} target="_blank" rel="noreferrer" className="social-btn" title="Facebook">
        <FacebookIcon size={18} />
      </a>
      <a href={BRAND.location} target="_blank" rel="noreferrer" className="social-btn" title="Location">
        <LocationIcon size={18} />
      </a>
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4400);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#020617";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const isMobile = width < 900;
  const isTablet = width < 1180;
  const isSmall = width < 760;

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
        setSubmitting(false);
        setLoginError("");

        if (typeof onLogin === "function") {
          onLogin({ username: username.trim() });
        } else {
          window.location.href = "/";
        }
      } else {
        setSubmitting(false);
        setLoginError("Invalid username or password.");
      }
    }, 650);
  }

  return (
    <div style={styles.page}>
      <MotionStyles />

      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .surface-card {
          background: linear-gradient(180deg, rgba(16,24,42,0.92), rgba(10,16,30,0.96));
          border: 1px solid rgba(148,163,184,0.14);
          box-shadow: 0 24px 60px rgba(2,8,23,0.24);
          backdrop-filter: blur(16px);
        }

        .outline-chip {
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
        }

        .hero-btn-main,
        .hero-btn-alt,
        .top-btn-main,
        .top-btn-alt,
        .plan-btn,
        .device-btn,
        .login-btn,
        .mobile-primary,
        .mobile-secondary,
        .nav-link,
        .menu-btn,
        .brand-btn,
        .slide-dot,
        .mobile-link {
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease, opacity .2s ease;
        }

        .hero-btn-main:hover,
        .top-btn-main:hover,
        .plan-btn:hover,
        .device-btn:hover,
        .login-btn:hover,
        .mobile-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(96,165,250,0.24);
        }

        .hero-btn-alt:hover,
        .top-btn-alt:hover,
        .mobile-secondary:hover,
        .mobile-link:hover,
        .menu-btn:hover,
        .nav-link:hover {
          transform: translateY(-1px);
          border-color: rgba(125,211,252,0.28);
        }

        .plan-card:hover,
        .device-card:hover,
        .benefit-card:hover,
        .action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(125,211,252,0.22);
          box-shadow: 0 28px 70px rgba(2,8,23,0.28);
        }

        .social-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(125,211,252,0.28);
        }

        .visual-wrap {
          position: relative;
          min-height: ${isSmall ? "560px" : "700px"};
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,0.14);
          background:
            radial-gradient(circle at top right, rgba(56,189,248,0.10), transparent 28%),
            radial-gradient(circle at bottom left, rgba(168,85,247,0.10), transparent 28%),
            linear-gradient(180deg, rgba(8,14,26,0.98), rgba(7,12,22,0.98));
          box-shadow: 0 34px 90px rgba(2,8,23,0.40);
        }

        .visual-grid {
          position: absolute;
          inset: 0;
          opacity: .06;
          background-image:
            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 42px 42px;
        }

        .visual-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(24px);
        }

        .visual-glow-a {
          width: 260px;
          height: 260px;
          top: 5%;
          right: 4%;
          background: radial-gradient(circle, rgba(56,189,248,0.18), transparent 68%);
        }

        .visual-glow-b {
          width: 220px;
          height: 220px;
          left: 10%;
          bottom: 8%;
          background: radial-gradient(circle, rgba(168,85,247,0.14), transparent 68%);
        }

        .visual-top {
          position: absolute;
          top: 5%;
          left: 5%;
          right: 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          z-index: 4;
        }

        .visual-chip {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: .74rem;
          font-weight: 900;
          letter-spacing: .14em;
          color: #cbd5e1;
          text-transform: uppercase;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(255,255,255,0.04);
        }

        .visual-status {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          border-radius: 999px;
          color: #f8fafc;
          font-weight: 800;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(255,255,255,0.04);
        }

        .visual-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
        }

        .wifi-zone {
          position: absolute;
          top: 18%;
          left: 50%;
          transform: translateX(-50%);
          width: min(92%, 460px);
          height: 180px;
          pointer-events: none;
          z-index: 3;
        }

        .wifi-arc {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          border: solid transparent;
          border-top-left-radius: 999px;
          border-top-right-radius: 999px;
        }

        .wifi-arc-1 {
          top: 0;
          width: min(100%, 420px);
          height: 210px;
          border-width: 15px;
          border-top-color: rgba(56,189,248,0.86);
        }

        .wifi-arc-2 {
          top: 30px;
          width: min(76%, 320px);
          height: 160px;
          border-width: 13px;
          border-top-color: rgba(59,130,246,0.82);
        }

        .wifi-arc-3 {
          top: 58px;
          width: min(52%, 220px);
          height: 112px;
          border-width: 11px;
          border-top-color: rgba(168,85,247,0.88);
        }

        .core-shell {
          position: absolute;
          top: 52%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 340px;
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .core-ring {
          display: grid;
          place-items: center;
          border-radius: 999px;
        }

        .core-ring.outer {
          width: 340px;
          height: 340px;
          border: 1px solid rgba(56,189,248,0.14);
          background: radial-gradient(circle at center, rgba(12,20,36,0.98), rgba(7,12,22,0.98));
          box-shadow: 0 0 0 1px rgba(255,255,255,0.02), inset 0 0 80px rgba(59,130,246,0.06);
        }

        .core-ring.mid {
          width: 250px;
          height: 250px;
          border: 1px solid rgba(96,165,250,0.18);
          box-shadow: inset 0 0 40px rgba(96,165,250,0.05);
        }

        .core-ring.inner {
          position: relative;
          width: 170px;
          height: 170px;
          overflow: hidden;
          border: 1px solid rgba(168,85,247,0.18);
          background: radial-gradient(circle at center, rgba(17,28,50,0.98), rgba(8,14,26,0.98));
          box-shadow: inset 0 0 34px rgba(168,85,247,0.05);
        }

        .scan-sweep {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 168px;
          height: 168px;
          border-radius: 999px;
          background:
            conic-gradient(
              from 0deg,
              rgba(0,0,0,0) 0deg,
              rgba(0,0,0,0) 304deg,
              rgba(96,165,250,0.16) 334deg,
              rgba(125,211,252,0.40) 350deg,
              rgba(255,255,255,0.10) 360deg
            );
          pointer-events: none;
        }

        .core-center {
          position: relative;
          z-index: 2;
          width: 92px;
          height: 92px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(125,211,252,0.18);
          background: linear-gradient(180deg, rgba(18,29,52,0.98), rgba(9,16,30,0.98));
          box-shadow: 0 0 20px rgba(96,165,250,0.10);
        }

        .core-mark {
          position: relative;
          width: 48px;
          height: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }

        .core-mark-arcs {
          position: relative;
          width: 48px;
          height: 28px;
        }

        .core-mark-arcs span {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          border: solid transparent;
          border-top-left-radius: 999px;
          border-top-right-radius: 999px;
        }

        .core-mark-arcs span:nth-child(1) {
          top: 0;
          width: 46px;
          height: 24px;
          border-width: 4px;
          border-top-color: rgba(56,189,248,0.88);
        }

        .core-mark-arcs span:nth-child(2) {
          top: 6px;
          width: 32px;
          height: 16px;
          border-width: 4px;
          border-top-color: rgba(59,130,246,0.84);
        }

        .core-mark-arcs span:nth-child(3) {
          top: 12px;
          width: 18px;
          height: 10px;
          border-width: 4px;
          border-top-color: rgba(168,85,247,0.88);
        }

        .core-mark-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f8fafc;
          margin-top: 2px;
          box-shadow: 0 0 14px rgba(255,255,255,0.24);
        }

        .visual-float {
          position: absolute;
          min-width: 154px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(255,255,255,0.04);
          box-shadow: 0 16px 34px rgba(2,8,23,0.24);
          z-index: 4;
        }

        .visual-float-left {
          left: 5%;
          top: 48%;
          display: ${isSmall ? "none" : "flex"};
          flex-direction: column;
          gap: 8px;
        }

        .visual-float-right {
          right: 5%;
          top: 42%;
          display: ${isSmall ? "none" : "flex"};
          flex-direction: column;
          gap: 8px;
        }

        .float-kicker,
        .mini-label {
          color: rgba(148,163,184,0.96);
          font-weight: 800;
          font-size: .76rem;
          text-transform: uppercase;
          letter-spacing: .14em;
        }

        .float-value,
        .mini-value {
          font-weight: 900;
          font-size: 1rem;
          color: #f8fafc;
        }

        .visual-bottom {
          position: absolute;
          left: 5%;
          right: 5%;
          bottom: 5%;
          display: grid;
          grid-template-columns: ${isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))"};
          gap: 14px;
          z-index: 4;
        }

        .mini-card {
          min-height: 108px;
          padding: 18px 20px;
          border-radius: 22px;
          border: 1px solid rgba(148,163,184,0.14);
          background: linear-gradient(180deg, rgba(20,28,48,0.86), rgba(11,18,32,0.86));
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      `}</style>

      <div style={styles.bgBase} />
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGrid} />
      <div style={styles.bgVignette} />

      <SocialDock />

      <header style={styles.header}>
        <div style={styles.headerInner(isSmall)}>
          <button className="brand-btn" style={styles.brandBtn} onClick={() => scrollToId("home")}>
            <span style={styles.brandText}>{BRAND.name}</span>
          </button>

          {!isMobile ? (
            <nav style={styles.nav}>
              <button className="nav-link" style={styles.navLink} onClick={() => scrollToId("home")}>Home</button>
              <button className="nav-link" style={styles.navLink} onClick={() => scrollToId("plans")}>Plans</button>
              <button className="nav-link" style={styles.navLink} onClick={() => scrollToId("devices")}>Devices</button>
              <button className="nav-link" style={styles.navLink} onClick={() => scrollToId("whyus")}>Why Us</button>
              <button className="nav-link" style={styles.navLink} onClick={() => scrollToId("contact")}>Contact</button>
            </nav>
          ) : (
            <button className="menu-btn" style={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
              <span style={styles.menuBar} />
              <span style={styles.menuBar} />
              <span style={styles.menuBar} />
            </button>
          )}

          {!isMobile && (
            <div style={styles.headerActions}>
              <button className="top-btn-alt" style={styles.headerGhostBtn} onClick={() => setShowLogin(true)}>
                Support Login
              </button>
              <a className="top-btn-main" href={`tel:${BRAND.phoneDisplay}`} style={styles.headerMainBtn}>
                Call Now
              </a>
            </div>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={styles.mobileMenu(isSmall)}>
            <button className="mobile-link" style={styles.mobileLink} onClick={() => scrollToId("home")}>Home</button>
            <button className="mobile-link" style={styles.mobileLink} onClick={() => scrollToId("plans")}>Plans</button>
            <button className="mobile-link" style={styles.mobileLink} onClick={() => scrollToId("devices")}>Devices</button>
            <button className="mobile-link" style={styles.mobileLink} onClick={() => scrollToId("whyus")}>Why Us</button>
            <button className="mobile-link" style={styles.mobileLink} onClick={() => scrollToId("contact")}>Contact</button>
            <button className="mobile-primary" style={styles.mobilePrimary} onClick={() => { setMenuOpen(false); setShowLogin(true); }}>
              Support Login
            </button>
            <a className="mobile-secondary" href={`tel:${BRAND.phoneDisplay}`} style={styles.mobileSecondary}>
              Call Now
            </a>
          </div>
        )}
      </header>

      <main style={styles.main(isSmall)}>
        <section id="home" style={styles.heroSection}>
          <div style={styles.heroGrid(isTablet)}>
            <div style={styles.heroLeft}>
              <div style={styles.heroEyebrow}>{slide.eyebrow}</div>

              <h1 style={styles.heroTitle(isSmall)}>
                <span>{slide.title1}</span>
                <span>{slide.title2}</span>
                <span style={styles.heroAccent}>{slide.title3}</span>
              </h1>

              <p style={styles.heroText(isSmall)}>{slide.desc}</p>

              <div style={styles.heroButtons}>
                <button className="hero-btn-main" style={styles.heroMainBtn} onClick={() => handlePrimary(slide.primary)}>
                  {slide.primary}
                </button>
                <button className="hero-btn-alt" style={styles.heroAltBtn} onClick={() => handleSecondary(slide.secondary)}>
                  {slide.secondary}
                </button>
              </div>

              <div style={styles.quickStats(isSmall)}>
                <div className="surface-card" style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Coverage</span>
                  <strong style={styles.quickStatValue}>Jabal Mohssen</strong>
                </div>
                <div className="surface-card" style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Visual</span>
                  <strong style={styles.quickStatValue}>2099 feel</strong>
                </div>
                <div className="surface-card" style={styles.quickStatCard}>
                  <span style={styles.quickStatLabel}>Support</span>
                  <strong style={styles.quickStatValue}>Direct access</strong>
                </div>
              </div>

              <div style={styles.slideDots}>
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    className="slide-dot"
                    onClick={() => setActiveSlide(index)}
                    style={{
                      ...styles.slideDot,
                      ...(index === activeSlide ? styles.slideDotActive : {}),
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
              <div style={styles.sectionEyebrow}>Packages</div>
              <h2 style={styles.sectionTitle}>Plans rebuilt to feel clearer, darker, and more premium.</h2>
            </div>
            <p style={styles.sectionText}>
              Better pricing hierarchy, stronger badges, cleaner specs, and a plan section that feels sellable instead of noisy.
            </p>
          </div>

          <div style={styles.planGrid(isSmall, isTablet)}>
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className="surface-card plan-card"
                style={{
                  ...styles.planCard,
                  ...(plan.featured ? styles.planCardFeatured : {}),
                }}
              >
                <div style={styles.planHeader}>
                  <div className="outline-chip" style={styles.planBadge}>{plan.badge}</div>
                  <div className="outline-chip" style={styles.planArrowWrap}>
                    <ArrowIcon />
                  </div>
                </div>

                <h3 style={styles.planName}>{plan.name}</h3>
                <div style={styles.planPrice}>{plan.price}</div>
                <div style={styles.planSpeed}>{plan.speed}</div>

                <div style={styles.planSpecs}>
                  <div className="outline-chip" style={styles.planSpecRow}>
                    <span>Cached</span>
                    <strong>{plan.cached}</strong>
                  </div>
                  <div className="outline-chip" style={styles.planSpecRow}>
                    <span>Daily</span>
                    <strong>{plan.daily}</strong>
                  </div>
                  <div className="outline-chip" style={styles.planSpecRow}>
                    <span>Monthly</span>
                    <strong>{plan.monthly}</strong>
                  </div>
                </div>

                <a className="plan-btn" href={`tel:${BRAND.phoneDisplay}`} style={styles.planAction}>
                  Request Plan
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="devices" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionEyebrow}>Devices</div>
              <h2 style={styles.sectionTitle}>Modem, router, and hardware offers that finally look like real product cards.</h2>
            </div>
            <p style={styles.sectionText}>
              Better device hierarchy, clear pricing, stronger tags, and a darker premium layout that feels intentional.
            </p>
          </div>

          <div style={styles.deviceGrid(isSmall, isTablet)}>
            {DEVICES.map((device) => (
              <article key={device.name} className="surface-card device-card" style={styles.deviceCard}>
                <div style={styles.deviceTop}>
                  <div className="outline-chip" style={styles.deviceIconWrap}>
                    <BoltIcon />
                  </div>
                  <span className="outline-chip" style={styles.deviceTag}>{device.tag}</span>
                </div>

                <div style={styles.deviceType}>{device.type}</div>
                <h3 style={styles.deviceName}>{device.name}</h3>
                <p style={styles.deviceDesc}>{device.desc}</p>

                <div style={styles.featureChips}>
                  {device.features.map((feature) => (
                    <span key={feature} className="outline-chip" style={styles.featureChip}>
                      {feature}
                    </span>
                  ))}
                </div>

                <div style={styles.deviceBottom}>
                  <div style={styles.devicePrice}>{device.price}</div>
                  <a className="device-btn" href={`tel:${BRAND.phoneDisplay}`} style={styles.deviceAction}>
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
              <div style={styles.sectionEyebrow}>Why Us</div>
              <h2 style={styles.sectionTitle}>A stronger brand impression with cleaner flow and better customer confidence.</h2>
            </div>
            <p style={styles.sectionText}>
              This section explains the value quickly and gives the page more authority, balance, and real provider energy.
            </p>
          </div>

          <div style={styles.benefitGrid(isSmall, isTablet)}>
            {BENEFITS.map((item) => (
              <article key={item.title} className="surface-card benefit-card" style={styles.benefitCard}>
                <div className="outline-chip" style={styles.benefitIconWrap}>
                  <BoltIcon />
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
              <div style={styles.sectionEyebrow}>Direct Actions</div>
              <h2 style={styles.sectionTitle}>WhatsApp, Facebook, and location shown in a cleaner action system.</h2>
            </div>
            <p style={styles.sectionText}>
              No ugly strips, no random clutter, and no weak CTA placement. Just direct paths to customer action.
            </p>
          </div>

          <div style={styles.actionGrid(isSmall, isTablet)}>
            {ACTIONS.map((item) => (
              <a key={item.name} href={item.href} target="_blank" rel="noreferrer" className="surface-card action-card" style={styles.actionCard}>
                <div className="outline-chip" style={styles.actionIconWrap}>
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
          <div className="surface-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTopLine} />
            <div style={styles.modalEyebrow}>{BRAND.label}</div>
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

              <button className="login-btn" type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Checking..." : "Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    color: "#f8fafc",
    background: "linear-gradient(180deg, #020617 0%, #020817 52%, #020617 100%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  bgBase: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(180deg, rgba(2,6,23,0.95), rgba(2,8,23,0.98))",
    pointerEvents: "none",
  },

  bgGlowA: {
    position: "fixed",
    top: "-160px",
    right: "-100px",
    width: "520px",
    height: "520px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(56,189,248,0.14), transparent 66%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgGlowB: {
    position: "fixed",
    left: "-120px",
    top: "240px",
    width: "440px",
    height: "440px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(168,85,247,0.12), transparent 66%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  bgGrid: {
    position: "fixed",
    inset: 0,
    opacity: 0.06,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "62px 62px",
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
    background: "rgba(2,6,23,0.56)",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
  },

  headerInner: (isSmall) => ({
    width: isSmall ? "min(100%, calc(100% - 20px))" : "min(1240px, calc(100% - 32px))",
    minHeight: "84px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  }),

  brandBtn: {
    border: 0,
    background: "transparent",
    color: "#f8fafc",
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
    color: "rgba(226,232,240,0.84)",
    fontWeight: 800,
    fontSize: "0.96rem",
    padding: "8px 10px",
    borderRadius: "12px",
    cursor: "pointer",
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
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
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
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
    color: "#08111f",
    fontWeight: 900,
    boxShadow: "0 14px 36px rgba(96,165,250,0.22)",
  },

  menuBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
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

  mobileMenu: (isSmall) => ({
    width: isSmall ? "min(100%, calc(100% - 20px))" : "min(1240px, calc(100% - 32px))",
    margin: "0 auto 14px",
    borderRadius: "22px",
    padding: "14px",
    background: "rgba(8,15,32,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 18px 40px rgba(2,8,23,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }),

  mobileLink: {
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.03)",
    color: "#f8fafc",
    fontWeight: 800,
    cursor: "pointer",
  },

  mobilePrimary: {
    minHeight: "48px",
    borderRadius: "14px",
    border: 0,
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
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
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    fontWeight: 900,
  },

  main: (isSmall) => ({
    position: "relative",
    zIndex: 2,
    width: isSmall ? "min(100%, calc(100% - 20px))" : "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    paddingBottom: "88px",
  }),

  heroSection: {
    padding: "44px 0 28px",
  },

  heroGrid: (isTablet) => ({
    display: "grid",
    gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 1.02fr) minmax(470px, 0.98fr)",
    gap: "34px",
    alignItems: "center",
  }),

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  heroEyebrow: {
    width: "fit-content",
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.78rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
  },

  heroTitle: (isSmall) => ({
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontWeight: 950,
    fontSize: isSmall ? "clamp(2.4rem, 12vw, 4rem)" : "clamp(3.4rem, 8vw, 6.2rem)",
    lineHeight: 0.92,
    letterSpacing: "-0.08em",
    maxWidth: "720px",
  }),

  heroAccent: {
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 50%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroText: (isSmall) => ({
    margin: 0,
    maxWidth: "700px",
    fontSize: isSmall ? "1rem" : "1.18rem",
    lineHeight: 1.72,
    color: "rgba(226,232,240,0.82)",
  }),

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
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
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
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    fontWeight: 900,
    fontSize: "1rem",
    cursor: "pointer",
  },

  quickStats: (isSmall) => ({
    display: "grid",
    gridTemplateColumns: isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "8px",
  }),

  quickStatCard: {
    minHeight: "112px",
    borderRadius: "24px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  quickStatLabel: {
    color: "rgba(148,163,184,0.96)",
    fontWeight: 800,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },

  quickStatValue: {
    fontSize: "1.24rem",
    fontWeight: 900,
  },

  slideDots: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "2px",
  },

  slideDot: {
    width: "34px",
    height: "8px",
    borderRadius: "999px",
    border: 0,
    background: "rgba(148,163,184,0.26)",
    cursor: "pointer",
  },

  slideDotActive: {
    width: "50px",
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
  },

  heroRight: {
    minWidth: 0,
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

  sectionEyebrow: {
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
    color: "rgba(226,232,240,0.82)",
    fontSize: "1.02rem",
    lineHeight: 1.75,
  },

  planGrid: (isSmall, isTablet) => ({
    display: "grid",
    gridTemplateColumns: isSmall ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  }),

  planCard: {
    minHeight: "372px",
    borderRadius: "30px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    overflow: "hidden",
  },

  planCardFeatured: {
    borderColor: "rgba(125,211,252,0.24)",
    boxShadow: "0 30px 72px rgba(2,8,23,0.30)",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "rgba(226,232,240,0.82)",
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
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
    color: "#08111f",
  },

  deviceGrid: (isSmall, isTablet) => ({
    display: "grid",
    gridTemplateColumns: isSmall ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  }),

  deviceCard: {
    minHeight: "330px",
    borderRadius: "30px",
    padding: "22px",
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

  deviceIconWrap: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
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
  },

  deviceType: {
    color: "#7dd3fc",
    fontWeight: 900,
    fontSize: "0.86rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  deviceName: {
    margin: 0,
    fontSize: "1.38rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  deviceDesc: {
    margin: 0,
    color: "rgba(226,232,240,0.82)",
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
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
    color: "#08111f",
  },

  benefitGrid: (isSmall, isTablet) => ({
    display: "grid",
    gridTemplateColumns: isSmall ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  }),

  benefitCard: {
    minHeight: "220px",
    borderRadius: "28px",
    padding: "22px",
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
    color: "rgba(226,232,240,0.82)",
    lineHeight: 1.75,
  },

  actionGrid: (isSmall, isTablet) => ({
    display: "grid",
    gridTemplateColumns: isSmall ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  }),

  actionCard: {
    minHeight: "224px",
    borderRadius: "30px",
    padding: "22px",
    textDecoration: "none",
    color: "#f8fafc",
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
    color: "#7dd3fc",
  },

  actionName: {
    color: "rgba(148,163,184,0.96)",
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
    color: "rgba(226,232,240,0.82)",
    lineHeight: 1.7,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(2,6,23,0.68)",
    backdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    padding: "16px",
  },

  modalCard: {
    width: "min(100%, 470px)",
    borderRadius: "30px",
    padding: "22px",
  },

  modalTopLine: {
    width: "100%",
    height: "4px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
    marginBottom: "18px",
  },

  modalEyebrow: {
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
    color: "rgba(226,232,240,0.82)",
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
    border: "1px solid rgba(96,165,250,0.18)",
    padding: "0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.74)",
    color: "#f8fafc",
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
    border: "1px solid rgba(96,165,250,0.18)",
    padding: "0 92px 0 16px",
    outline: "none",
    background: "rgba(15,23,42,0.74)",
    color: "#f8fafc",
    fontSize: "1rem",
  },

  showBtn: {
    position: "absolute",
    right: "8px",
    height: "38px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
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
    background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 55%, #c084fc 100%)",
    color: "#08111f",
    fontWeight: 900,
    fontSize: "1.02rem",
    cursor: "pointer",
  },
};
