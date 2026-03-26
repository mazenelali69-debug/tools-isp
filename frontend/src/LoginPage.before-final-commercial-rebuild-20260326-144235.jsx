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
    "https://www.google.com/search?q=Lebanon+North+Lebanon+Jabal+Mohssen+NoComment+ISP",
};

const HERO_SLIDES = [
  {
    eyebrow: "PREMIUM INTERNET ACCESS",
    titleTop: "Reliable internet",
    titleMid: "Clear packages",
    titleAccent: "Direct support",
    text:
      "A premium landing experience built with calmer visuals, stronger spacing, and cleaner hierarchy for customers who want fast decisions without clutter.",
    primary: "View Plans",
    secondary: "Support Login",
  },
  {
    eyebrow: "HOME + BUSINESS READY",
    titleTop: "Stronger coverage",
    titleMid: "Better hardware",
    titleAccent: "Faster reach",
    text:
      "Plans, devices, and contact paths are arranged into a cleaner customer flow that feels polished on desktop and mobile.",
    primary: "See Devices",
    secondary: "Call Now",
  },
  {
    eyebrow: "MODERN CUSTOMER FLOW",
    titleTop: "Sharper design",
    titleMid: "Cleaner structure",
    titleAccent: "Built to convert",
    text:
      "This rebuild focuses on better trust, better balance, and a more premium first impression without noisy sections or oversized blocks.",
    primary: "Open Contact",
    secondary: "Support Login",
  },
];

const STATS = [
  { label: "Coverage Area", value: "Lebanon, North Lebanon, Jabal Mohssen" },
  { label: "Support Access", value: "Direct response" },
  { label: "Service Style", value: "Premium customer flow" },
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
    desc: "Stable WAN handoff with reliable line sync and a clean customer installation flow.",
    features: ["WAN Ready", "Stable Sync", "Easy Setup"],
  },
  {
    name: "Wi-Fi Router",
    type: "Router",
    tag: "Popular",
    price: "$30",
    desc: "Better indoor wireless coverage for homes, apartments, and everyday multi-device usage.",
    features: ["Better Range", "Multi Device", "Home Use"],
  },
  {
    name: "Outdoor Receiver",
    type: "Receiver",
    tag: "Long Range",
    price: "$45",
    desc: "Stronger signal capture for rooftops, difficult angles, and longer wireless paths.",
    features: ["Outdoor", "Long Reach", "Better Capture"],
  },
  {
    name: "Mesh Extension",
    type: "Extension",
    tag: "Coverage",
    price: "$40",
    desc: "Extend wireless coverage across larger homes and multi-floor customer environments.",
    features: ["Mesh Ready", "Multi Floor", "Coverage Boost"],
  },
  {
    name: "Dual Band CPE",
    type: "Receiver",
    tag: "Home Ready",
    price: "$35",
    desc: "Dual-band customer hardware built for stable residential installs and clean signal delivery.",
    features: ["2.4G + 5G", "Stable Link", "Clean Install"],
  },
  {
    name: "Business Router",
    type: "Router",
    tag: "Business",
    price: "$60",
    desc: "Better traffic control, stronger office stability, and cleaner business networking.",
    features: ["Office Ready", "Reliable", "Better Control"],
  },
];

const BENEFITS = [
  {
    title: "Better first impression",
    text: "A sharper landing flow that feels intentional from the first second.",
  },
  {
    title: "Clearer packages",
    text: "Pricing and package details are easier to scan, compare, and understand.",
  },
  {
    title: "Stronger hardware display",
    text: "Devices look like premium sellable products instead of random floating cards.",
  },
  {
    title: "Faster customer actions",
    text: "Call, contact, and support access stay visible and easier to reach.",
  },
];

const CONTACT_ACTIONS = [
  {
    title: "WhatsApp",
    value: "Chat directly now",
    hint: "Fast support path",
    href: BRAND.whatsapp,
  },
  {
    title: "Facebook",
    value: "Visit our page",
    hint: "See updates and service info",
    href: BRAND.facebook,
  },
  {
    title: "Location",
    value: "Open location",
    hint: "Lebanon, North Lebanon, Jabal Mohssen",
    href: BRAND.location,
  },
];

function formatLiveClock(date) {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);

  const fullDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  return { time, day, fullDate };
}

