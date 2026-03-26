import { useEffect, useMemo, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

const BRAND = {
  name: "NoComment",
  label: "NoComment Network",
  phoneDisplay: "70411518",
  phoneHref: "tel:70411518",
  whatsapp: "https://wa.me/96170411518",
  facebook: "https://www.facebook.com/nocomment.lb/",
  location:
    "https://www.google.com/search?sca_esv=5c685c3490d49ca4&sxsrf=ANbL-n42jIJIVD_C_u63mQueNeiKVKxulw:1774462014416&kgmid=/g/11v5_5rfkq&q=NoComment-ISP&shem=dlvs1&shndl=30&source=sh/x/loc/uni/m1/1&kgs=83c38a6d71611246&utm_source=dlvs1,sh/x/loc/uni/m1/1",
};

const HERO_SLIDES = [
  {
    eyebrow: "HOME + BUSINESS READY",
    title: ["Packages that", "feel cleaner", "and convert better"],
    text:
      "A real landing rebuild with tighter spacing, cleaner hierarchy, a smaller premium hero, and faster actions for plans, support, and contact.",
    primary: "View Plans",
    secondary: "Support Login",
  },
  {
    eyebrow: "DIRECT CUSTOMER FLOW",
    title: ["Better trust", "Better rhythm", "Better support"],
    text:
      "Plans, devices, and contact paths are organized to feel more serious, more modern, and easier to scan on desktop and mobile.",
    primary: "Why Us",
    secondary: "Call Now",
  },
  {
    eyebrow: "NOC TASTE • CUSTOMER FACE",
    title: ["Dark premium", "Sharp sections", "Zero clutter"],
    text:
      "The page keeps the dark identity but drops the oversized feel, giving you a stronger brand front with cleaner balance.",
    primary: "See Devices",
    secondary: "Open Contact",
  },
];

const STATS = [
  { label: "Coverage", value: "Jabal Mohssen" },
  { label: "Support", value: "Fast response" },
  { label: "Setup", value: "Modem + Router" },
];

const PLANS = [
  {
    name: "Night 8",
    price: "$25",
    speed: "8 Mbps",
    cached: "Up to 30 Mbps cached",
    daily: "8 GB daily",
    monthly: "500 GB monthly",
    badge: "Starter",
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
    daily: "20 GB daily",
    monthly: "1000 GB monthly",
    badge: "Power",
    featured: false,
  },
];

const DEVICES = [
  {
    name: "Fiber Router",
    tag: "Indoor",
    speed: "Stable home coverage",
    text: "Clean hardware setup with dependable indoor performance and simple deployment.",
  },
  {
    name: "Outdoor CPE",
    tag: "Long range",
    speed: "Focused point coverage",
    text: "A stronger option for distance-focused installs where direct signal matters more.",
  },
  {
    name: "Dual Band Modem",
    tag: "Balanced",
    speed: "Daily use ready",
    text: "A practical customer-facing modem profile for homes that need stable everyday service.",
  },
];

const WHY_US = [
  {
    title: "Clear plans",
    text: "Less confusion, stronger pricing rhythm, and cleaner presentation for faster decisions.",
  },
  {
    title: "Real support",
    text: "Direct contact actions, visible support entry, and less friction for customer follow-up.",
  },
  {
    title: "Better first impression",
    text: "A darker premium style with tighter balance so the site feels intentional instead of patched.",
  },
];

function formatClock(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function WifiIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 11.5C11.8 6.2 20.2 6.2 27 11.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M9 16C13.8 12.4 18.2 12.4 23 16"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13 20.2C15.1 18.8 16.9 18.8 19 20.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="24" r="2.1" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 6C10.5 6 6 10.2 6 15.5C6 17.3 6.5 19 7.4 20.4L6.4 26L12.2 24.6C13.4 25.2 14.7 25.5 16 25.5C21.5 25.5 26 21.3 26 16C26 10.7 21.5 6 16 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 13.1C12.8 12.4 13.1 12 13.5 11.8C13.9 11.6 14.1 11.6 14.4 11.6C14.6 11.6 14.8 11.6 15 12.1C15.2 12.6 15.7 13.8 15.8 14C15.9 14.2 16 14.5 15.7 14.8C15.5 15 15.3 15.2 15.1 15.4C14.9 15.5 14.8 15.7 15 16C15.2 16.3 15.8 17.2 16.6 17.8C17.6 18.6 18.5 18.9 18.8 19C19.1 19.1 19.3 19 19.5 18.8C19.7 18.5 20.2 17.9 20.5 17.5C20.7 17.2 21 17.2 21.3 17.3C21.6 17.4 23.1 18.1 23.4 18.2C23.7 18.3 23.9 18.4 24 18.6C24.1 18.8 24.1 19.8 23.3 20.3C22.5 20.8 21.7 21.1 20.8 21C19.9 20.9 18.7 20.5 17.2 19.6C15.4 18.5 13.9 16.7 13.2 15.6C12.6 14.5 12.8 13.6 12.8 13.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M18.7 27V17.1H22L22.5 13.4H18.7V10.9C18.7 9.8 19 9.1 20.6 9.1H22.6V5.8C22.2 5.8 21.1 5.7 19.8 5.7C17 5.7 15.1 7.4 15.1 10.5V13.4H12V17.1H15.1V27H18.7Z"
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

function MenuIcon() {
  return (
    <div className="menu-lines" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function TimeNowBadge() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="time-badge">
      <span className="time-badge-label">Time Now</span>
      <strong className="time-badge-value">{formatClock(now)}</strong>
      <small className="time-badge-date">{formatDay(now)}</small>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="visual-shell">
      <div className="visual-noise" />
      <div className="visual-grid" />

      <TimeNowBadge />

      <div className="visual-float left">
        <span className="float-label">Support</span>
        <strong className="float-value">Direct reply</strong>
      </div>

      <div className="visual-float right">
        <span className="float-label">Hardware</span>
        <strong className="float-value">Modem + Router</strong>
      </div>

      <div className="wifi-stack" aria-hidden="true">
        <span className="wifi-arc a1" />
        <span className="wifi-arc a2" />
        <span className="wifi-arc a3" />
      </div>

      <div className="radar radar-1" />
      <div className="radar radar-2" />
      <div className="radar radar-3" />
      <div className="radar-sweep" />
      <div className="visual-core">
        <span className="core-dot" />
      </div>

      <div className="visual-bottom-row">
        <div className="visual-mini">
          <span>Plans</span>
          <strong>3 Ready</strong>
        </div>
        <div className="visual-mini">
          <span>Style</span>
          <strong>Premium UX</strong>
        </div>
        <div className="visual-mini">
          <span>Access</span>
          <strong>Fast Actions</strong>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan }) {
  return (
    <article className={`plan-card ${plan.featured ? "featured" : ""}`}>
      <div className="card-head">
        <span className="pill">{plan.badge}</span>
        <span className="pill soft">Plan</span>
      </div>

      <h3 className="plan-name">{plan.name}</h3>
      <div className="plan-price">{plan.price}</div>
      <div className="plan-speed">{plan.speed}</div>

      <div className="spec-stack">
        <div className="spec-row">
          <span>Cached</span>
          <strong>{plan.cached}</strong>
        </div>
        <div className="spec-row">
          <span>Daily</span>
          <strong>{plan.daily}</strong>
        </div>
        <div className="spec-row">
          <span>Monthly</span>
          <strong>{plan.monthly}</strong>
        </div>
      </div>

      <a className="card-action" href={BRAND.phoneHref}>
        Request Plan
      </a>
    </article>
  );
}

function DeviceCard({ item }) {
  return (
    <article className="device-card">
      <div className="card-head">
        <span className="pill">{item.tag}</span>
        <span className="pill soft">Device</span>
      </div>

      <h3 className="device-name">{item.name}</h3>
      <strong className="device-speed">{item.speed}</strong>
      <p className="device-text">{item.text}</p>

      <a className="card-action ghost" href={BRAND.phoneHref}>
        Ask About Device
      </a>
    </article>
  );
}

function WhyCard({ item }) {
  return (
    <article className="why-card">
      <div className="why-icon">
        <span />
      </div>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </article>
  );
}

export default function LoginPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = "#020611";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const slide = useMemo(() => HERO_SLIDES[activeSlide], [activeSlide]);

  function openSection(target) {
    if (target === "View Plans") return scrollToId("plans");
    if (target === "See Devices") return scrollToId("devices");
    if (target === "Why Us") return scrollToId("whyus");
    if (target === "Open Contact") return scrollToId("contact");
    if (target === "Support Login") return setShowLogin(true);
    if (target === "Call Now") return window.open(BRAND.phoneHref, "_self");
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setLoginError("");

    window.setTimeout(() => {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        localStorage.setItem(
          "nnc_user",
          JSON.stringify({
            username,
            role: "admin",
            loginAt: new Date().toISOString(),
          })
        );
        setSubmitting(false);
        setShowLogin(false);
        setUsername("");
        setPassword("");
        setShowPassword(false);
        window.location.href = "/";
      } else {
        setSubmitting(false);
        setLoginError("Invalid username or password.");
      }
    }, 700);
  }

  return (
    <div className="landing-shell">
      <style>{`
        :root {
          --bg: #020611;
          --bg-soft: #071126;
          --surface: rgba(10, 16, 33, 0.88);
          --surface-2: rgba(12, 20, 39, 0.84);
          --surface-3: rgba(14, 23, 44, 0.94);
          --line: rgba(120, 170, 255, 0.14);
          --line-strong: rgba(133, 185, 255, 0.24);
          --text: #f4f7ff;
          --muted: #98a5c3;
          --muted-2: #7483a7;
          --blue: #59c4ff;
          --blue-2: #3d7cff;
          --violet: #8c58ff;
          --cyan-glow: 89, 196, 255;
          --radius-xl: 28px;
          --radius-lg: 22px;
          --radius-md: 16px;
          --shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
          --max: 1180px;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          color: var(--text);
          background:
            radial-gradient(circle at 12% 20%, rgba(0, 106, 255, 0.14), transparent 28%),
            radial-gradient(circle at 82% 18%, rgba(121, 49, 255, 0.12), transparent 24%),
            linear-gradient(180deg, #030713 0%, #020611 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font: inherit;
        }

        button {
          cursor: pointer;
          border: 0;
          background: none;
          color: inherit;
        }

        .landing-shell {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: var(--text);
        }

        .landing-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(62, 118, 255, 0.06) 0%, transparent 18%, transparent 82%, rgba(110, 58, 255, 0.05) 100%),
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.015) 0px,
              rgba(255,255,255,0.015) 1px,
              transparent 1px,
              transparent 4px
            );
          pointer-events: none;
          opacity: 0.7;
        }

        .container {
          width: min(calc(100% - 28px), var(--max));
          margin: 0 auto;
        }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 12px 0 0;
          backdrop-filter: blur(18px);
          background: linear-gradient(180deg, rgba(2, 6, 17, 0.74), rgba(2, 6, 17, 0.28));
        }

        .header-bar {
          min-height: 72px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 10px 0 14px;
        }

        .brand-card {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(13, 22, 42, 0.9), rgba(9, 16, 31, 0.86));
          border: 1px solid var(--line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          min-width: 228px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #8dd8ff;
          background:
            radial-gradient(circle at 50% 50%, rgba(102, 187, 255, 0.24), rgba(60, 119, 255, 0.08) 60%, transparent 72%),
            rgba(255,255,255,0.03);
          border: 1px solid rgba(114, 181, 255, 0.2);
          flex: 0 0 auto;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-label {
          font-size: 0.7rem;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--muted);
          margin-bottom: 5px;
          font-weight: 700;
        }

        .brand-name {
          font-size: 1.28rem;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .nav-shell {
          display: flex;
          justify-content: center;
        }

        .desktop-nav {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(10, 17, 34, 0.76);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .nav-link {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          color: #d8e4ff;
          font-size: 0.94rem;
          font-weight: 700;
          transition: 180ms ease;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .mobile-toggle {
          display: none;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: rgba(10, 17, 34, 0.88);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .menu-lines {
          width: 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0 auto;
        }

        .menu-lines span {
          display: block;
          height: 2px;
          border-radius: 999px;
          background: #eaf2ff;
        }

        .ghost-btn,
        .primary-btn,
        .card-action {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }

        .ghost-btn {
          color: #e7efff;
          background: linear-gradient(180deg, rgba(18, 28, 49, 0.92), rgba(11, 18, 35, 0.92));
          border: 1px solid var(--line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .primary-btn,
        .card-action {
          color: #f7fbff;
          background:
            linear-gradient(135deg, rgba(62, 123, 255, 0.96), rgba(85, 198, 255, 0.96));
          border: 1px solid rgba(112, 181, 255, 0.34);
          box-shadow:
            0 10px 28px rgba(57, 128, 255, 0.18),
            inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .ghost-btn:hover,
        .primary-btn:hover,
        .card-action:hover {
          transform: translateY(-1px);
        }

        .mobile-menu {
          display: none;
          margin-top: 10px;
          padding: 12px;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: rgba(8, 13, 27, 0.95);
          box-shadow: var(--shadow);
        }

        .mobile-link {
          width: 100%;
          min-height: 42px;
          text-align: left;
          padding: 0 12px;
          border-radius: 12px;
          color: #ecf3ff;
          font-weight: 700;
        }

        .mobile-link:hover {
          background: rgba(255,255,255,0.04);
        }

        main {
          position: relative;
          z-index: 1;
        }

        .hero {
          padding: 22px 0 14px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.03fr 0.97fr;
          gap: 18px;
          align-items: stretch;
        }

        .hero-copy,
        .hero-visual-wrap {
          border-radius: 28px;
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(9, 16, 31, 0.9), rgba(6, 11, 23, 0.95));
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }

        .hero-copy {
          padding: 28px;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hero-copy::before,
        .hero-visual-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(57, 146, 255, 0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(127, 58, 255, 0.08), transparent 28%);
          pointer-events: none;
        }

        .eyebrow,
        .section-eyebrow {
          min-height: 30px;
          width: fit-content;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(124, 173, 255, 0.18);
          background: rgba(16, 26, 47, 0.76);
          font-size: 0.68rem;
          line-height: 1;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #dbe7ff;
          font-weight: 800;
        }

        .hero-title {
          margin: 16px 0 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: clamp(2.3rem, 4.7vw, 4.8rem);
          line-height: 0.93;
          letter-spacing: -0.055em;
          max-width: 8.4ch;
          font-weight: 900;
        }

        .hero-title .accent {
          background: linear-gradient(90deg, #8fdfff 0%, #75a4ff 52%, #af8eff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-text {
          max-width: 52ch;
          margin: 0 0 20px;
          color: var(--muted);
          font-size: 0.98rem;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip-btn {
          min-height: 44px;
        }

        .hero-stats {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .stat-card {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(15, 23, 43, 0.82), rgba(10, 16, 31, 0.88));
        }

        .stat-card span {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--muted-2);
          margin-bottom: 8px;
          font-weight: 800;
        }

        .stat-card strong {
          font-size: 1rem;
          line-height: 1.2;
        }

        .slide-dots {
          margin-top: 18px;
          display: flex;
          gap: 8px;
        }

        .slide-dot {
          width: 34px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.04);
          transition: 180ms ease;
        }

        .slide-dot.active {
          width: 52px;
          background: linear-gradient(90deg, rgba(94, 187, 255, 1), rgba(135, 110, 255, 1));
        }

        .hero-visual-wrap {
          min-height: 600px;
          padding: 18px;
        }

        .visual-shell {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 562px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(112, 168, 255, 0.12);
          background:
            radial-gradient(circle at 50% 28%, rgba(65, 168, 255, 0.12), transparent 22%),
            radial-gradient(circle at 18% 82%, rgba(106, 53, 255, 0.10), transparent 20%),
            linear-gradient(180deg, rgba(4, 9, 20, 0.95), rgba(3, 7, 16, 0.98));
        }

        .visual-noise,
        .visual-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .visual-noise {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), transparent 16%, transparent 84%, rgba(255,255,255,0.015)),
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.012) 0px,
              rgba(255,255,255,0.012) 1px,
              transparent 1px,
              transparent 4px
            );
          opacity: 0.8;
        }

        .visual-grid {
          background-image:
            linear-gradient(rgba(95, 157, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(95, 157, 255, 0.06) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black 45%, transparent 88%);
          opacity: 0.45;
        }

        .time-badge {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 3;
          min-width: 146px;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(11, 18, 35, 0.84);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .time-badge-label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--muted-2);
          margin-bottom: 7px;
          font-weight: 800;
        }

        .time-badge-value {
          display: block;
          font-size: 1.18rem;
          line-height: 1;
          color: white;
          margin-bottom: 5px;
        }

        .time-badge-date {
          display: block;
          font-size: 0.78rem;
          color: var(--muted);
        }

        .visual-float {
          position: absolute;
          z-index: 3;
          min-width: 138px;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(11, 18, 35, 0.82);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .visual-float.left {
          left: 18px;
          top: 52%;
          transform: translateY(-50%);
        }

        .visual-float.right {
          right: 18px;
          top: 39%;
        }

        .float-label {
          display: block;
          margin-bottom: 7px;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--muted-2);
          font-weight: 800;
        }

        .float-value {
          font-size: 0.98rem;
          line-height: 1.25;
        }

        .wifi-stack {
          position: absolute;
          top: 105px;
          left: 50%;
          transform: translateX(-50%);
          width: min(82%, 320px);
          height: 158px;
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .wifi-arc {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          border-top-left-radius: 999px;
          border-top-right-radius: 999px;
          border-bottom: 0;
          background: transparent;
        }

        .wifi-arc.a1 {
          width: 320px;
          height: 158px;
          border: 10px solid rgba(68, 193, 255, 0.94);
          border-bottom: 0;
        }

        .wifi-arc.a2 {
          width: 250px;
          height: 122px;
          top: 26px;
          border: 9px solid rgba(66, 120, 255, 0.96);
          border-bottom: 0;
        }

        .wifi-arc.a3 {
          width: 178px;
          height: 82px;
          top: 60px;
          border: 8px solid rgba(144, 84, 255, 0.96);
          border-bottom: 0;
        }

        .radar,
        .radar-sweep,
        .visual-core {
          position: absolute;
          left: 50%;
          top: 60%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
        }

        .radar {
          border: 1px solid rgba(103, 161, 255, 0.12);
        }

        .radar-1 {
          width: 320px;
          height: 320px;
        }

        .radar-2 {
          width: 220px;
          height: 220px;
        }

        .radar-3 {
          width: 134px;
          height: 134px;
        }

        .radar-sweep {
          width: 320px;
          height: 320px;
          background: conic-gradient(
            from 210deg,
            transparent 0deg,
            rgba(58, 197, 255, 0.18) 34deg,
            rgba(58, 197, 255, 0.06) 72deg,
            transparent 105deg
          );
          filter: blur(2px);
          animation: sweep 8s linear infinite;
          mask-image: radial-gradient(circle at center, transparent 0 24%, black 44%);
        }

        @keyframes sweep {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .visual-core {
          width: 78px;
          height: 78px;
          background:
            radial-gradient(circle at 50% 50%, rgba(140, 90, 255, 0.34), rgba(40, 76, 168, 0.16) 55%, transparent 72%);
          border: 1px solid rgba(93, 157, 255, 0.2);
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .core-dot {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #c9e7ff, #8f72ff);
          box-shadow: 0 0 18px rgba(120, 161, 255, 0.55);
        }

        .visual-bottom-row {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          z-index: 3;
        }

        .visual-mini {
          min-height: 84px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(11, 18, 35, 0.84);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .visual-mini span {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--muted-2);
          font-weight: 800;
        }

        .visual-mini strong {
          font-size: 1rem;
          line-height: 1.2;
        }

        .section {
          padding: 18px 0;
        }

        .section-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 400px);
          gap: 20px;
          align-items: end;
          margin-bottom: 16px;
        }

        .section-title {
          margin: 12px 0 0;
          font-size: clamp(1.6rem, 2.5vw, 2.55rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .section-text {
          margin: 0;
          color: var(--muted);
          line-height: 1.7;
          font-size: 0.96rem;
        }

        .plans-grid,
        .devices-grid,
        .why-grid {
          display: grid;
          gap: 12px;
        }

        .plans-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .devices-grid,
        .why-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .plan-card,
        .device-card,
        .why-card,
        .contact-card,
        .footer-card {
          border-radius: 22px;
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(11, 18, 35, 0.9), rgba(7, 12, 24, 0.96));
          box-shadow: var(--shadow);
        }

        .plan-card,
        .device-card {
          padding: 18px;
        }

        .why-card {
          padding: 18px;
          min-height: 190px;
        }

        .plan-card.featured {
          border-color: rgba(102, 173, 255, 0.3);
          box-shadow:
            0 18px 60px rgba(33, 80, 171, 0.24),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .pill {
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 33, 60, 0.94);
          border: 1px solid rgba(116, 170, 255, 0.16);
          color: #e6f0ff;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-weight: 800;
        }

        .pill.soft {
          color: var(--muted);
          background: rgba(255,255,255,0.03);
        }

        .plan-name,
        .device-name,
        .why-card h3 {
          margin: 0 0 8px;
          font-size: 1.24rem;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        .plan-price {
          font-size: 1.85rem;
          line-height: 1;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .plan-speed,
        .device-speed {
          display: block;
          color: #b9d6ff;
          font-size: 0.98rem;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .device-text,
        .why-card p {
          margin: 0;
          color: var(--muted);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .spec-stack {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
        }

        .spec-row {
          min-height: 44px;
          padding: 0 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .spec-row span {
          color: var(--muted);
          font-size: 0.9rem;
        }

        .spec-row strong {
          font-size: 0.9rem;
          text-align: right;
        }

        .card-action {
          width: 100%;
        }

        .card-action.ghost {
          background: linear-gradient(180deg, rgba(18, 28, 49, 0.92), rgba(11, 18, 35, 0.92));
          border: 1px solid var(--line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .why-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          background:
            radial-gradient(circle at center, rgba(90, 196, 255, 0.28), rgba(52, 101, 255, 0.1) 60%, transparent 72%);
          border: 1px solid rgba(110, 173, 255, 0.2);
        }

        .why-icon span {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(180deg, #8ddfff, #7d6fff);
          display: block;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .contact-card {
          padding: 18px;
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 14px;
        }

        .contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(114, 171, 255, 0.18);
          background: rgba(255,255,255,0.03);
          color: #dcebff;
        }

        .contact-copy strong {
          display: block;
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .contact-copy span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .footer {
          padding: 18px 0 28px;
        }

        .footer-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: center;
        }

        .footer-card strong {
          font-size: 1rem;
        }

        .footer-card span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(1, 4, 12, 0.72);
          backdrop-filter: blur(12px);
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .modal {
          width: min(100%, 480px);
          border-radius: 24px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(10, 17, 34, 0.98), rgba(7, 12, 24, 0.98));
          box-shadow: var(--shadow);
          padding: 22px;
        }

        .modal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .modal-title {
          margin: 0 0 8px;
          font-size: 1.45rem;
          line-height: 1;
        }

        .modal-text,
        .demo-note {
          margin: 0;
          color: var(--muted);
          line-height: 1.65;
          font-size: 0.94rem;
        }

        .close-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.03);
          font-size: 1.25rem;
          line-height: 1;
        }

        .field {
          margin-bottom: 14px;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          color: #dde9ff;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .field input {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid var(--line);
          outline: none;
          padding: 0 14px;
          color: var(--text);
          background: rgba(255,255,255,0.03);
        }

        .field input:focus {
          border-color: rgba(117, 175, 255, 0.34);
          box-shadow: 0 0 0 4px rgba(70, 135, 255, 0.08);
        }

        .password-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .password-toggle {
          min-width: 74px;
          min-height: 48px;
          padding: 0 12px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.03);
          font-weight: 700;
        }

        .error-box {
          min-height: 44px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          border-radius: 14px;
          border: 1px solid rgba(255, 99, 132, 0.26);
          background: rgba(255, 70, 110, 0.08);
          color: #ffd7e2;
          margin-bottom: 14px;
          font-size: 0.92rem;
        }

        .login-submit {
          width: 100%;
          margin-bottom: 12px;
        }

        .side-socials {
          position: fixed;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 10;
        }

        .social-link {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: rgba(10, 17, 34, 0.84);
          color: #ecf3ff;
          display: grid;
          place-items: center;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .social-link:hover {
          background: rgba(255,255,255,0.06);
        }

        @media (max-width: 1180px) {
          .hero-grid,
          .section-head,
          .plans-grid,
          .devices-grid,
          .why-grid {
            grid-template-columns: 1fr;
          }

          .hero-copy,
          .hero-visual-wrap {
            min-height: auto;
          }

          .hero-title {
            max-width: 10ch;
          }

          .hero-visual-wrap {
            padding: 14px;
          }

          .visual-shell {
            min-height: 480px;
          }

          .visual-float.left {
            top: 56%;
          }

          .visual-float.right {
            top: 38%;
          }

          .side-socials {
            display: none;
          }
        }

        @media (max-width: 860px) {
          .header-bar {
            grid-template-columns: 1fr auto;
          }

          .nav-shell,
          .header-actions .ghost-btn,
          .header-actions .primary-btn {
            display: none;
          }

          .mobile-toggle {
            display: inline-grid;
            place-items: center;
          }

          .mobile-menu {
            display: grid;
            gap: 6px;
          }

          .hero-copy {
            padding: 22px;
          }

          .hero-title {
            font-size: clamp(2rem, 9vw, 3.2rem);
          }

          .hero-stats,
          .visual-bottom-row {
            grid-template-columns: 1fr;
          }

          .visual-shell {
            min-height: 440px;
          }

          .wifi-stack {
            width: min(86%, 240px);
            height: 112px;
            top: 88px;
          }

          .wifi-arc.a1 {
            width: 236px;
            height: 112px;
            border-width: 8px;
          }

          .wifi-arc.a2 {
            width: 184px;
            height: 88px;
            top: 20px;
            border-width: 7px;
          }

          .wifi-arc.a3 {
            width: 128px;
            height: 56px;
            top: 46px;
            border-width: 6px;
          }

          .radar-1,
          .radar-sweep {
            width: 230px;
            height: 230px;
          }

          .radar-2 {
            width: 164px;
            height: 164px;
          }

          .radar-3 {
            width: 106px;
            height: 106px;
          }

          .visual-core {
            width: 64px;
            height: 64px;
          }

          .visual-float {
            min-width: 118px;
            padding: 10px 12px;
          }

          .visual-float.left {
            left: 12px;
          }

          .visual-float.right {
            right: 12px;
          }

          .time-badge {
            top: 12px;
            left: 12px;
            min-width: 128px;
            padding: 10px 12px;
          }

          .contact-card {
            grid-template-columns: 40px 1fr;
          }

          .contact-card .card-action,
          .contact-card .ghost-btn,
          .contact-card .primary-btn,
          .contact-card a:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 560px) {
          .container {
            width: min(calc(100% - 18px), var(--max));
          }

          .brand-card {
            min-width: 0;
            padding: 9px 12px;
          }

          .brand-name {
            font-size: 1.08rem;
          }

          .hero {
            padding-top: 16px;
          }

          .hero-copy,
          .hero-visual-wrap,
          .plan-card,
          .device-card,
          .why-card,
          .contact-card,
          .footer-card,
          .modal {
            border-radius: 20px;
          }

          .hero-copy {
            padding: 18px;
          }

          .hero-title {
            font-size: clamp(1.9rem, 10vw, 2.8rem);
          }

          .hero-text,
          .section-text,
          .device-text,
          .why-card p,
          .modal-text,
          .demo-note {
            font-size: 0.92rem;
          }

          .visual-shell {
            min-height: 420px;
          }

          .visual-float {
            min-width: 104px;
          }
        }
      `}</style>

      <div className="side-socials">
        <a className="social-link" href={BRAND.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
        </a>
        <a className="social-link" href={BRAND.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
          <FacebookIcon />
        </a>
        <a className="social-link" href={BRAND.location} target="_blank" rel="noreferrer" aria-label="Location">
          <LocationIcon />
        </a>
      </div>

      <header className="site-header">
        <div className="container">
          <div className="header-bar">
            <div className="brand-card">
              <div className="brand-icon">
                <WifiIcon size={18} />
              </div>
              <div className="brand-copy">
                <span className="brand-label">{BRAND.label}</span>
                <strong className="brand-name">{BRAND.name}</strong>
              </div>
            </div>

            <div className="nav-shell">
              <nav className="desktop-nav">
                <button className="nav-link" onClick={() => scrollToId("home")}>Home</button>
                <button className="nav-link" onClick={() => scrollToId("plans")}>Plans</button>
                <button className="nav-link" onClick={() => scrollToId("devices")}>Devices</button>
                <button className="nav-link" onClick={() => scrollToId("whyus")}>Why Us</button>
                <button className="nav-link" onClick={() => scrollToId("contact")}>Contact</button>
              </nav>
            </div>

            <div className="header-actions">
              <button className="ghost-btn" onClick={() => setShowLogin(true)}>
                Support Login
              </button>
              <a className="primary-btn" href={BRAND.phoneHref}>
                Call Now
              </a>
              <button
                className="mobile-toggle"
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MenuIcon />
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="mobile-menu">
              <button className="mobile-link" onClick={() => { setMenuOpen(false); scrollToId("home"); }}>Home</button>
              <button className="mobile-link" onClick={() => { setMenuOpen(false); scrollToId("plans"); }}>Plans</button>
              <button className="mobile-link" onClick={() => { setMenuOpen(false); scrollToId("devices"); }}>Devices</button>
              <button className="mobile-link" onClick={() => { setMenuOpen(false); scrollToId("whyus"); }}>Why Us</button>
              <button className="mobile-link" onClick={() => { setMenuOpen(false); scrollToId("contact"); }}>Contact</button>
              <button className="ghost-btn" onClick={() => { setMenuOpen(false); setShowLogin(true); }}>
                Support Login
              </button>
              <a className="primary-btn" href={BRAND.phoneHref}>Call Now</a>
            </div>
          )}
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div>
                <div className="eyebrow">{slide.eyebrow}</div>

                <h1 className="hero-title">
                  <span>{slide.title[0]}</span>
                  <span>{slide.title[1]}</span>
                  <span className="accent">{slide.title[2]}</span>
                </h1>

                <p className="hero-text">{slide.text}</p>

                <div className="hero-actions">
                  <button className="primary-btn chip-btn" onClick={() => openSection(slide.primary)}>
                    {slide.primary}
                  </button>
                  <button className="ghost-btn chip-btn" onClick={() => openSection(slide.secondary)}>
                    {slide.secondary}
                  </button>
                </div>

                <div className="hero-stats">
                  {STATS.map((item) => (
                    <div className="stat-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="slide-dots" aria-label="Hero slide selection">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    className={`slide-dot ${index === activeSlide ? "active" : ""}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="hero-visual-wrap">
              <HeroVisual />
            </div>
          </div>
        </section>

        <section id="plans" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Packages</div>
                <h2 className="section-title">Plans that feel easier to scan, compare, and sell.</h2>
              </div>
              <p className="section-text">
                Better hierarchy, cleaner cards, stronger featured plan focus, and less oversized noise.
              </p>
            </div>

            <div className="plans-grid">
              {PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        <section id="devices" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Devices</div>
                <h2 className="section-title">Hardware presented with a cleaner premium rhythm.</h2>
              </div>
              <p className="section-text">
                Better spacing, cleaner text density, and more believable product cards for real customer use.
              </p>
            </div>

            <div className="devices-grid">
              {DEVICES.map((item) => (
                <DeviceCard key={item.name} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section id="whyus" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Why Us</div>
                <h2 className="section-title">A stronger first impression without fake visual overload.</h2>
              </div>
              <p className="section-text">
                This rebuild keeps the dark premium feel, but tightens the page so it looks serious instead of inflated.
              </p>
            </div>

            <div className="why-grid">
              {WHY_US.map((item) => (
                <WhyCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Contact</div>
                <h2 className="section-title">Fast ways in. No wasted movement.</h2>
              </div>
              <p className="section-text">
                Support, location, and direct call actions are placed where they are useful, not where they just fill space.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon">
                  <WhatsAppIcon />
                </div>
                <div className="contact-copy">
                  <strong>WhatsApp Support</strong>
                  <span>Direct message for customer follow-up and support questions.</span>
                </div>
                <a className="card-action" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
                  Open WhatsApp
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon">
                  <LocationIcon />
                </div>
                <div className="contact-copy">
                  <strong>Our Location</strong>
                  <span>Open the map result and go directly to the business location.</span>
                </div>
                <a className="card-action ghost" href={BRAND.location} target="_blank" rel="noreferrer">
                  Open Map
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon">
                  <WifiIcon />
                </div>
                <div className="contact-copy">
                  <strong>Support Login</strong>
                  <span>Open the frontend demo login flow used in your current project setup.</span>
                </div>
                <button className="card-action" onClick={() => setShowLogin(true)}>
                  Open Login
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-card">
            <strong>{BRAND.name} — Real landing rebuild</strong>
            <span>Smaller hero • live clock • cleaner hierarchy • stronger premium feel</span>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2 className="modal-title">Support Login</h2>
                <p className="modal-text">
                  Clean modal flow with stronger spacing and a more serious visual tone.
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowLogin(false)} aria-label="Close login">
                ×
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter username"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="password-row">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError ? <div className="error-box">{loginError}</div> : null}

              <button className="primary-btn login-submit" type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Login"}
              </button>

              <p className="demo-note">
                This keeps your current frontend demo-login behavior for compatibility. Backend auth can be connected later.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