function getDayPeriod(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function getUiWeatherState(date) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 17) {
    return {
      label: "Clear outlook",
      sub: "Good daytime visibility",
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      label: "Soft evening",
      sub: "Calm outdoor conditions",
    };
  }
  return {
    label: "Quiet night",
    sub: "Stable late-hour atmosphere",
  };
}

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

function WifiIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M6 12.4C12.4 7.4 19.6 7.4 26 12.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 17C14.2 13.8 17.8 13.8 22 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13.8 21.4C15.2 20.3 16.8 20.3 18.2 21.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="25" r="1.9" fill="currentColor" />
    </svg>
  );
}

function ClockIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 10.5V16L20 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 4.5V8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 24V27.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4.5 16H8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 16H27.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.8 7.8L10.3 10.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21.7 21.7L24.2 24.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24.2 7.8L21.7 10.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10.3 21.7L7.8 24.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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

function ContactIcon({ title }) {
  if (title === "WhatsApp") return <WhatsAppIcon />;
  if (title === "Facebook") return <FacebookIcon />;
  return <LocationIcon />;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <div className="brand-mark-inner">
        <WifiIcon size={20} />
      </div>
    </div>
  );
}

function RadarVisual() {
  return (
    <div className="radar-shell">
      <div className="radar-grid" />
      <div className="radar-noise" />

      <div className="radar-ring ring-1" />
      <div className="radar-ring ring-2" />
      <div className="radar-ring ring-3" />
      <div className="radar-sweep" />

      <div className="radar-cross radar-cross-h" />
      <div className="radar-cross radar-cross-v" />

      <div className="radar-core">
        <div className="radar-core-inner">
          <span className="core-dot" />
        </div>
      </div>

      <div className="radar-signal top-left">
        <span className="signal-label">Signal Layer</span>
        <strong className="signal-value">Stable</strong>
      </div>

      <div className="radar-signal bottom-right">
        <span className="signal-label">Coverage Focus</span>
        <strong className="signal-value">North Lebanon</strong>
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      :root {
        --bg: #030712;
        --bg-2: #07111f;
        --surface: rgba(10, 18, 33, 0.76);
        --surface-2: rgba(12, 22, 38, 0.9);
        --surface-3: rgba(255,255,255,0.04);
        --line: rgba(148, 163, 184, 0.13);
        --line-strong: rgba(125, 211, 252, 0.28);
        --text: #f8fafc;
        --muted: #94a3b8;
        --muted-2: #cbd5e1;
        --cyan: #67e8f9;
        --blue: #60a5fa;
        --violet: #a855f7;
        --green: #22c55e;
        --danger: #fb7185;
        --shadow: 0 26px 70px rgba(2, 8, 23, 0.42);
        --radius-xl: 32px;
        --radius-lg: 24px;
        --radius-md: 18px;
        --max: 1280px;
      }

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(96,165,250,.08), transparent 26%),
          radial-gradient(circle at top right, rgba(168,85,247,.08), transparent 22%),
          linear-gradient(180deg, #030712 0%, #08111f 52%, #030712 100%);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a { color: inherit; text-decoration: none; }
      button, input { font: inherit; }

      .page {
        position: relative;
        min-height: 100vh;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 14% 18%, rgba(56,189,248,.08), transparent 24%),
          radial-gradient(circle at 86% 12%, rgba(168,85,247,.08), transparent 20%),
          radial-gradient(circle at 50% 100%, rgba(96,165,250,.08), transparent 22%),
          linear-gradient(180deg, #030712 0%, #08111f 50%, #030712 100%);
      }

      .page::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .05;
        background-image:
          linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: radial-gradient(circle at center, rgba(0,0,0,.95), transparent 100%);
      }

      .container {
        width: min(calc(100% - 32px), var(--max));
        margin: 0 auto;
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(16px);
        background: linear-gradient(180deg, rgba(3,7,18,.86), rgba(3,7,18,.52));
        border-bottom: 1px solid rgba(148,163,184,.08);
      }

      .header-inner {
        width: min(calc(100% - 32px), var(--max));
        margin: 0 auto;
        min-height: 84px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .brand {
        border: 0;
        background: transparent;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .brand-mark {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(103,232,249,.22), rgba(168,85,247,.18));
        box-shadow: 0 14px 30px rgba(2,8,23,.3);
      }

      .brand-mark-inner {
        width: 100%;
        height: 100%;
        border-radius: 17px;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, rgba(13,20,36,.98), rgba(8,14,26,.98));
        color: var(--cyan);
      }

      .brand-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
      }

      .brand-kicker {
        font-size: .67rem;
        letter-spacing: .18em;
        text-transform: uppercase;
        font-weight: 800;
        color: var(--muted);
      }

      .brand-name {
        font-size: 1rem;
        font-weight: 900;
        letter-spacing: .02em;
        color: var(--text);
      }

      .nav {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.03);
      }

      .nav button,
      .mobile-link {
        min-height: 42px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--muted-2);
        cursor: pointer;
        font-weight: 700;
        transition: background .18s ease, color .18s ease, transform .18s ease;
      }

      .nav button:hover,
      .mobile-link:hover {
        background: rgba(255,255,255,.05);
        color: var(--text);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ghost-btn,
      .primary-btn,
      .menu-btn,
      .card-action,
      .chip-btn,
      .close-btn,
      .password-toggle {
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease, opacity .18s ease;
      }

      .ghost-btn,
      .primary-btn,
      .menu-btn,
      .chip-btn {
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        font-weight: 800;
        cursor: pointer;
        border: 1px solid var(--line);
      }

      .ghost-btn,
      .menu-btn,
      .chip-btn {
        background: rgba(255,255,255,.04);
        color: var(--text);
      }

      .primary-btn {
        background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(96,165,250,.14));
        border-color: rgba(125,211,252,.25);
        color: var(--text);
        box-shadow: 0 16px 34px rgba(2,8,23,.26);
      }

      .ghost-btn:hover,
      .menu-btn:hover,
      .chip-btn:hover,
      .card-action:hover,
      .close-btn:hover,
      .password-toggle:hover {
        transform: translateY(-1px);
        border-color: var(--line-strong);
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        border-color: var(--line-strong);
        box-shadow: 0 18px 40px rgba(56,189,248,.16);
      }

      .menu-btn {
        width: 48px;
        display: none;
        place-items: center;
        padding: 0;
      }

      .menu-lines {
        width: 18px;
        display: grid;
        gap: 4px;
      }

      .menu-lines span {
        display: block;
        height: 2px;
        border-radius: 999px;
        background: #fff;
      }

      .mobile-menu {
        display: none;
        width: min(calc(100% - 32px), var(--max));
        margin: 0 auto 16px;
        padding: 14px;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(15,23,42,.92), rgba(8,14,26,.95));
        box-shadow: var(--shadow);
        flex-direction: column;
        gap: 10px;
      }

      .social-rail {
        position: fixed;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 70;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .social-link {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        color: #fff;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        backdrop-filter: blur(16px);
        box-shadow: 0 18px 36px rgba(2,8,23,.24);
      }

      .social-link:hover {
        transform: translateY(-2px);
        border-color: var(--line-strong);
      }

      .hero {
        padding: 42px 0 24px;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: 1.02fr .98fr;
        gap: 28px;
        align-items: stretch;
      }

      .glass-card,
      .hero-copy,
      .hero-visual-wrap,
      .plan-card,
      .device-card,
      .benefit-card,
      .contact-card,
      .status-card {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(14,22,38,.8), rgba(8,14,26,.9));
        backdrop-filter: blur(16px);
        box-shadow: var(--shadow);
      }

      .hero-copy {
        border-radius: 34px;
        padding: 34px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 740px;
      }

      .eyebrow,
      .section-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 34px;
        width: fit-content;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--muted-2);
        font-size: .72rem;
        font-weight: 900;
        letter-spacing: .18em;
        text-transform: uppercase;
      }

      .hero-title {
        margin: 22px 0 16px;
        display: grid;
        gap: 8px;
        line-height: .95;
        letter-spacing: -.045em;
        font-weight: 950;
      }

      .hero-title .line {
        font-size: clamp(2.5rem, 5vw, 5.15rem);
      }

      .hero-title .accent {
        background: linear-gradient(135deg, #f8fafc 0%, #7dd3fc 42%, #c084fc 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .hero-text {
        max-width: 58ch;
        margin: 0 0 28px;
        font-size: 1.03rem;
        line-height: 1.82;
        color: var(--muted);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .hero-stats {
        margin-top: 26px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .stat-card {
        min-height: 118px;
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
      }

      .stat-card span {
        display: block;
        font-size: .72rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        margin-bottom: 10px;
      }

      .stat-card strong {
        display: block;
        font-size: .98rem;
        line-height: 1.55;
        font-weight: 900;
        color: var(--text);
      }

      .slide-dots {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 28px;
      }

      .slide-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.08);
        cursor: pointer;
        padding: 0;
        transition: transform .18s ease, background .18s ease, border-color .18s ease;
      }

      .slide-dot.active {
        width: 30px;
        border-color: transparent;
        background: linear-gradient(135deg, rgba(56,189,248,.92), rgba(168,85,247,.92));
      }

      .hero-visual-wrap {
        border-radius: 34px;
        padding: 18px;
        min-height: 740px;
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 16px;
      }

      .status-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .status-card {
        min-height: 112px;
        padding: 16px 16px 15px;
        border-radius: 22px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .status-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .status-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.05);
        color: var(--cyan);
      }

      .status-kicker {
        font-size: .69rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
      }

      .status-main {
        margin-top: 10px;
        font-size: 1.2rem;
        line-height: 1.2;
        font-weight: 900;
        color: var(--text);
      }

      .status-sub {
        margin-top: 6px;
        color: var(--muted);
        font-size: .86rem;
        line-height: 1.5;
        font-weight: 700;
      }

      .radar-shell {
        position: relative;
        min-height: 560px;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid rgba(148,163,184,.1);
        background:
          radial-gradient(circle at 50% 50%, rgba(56,189,248,.08), transparent 24%),
          radial-gradient(circle at 50% 50%, rgba(96,165,250,.04), transparent 40%),
          linear-gradient(180deg, rgba(8,14,26,.98), rgba(5,10,20,.98));
      }

      .radar-grid,
      .radar-noise {
        position: absolute;
        inset: 0;
      }

      .radar-grid {
        opacity: .07;
        background-image:
          linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      .radar-noise {
        background:
          radial-gradient(circle at 20% 16%, rgba(56,189,248,.08), transparent 14%),
          radial-gradient(circle at 80% 22%, rgba(168,85,247,.07), transparent 12%),
          radial-gradient(circle at 76% 80%, rgba(56,189,248,.08), transparent 10%);
      }

      .radar-ring,
      .radar-core,
      .radar-sweep {
        position: absolute;
        left: 50%;
        top: 52%;
        transform: translate(-50%, -50%);
        border-radius: 999px;
      }

      .radar-ring {
        border: 1px solid rgba(125,211,252,.13);
      }

      .ring-1 { width: 380px; height: 380px; }
      .ring-2 { width: 258px; height: 258px; }
      .ring-3 { width: 150px; height: 150px; }

      .radar-sweep {
        width: 380px;
        height: 380px;
        background:
          conic-gradient(
            from 0deg,
            rgba(0,0,0,0) 0deg,
            rgba(0,0,0,0) 304deg,
            rgba(96,165,250,.10) 338deg,
            rgba(125,211,252,.26) 351deg,
            rgba(255,255,255,.06) 360deg
          );
        animation: sweep 8s linear infinite;
      }

      .radar-cross {
        position: absolute;
        left: 50%;
        top: 52%;
        transform: translate(-50%, -50%);
        opacity: .18;
        background: linear-gradient(90deg, transparent, rgba(125,211,252,.48), transparent);
      }

      .radar-cross-h {
        width: 72%;
        height: 1px;
      }

      .radar-cross-v {
        width: 1px;
        height: 72%;
        background: linear-gradient(180deg, transparent, rgba(125,211,252,.48), transparent);
      }

      .radar-core {
        width: 92px;
        height: 92px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(125,211,252,.18);
        background: linear-gradient(180deg, rgba(14,22,38,.96), rgba(8,14,26,.98));
        box-shadow: 0 0 28px rgba(56,189,248,.08);
        z-index: 3;
      }

      .radar-core-inner {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, rgba(56,189,248,.88), rgba(168,85,247,.82));
      }

      .core-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 0 18px rgba(255,255,255,.34);
        animation: pulse 2.2s ease-in-out infinite;
      }

      .radar-signal {
        position: absolute;
        z-index: 4;
        min-width: 166px;
        padding: 15px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        backdrop-filter: blur(14px);
      }

      .radar-signal.top-left {
        left: 20px;
        top: 20px;
      }

      .radar-signal.bottom-right {
        right: 20px;
        bottom: 20px;
      }

      .signal-label {
        display: block;
        font-size: .68rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        margin-bottom: 8px;
      }

      .signal-value {
        font-size: 1rem;
        font-weight: 900;
        color: var(--text);
      }

      .section {
        padding: 28px 0;
      }

      .section-head {
        display: grid;
        grid-template-columns: 1.08fr .92fr;
        gap: 20px;
        align-items: end;
        margin-bottom: 22px;
      }

      .section-title {
        margin: 14px 0 0;
        font-size: clamp(1.8rem, 3vw, 3rem);
        line-height: 1.06;
        letter-spacing: -.03em;
        font-weight: 950;
      }

      .section-text {
        margin: 0;
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.8;
      }

      .plans-grid,
      .devices-grid,
      .benefits-grid,
      .contact-grid {
        display: grid;
        gap: 16px;
      }

      .plans-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .devices-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .benefits-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .contact-grid { grid-template-columns: 1.15fr .85fr; }

      .plan-card,
      .device-card,
      .benefit-card,
      .contact-card {
        border-radius: 28px;
        padding: 22px;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
      }

      .plan-card:hover,
      .device-card:hover,
      .benefit-card:hover,
      .contact-card:hover {
        transform: translateY(-4px);
        border-color: var(--line-strong);
      }

      .plan-card.featured {
        background:
          radial-gradient(circle at top right, rgba(56,189,248,.10), transparent 26%),
          linear-gradient(180deg, rgba(15,23,42,.92), rgba(8,14,26,.96));
        border-color: rgba(125,211,252,.24);
      }

      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 18px;
      }

      .pill {
        min-height: 34px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--muted-2);
        font-size: .75rem;
        font-weight: 800;
      }

      .plan-name,
      .device-name,
      .benefit-title {
        margin: 0 0 10px;
        font-size: 1.34rem;
        font-weight: 900;
        letter-spacing: -.02em;
      }

      .plan-price {
        font-size: 2.12rem;
        line-height: 1;
        font-weight: 950;
        margin-bottom: 8px;
      }

      .plan-speed,
      .device-type {
        color: #7dd3fc;
        font-weight: 800;
        margin-bottom: 18px;
      }

      .spec-stack {
        display: grid;
        gap: 10px;
        margin-bottom: 18px;
      }

      .spec-row {
        min-height: 48px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
      }

      .spec-row span {
        color: var(--muted);
        font-weight: 700;
      }

      .spec-row strong {
        color: var(--text);
        font-weight: 800;
        text-align: right;
      }

      .device-desc,
      .benefit-text,
      .contact-text {
        color: var(--muted);
        line-height: 1.8;
        margin: 0 0 18px;
      }

      .feature-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 18px;
      }

      .feature-chip {
        min-height: 34px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--muted-2);
        font-size: .75rem;
        font-weight: 800;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: auto;
      }

      .device-price {
        font-size: 1.46rem;
        font-weight: 950;
      }

      .card-action {
        min-height: 46px;
        padding: 0 16px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(125,211,252,.24);
        background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(59,130,246,.12));
        font-weight: 800;
        color: var(--text);
      }

      .benefit-card {
        min-height: 220px;
        display: flex;
        flex-direction: column;
      }

      .benefit-number {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        border: 1px solid rgba(125,211,252,.18);
        background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(168,85,247,.12));
        font-weight: 900;
      }

      .contact-primary {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .contact-list {
        display: grid;
        gap: 12px;
      }

      .contact-link {
        min-height: 78px;
        padding: 16px 18px;
        display: grid;
        grid-template-columns: 48px 1fr auto;
        align-items: center;
        gap: 14px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        transition: transform .18s ease, border-color .18s ease, background .18s ease;
      }

      .contact-link:hover {
        transform: translateY(-2px);
        border-color: var(--line-strong);
      }

      .contact-icon {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.05);
      }

      .contact-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .contact-meta strong {
        font-size: 1rem;
        font-weight: 900;
      }

      .contact-meta span {
        color: var(--muted-2);
        font-weight: 700;
      }

      .contact-meta small {
        color: var(--muted);
        font-weight: 700;
      }

      .contact-arrow {
        color: var(--muted);
        font-size: 1.2rem;
        font-weight: 900;
      }

      .contact-secondary {
        display: grid;
        gap: 16px;
      }

      .contact-block {
        border-radius: 24px;
        padding: 22px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
      }

      .contact-block h3 {
        margin: 0 0 10px;
        font-size: 1.35rem;
        font-weight: 900;
      }

      .contact-block p {
        margin: 0 0 18px;
        color: var(--muted);
        line-height: 1.8;
      }

      .footer {
        padding: 26px 0 52px;
      }

      .footer-card {
        min-height: 90px;
        padding: 20px 22px;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(15,23,42,.72), rgba(8,14,26,.84));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .footer-card span {
        color: var(--muted);
        font-weight: 700;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(2,8,23,.72);
        backdrop-filter: blur(10px);
      }

      .modal {
        width: min(100%, 470px);
        border-radius: 30px;
        padding: 28px;
        border: 1px solid var(--line);
        background:
          radial-gradient(circle at top right, rgba(56,189,248,.08), transparent 22%),
          linear-gradient(180deg, rgba(15,23,42,.96), rgba(8,14,26,.98));
        box-shadow: 0 34px 90px rgba(2,8,23,.50);
      }

      .modal-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
      }

      .modal-title {
        margin: 0 0 6px;
        font-size: 1.75rem;
        font-weight: 950;
        letter-spacing: -.03em;
      }

      .modal-text {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .close-btn {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--text);
        cursor: pointer;
        font-size: 1.15rem;
        font-weight: 900;
      }

      .field {
        display: grid;
        gap: 8px;
        margin-bottom: 14px;
      }

      .field label {
        color: var(--muted-2);
        font-weight: 800;
        font-size: .9rem;
      }

      .field input {
        width: 100%;
        min-height: 54px;
        padding: 0 16px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--text);
        outline: none;
      }

      .field input:focus {
        border-color: var(--line-strong);
        box-shadow: 0 0 0 3px rgba(56,189,248,.08);
      }

      .password-row {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        min-height: 38px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--text);
        cursor: pointer;
        font-weight: 800;
      }

      .error-box {
        min-height: 46px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        border-radius: 14px;
        border: 1px solid rgba(248,113,113,.22);
        background: rgba(127,29,29,.20);
        color: #fecaca;
        font-weight: 700;
        margin: 6px 0 14px;
      }

      .login-submit {
        width: 100%;
        justify-content: center;
      }

      .demo-note {
        margin-top: 14px;
        color: var(--muted);
        font-size: .88rem;
        line-height: 1.7;
      }

      @keyframes sweep {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      @keyframes pulse {
        0% { opacity: .55; box-shadow: 0 0 0 rgba(255,255,255,0); }
        50% { opacity: 1; box-shadow: 0 0 18px rgba(255,255,255,.22); }
        100% { opacity: .55; box-shadow: 0 0 0 rgba(255,255,255,0); }
      }

      @media (max-width: 1200px) {
        .hero-grid,
        .section-head,
        .contact-grid,
        .plans-grid,
        .devices-grid,
        .benefits-grid {
          grid-template-columns: 1fr;
        }

        .hero-copy,
        .hero-visual-wrap {
          min-height: auto;
        }

        .benefits-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 980px) {
        .nav,
        .header-actions {
          display: none;
        }

        .menu-btn {
          display: grid;
        }

        .mobile-menu {
          display: flex;
        }

        .social-rail {
          left: auto;
          right: 16px;
          top: auto;
          bottom: 18px;
          transform: none;
          flex-direction: row;
        }

        .hero {
          padding-top: 24px;
        }

        .plans-grid,
        .devices-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .container,
        .header-inner,
        .mobile-menu {
          width: min(calc(100% - 20px), var(--max));
        }

        .hero-copy,
        .hero-visual-wrap,
        .plan-card,
        .device-card,
        .benefit-card,
        .contact-card,
        .modal {
          padding: 20px;
          border-radius: 24px;
        }

        .hero-title .line {
          font-size: clamp(2.2rem, 11vw, 3.5rem);
        }

        .hero-stats,
        .status-grid,
        .plans-grid,
        .devices-grid,
        .benefits-grid {
          grid-template-columns: 1fr;
        }

        .radar-shell {
          min-height: 460px;
        }

        .ring-1 { width: 280px; height: 280px; }
        .ring-2 { width: 190px; height: 190px; }
        .ring-3 { width: 118px; height: 118px; }
        .radar-sweep { width: 280px; height: 280px; }

        .contact-link {
          grid-template-columns: 48px 1fr;
        }

        .contact-arrow {
          display: none;
        }

        .footer-card {
          align-items: flex-start;
        }

        .radar-signal {
          min-width: 0;
          max-width: 170px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .radar-sweep,
        .core-dot {
          animation: none !important;
        }

        .plan-card,
        .device-card,
        .benefit-card,
        .contact-card,
        .social-link,
        .primary-btn,
        .ghost-btn,
        .card-action,
        .chip-btn,
        .slide-dot {
          transition: none !important;
        }
      }
    `}</style>
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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    document.body.style.background = "#030712";
    document.body.style.margin = "0";
    return () => {
      document.body.style.background = "";
      document.body.style.margin = "";
    };
  }, []);

  const slide = useMemo(() => HERO_SLIDES[activeSlide], [activeSlide]);
  const clock = useMemo(() => formatLiveClock(now), [now]);
  const dayPeriod = useMemo(() => getDayPeriod(now), [now]);
  const weatherState = useMemo(() => getUiWeatherState(now), [now]);

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  function handlePrimary(label) {
    const value = String(label || "").toLowerCase();
    if (value.includes("plan")) return scrollToId("plans");
    if (value.includes("device")) return scrollToId("devices");
    if (value.includes("contact")) return scrollToId("contact");
    scrollToId("plans");
  }

  function handleSecondary(label) {
    const value = String(label || "").toLowerCase();
    if (value.includes("login")) {
      setShowLogin(true);
      return;
    }
    if (value.includes("call")) {
      window.location.href = BRAND.phoneHref;
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
        setShowLogin(false);

        if (typeof onLogin === "function") {
          onLogin({ username: username.trim() });
          return;
        }

        window.location.href = "/";
      } else {
        setSubmitting(false);
        setLoginError("Invalid username or password.");
      }
    }, 650);
  }

  return (
    <div className="page">
      <Styles />

      <div className="social-rail">
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

      <header className="header">
        <div className="header-inner">
          <button className="brand" onClick={() => scrollToId("home")} aria-label="Go to home">
            <BrandMark />
            <div className="brand-copy">
              <span className="brand-kicker">{BRAND.label}</span>
              <span className="brand-name">{BRAND.name}</span>
            </div>
          </button>

          <nav className="nav" aria-label="Main navigation">
            <button onClick={() => scrollToId("home")}>Home</button>
            <button onClick={() => scrollToId("plans")}>Plans</button>
            <button onClick={() => scrollToId("devices")}>Devices</button>
            <button onClick={() => scrollToId("whyus")}>Why Us</button>
            <button onClick={() => scrollToId("contact")}>Contact</button>
          </nav>

          <div className="header-actions">
            <button className="ghost-btn" onClick={() => setShowLogin(true)}>
              Support Login
            </button>
            <a className="primary-btn" href={BRAND.phoneHref}>
              Call Now
            </a>
          </div>

          <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            <MenuIcon />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <button className="mobile-link" onClick={() => scrollToId("home")}>Home</button>
            <button className="mobile-link" onClick={() => scrollToId("plans")}>Plans</button>
            <button className="mobile-link" onClick={() => scrollToId("devices")}>Devices</button>
            <button className="mobile-link" onClick={() => scrollToId("whyus")}>Why Us</button>
            <button className="mobile-link" onClick={() => scrollToId("contact")}>Contact</button>
            <button className="ghost-btn" onClick={() => { setMenuOpen(false); setShowLogin(true); }}>
              Support Login
            </button>
            <a className="primary-btn" href={BRAND.phoneHref}>Call Now</a>
          </div>
        )}
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div>
                <div className="eyebrow">{slide.eyebrow}</div>

                <h1 className="hero-title">
                  <span className="line">{slide.titleTop}</span>
                  <span className="line">{slide.titleMid}</span>
                  <span className="line accent">{slide.titleAccent}</span>
                </h1>

                <p className="hero-text">{slide.text}</p>

                <div className="hero-actions">
                  <button className="primary-btn chip-btn" onClick={() => handlePrimary(slide.primary)}>
                    {slide.primary}
                  </button>
                  <button className="ghost-btn chip-btn" onClick={() => handleSecondary(slide.secondary)}>
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
              <div className="status-grid">
                <div className="status-card">
                  <div className="status-top">
                    <div className="status-kicker">Live Time</div>
                    <div className="status-icon">
                      <ClockIcon />
                    </div>
                  </div>
                  <div className="status-main">{clock.time}</div>
                  <div className="status-sub">{clock.day} • {clock.fullDate}</div>
                </div>

                <div className="status-card">
                  <div className="status-top">
                    <div className="status-kicker">Weather Status</div>
                    <div className="status-icon">
                      <SunIcon />
                    </div>
                  </div>
                  <div className="status-main">{weatherState.label}</div>
                  <div className="status-sub">{weatherState.sub}</div>
                </div>

                <div className="status-card">
                  <div className="status-top">
                    <div className="status-kicker">Wireless State</div>
                    <div className="status-icon">
                      <WifiIcon />
                    </div>
                  </div>
                  <div className="status-main">{dayPeriod} signal</div>
                  <div className="status-sub">Premium access path ready</div>
                </div>
              </div>

              <RadarVisual />
            </div>
          </div>
        </section>

        <section id="plans" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Packages</div>
                <h2 className="section-title">Plans designed to look clearer, sharper, and more premium.</h2>
              </div>
              <p className="section-text">
                Better pricing hierarchy, stronger spacing, and cleaner package details that feel easier to scan and trust.
              </p>
            </div>

            <div className="plans-grid">
              {PLANS.map((plan) => (
                <article key={plan.name} className={`plan-card ${plan.featured ? "featured" : ""}`}>
                  <div className="card-top">
                    <span className="pill">{plan.badge}</span>
                    <span className="pill">Plan</span>
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
              ))}
            </div>
          </div>
        </section>

        <section id="devices" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Devices</div>
                <h2 className="section-title">Hardware cards arranged with a cleaner premium product feel.</h2>
              </div>
              <p className="section-text">
                Better tags, cleaner rhythm, and stronger structure across the whole devices section without oversized clutter.
              </p>
            </div>

            <div className="devices-grid">
              {DEVICES.map((device) => (
                <article className="device-card" key={device.name}>
                  <div className="card-top">
                    <span className="pill">{device.tag}</span>
                    <span className="pill">{device.type}</span>
                  </div>

                  <h3 className="device-name">{device.name}</h3>
                  <div className="device-type">{device.type}</div>
                  <p className="device-desc">{device.desc}</p>

                  <div className="feature-row">
                    {device.features.map((feature) => (
                      <span className="feature-chip" key={feature}>{feature}</span>
                    ))}
                  </div>

                  <div className="card-footer">
                    <div className="device-price">{device.price}</div>
                    <a className="card-action" href={BRAND.phoneHref}>Order Device</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="whyus" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Why Us</div>
                <h2 className="section-title">A calmer, stronger provider identity with less noise and more trust.</h2>
              </div>
              <p className="section-text">
                This rebuild improves visual pacing, package clarity, and contact flow while keeping the page elegant and publish-ready.
              </p>
            </div>

            <div className="benefits-grid">
              {BENEFITS.map((item, index) => (
                <article className="benefit-card" key={item.title}>
                  <div className="benefit-number">{String(index + 1).padStart(2, "0")}</div>
                  <h3 className="benefit-title">{item.title}</h3>
                  <p className="benefit-text">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Contact</div>
                <h2 className="section-title">Fast support and direct reach, arranged in a cleaner final section.</h2>
              </div>
              <p className="section-text">
                The contact area keeps actions visible, organized, and easier to use on every screen size.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card contact-primary">
                <div>
                  <h3 className="benefit-title" style={{ marginBottom: 10 }}>Reach NoComment faster</h3>
                  <p className="contact-text">
                    Open support, call directly, or jump to public pages through cleaner grouped actions.
                  </p>
                </div>

                <div className="contact-list">
                  {CONTACT_ACTIONS.map((item) => (
                    <a className="contact-link" href={item.href} target="_blank" rel="noreferrer" key={item.title}>
                      <div className="contact-icon">
                        <ContactIcon title={item.title} />
                      </div>
                      <div className="contact-meta">
                        <strong>{item.title}</strong>
                        <span>{item.value}</span>
                        <small>{item.hint}</small>
                      </div>
                      <div className="contact-arrow">→</div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="contact-secondary">
                <div className="contact-card contact-block">
                  <h3>Phone support</h3>
                  <p>Use the direct call action for a faster customer path and a cleaner service experience.</p>
                  <a className="card-action" href={BRAND.phoneHref}>Call {BRAND.phoneDisplay}</a>
                </div>

                <div className="contact-card contact-block">
                  <h3>Support login</h3>
                  <p>Open the login modal when needed while keeping the landing page flow visually balanced.</p>
                  <button className="card-action chip-btn" onClick={() => setShowLogin(true)}>Open Login</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-card">
            <strong>{BRAND.name} — Premium internet access</strong>
            <span>Cleaner structure • Better hierarchy • Stronger presentation</span>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2 className="modal-title">Support Login</h2>
                <p className="modal-text">Simple access modal with cleaner spacing and quieter presentation.</p>
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
                Current login behavior is kept compatible for now. Backend auth can be upgraded later.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
