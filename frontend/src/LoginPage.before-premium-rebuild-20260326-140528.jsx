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
    eyebrow: "PREMIUM ISP EXPERIENCE",
    title: ["Fast internet", "Sharper layout", "Direct support"],
    text:
      "A cleaner customer entry point with stronger hierarchy, darker premium visuals, and actions that feel immediate instead of noisy.",
    primary: "View Plans",
    secondary: "Support Login",
  },
  {
    eyebrow: "HOME + BUSINESS READY",
    title: ["Clear packages", "Real hardware", "Zero clutter"],
    text:
      "Plans, devices, and support are rebuilt into focused sections with better spacing, cleaner rhythm, and a stronger brand feel.",
    primary: "See Devices",
    secondary: "Call Now",
  },
  {
    eyebrow: "FINAL CUSTOMER FLOW",
    title: ["Better trust", "Better balance", "Better conversion"],
    text:
      "This version is tuned to feel more modern, more premium, and more intentional on desktop and mobile.",
    primary: "Open Contact",
    secondary: "Support Login",
  },
];

const STATS = [
  { label: "Coverage", value: "Jabal Mohssen" },
  { label: "Support", value: "Direct access" },
  { label: "Experience", value: "Premium flow" },
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
    title: "Stronger first impression",
    text: "A cleaner, more balanced landing flow that looks intentional from the first second.",
  },
  {
    title: "Better package clarity",
    text: "Pricing hierarchy and specs are arranged so users understand the offer faster.",
  },
  {
    title: "Real product presentation",
    text: "Devices look like actual sellable hardware cards instead of random floating boxes.",
  },
  {
    title: "Faster action paths",
    text: "Call, WhatsApp, login, and contact actions are easier to reach on every screen size.",
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
    hint: "See updates and info",
    href: BRAND.facebook,
  },
  {
    title: "Location",
    value: "Open Google Maps",
    hint: "Find us instantly",
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

function MenuIcon() {
  return (
    <div className="menu-lines" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function RadarVisual() {
  return (
    <div className="radar-shell">
      <div className="radar-bg" />
      <div className="radar-grid" />
      <div className="radar-badge">CHATGPT 2099</div>

      <div className="radar-float left">
        <span className="float-label">Support</span>
        <strong className="float-value">Direct reply</strong>
      </div>

      <div className="radar-float right">
        <span className="float-label">Hardware</span>
        <strong className="float-value">Modem + Router</strong>
      </div>

      <div className="wifi-stack">
        <span className="wifi-arc a1" />
        <span className="wifi-arc a2" />
        <span className="wifi-arc a3" />
      </div>

      <div className="radar-ring ring-1" />
      <div className="radar-ring ring-2" />
      <div className="radar-ring ring-3" />
      <div className="radar-sweep" />

      <div className="radar-core">
        <div className="radar-core-inner">
          <span className="core-pulse" />
        </div>
      </div>

      <div className="visual-mini-row">
        <div className="visual-mini-card">
          <span>Plans</span>
          <strong>6 Offers</strong>
        </div>
        <div className="visual-mini-card">
          <span>Design</span>
          <strong>Premium UX</strong>
        </div>
        <div className="visual-mini-card">
          <span>Access</span>
          <strong>Fast Actions</strong>
        </div>
      </div>
    </div>
  );
}

function ContactIcon({ title }) {
  if (title === "WhatsApp") return <WhatsAppIcon />;
  if (title === "Facebook") return <FacebookIcon />;
  return <LocationIcon />;
}

function Styles() {
  return (
    <style>{`
      :root {
        --bg: #020617;
        --bg-soft: #06101f;
        --surface: rgba(11, 18, 32, .78);
        --surface-2: rgba(15, 23, 42, .88);
        --line: rgba(148, 163, 184, .14);
        --line-strong: rgba(125, 211, 252, .28);
        --text: #f8fafc;
        --muted: #94a3b8;
        --muted-2: #cbd5e1;
        --cyan: #38bdf8;
        --blue: #60a5fa;
        --violet: #a855f7;
        --green: #22c55e;
        --shadow: 0 30px 80px rgba(2, 8, 23, .40);
        --radius-xl: 30px;
        --radius-lg: 22px;
        --radius-md: 18px;
        --max: 1280px;
      }

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

      a { color: inherit; text-decoration: none; }
      button { font: inherit; color: inherit; }

      .page {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background:
          radial-gradient(circle at 15% 20%, rgba(56, 189, 248, .09), transparent 28%),
          radial-gradient(circle at 85% 12%, rgba(168, 85, 247, .08), transparent 24%),
          radial-gradient(circle at 50% 100%, rgba(59, 130, 246, .08), transparent 24%),
          linear-gradient(180deg, #020617 0%, #06101f 48%, #020617 100%);
      }

      .page::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .07;
        background-image:
          linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(circle at center, rgba(0,0,0,.95), transparent 100%);
      }

      .page::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(circle at center, transparent 52%, rgba(2,8,23,.46) 100%);
      }

      .container {
        width: min(calc(100% - 32px), var(--max));
        margin: 0 auto;
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(18px);
        background: linear-gradient(180deg, rgba(2,8,23,.82), rgba(2,8,23,.48));
        border-bottom: 1px solid rgba(148,163,184,.08);
      }

      .header-inner {
        width: min(calc(100% - 32px), var(--max));
        margin: 0 auto;
        min-height: 82px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .brand {
        border: 0;
        background: transparent;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .brand-mark {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(168,85,247,.14));
        border: 1px solid rgba(125,211,252,.18);
        box-shadow: 0 14px 30px rgba(2,8,23,.30);
      }

      .brand-wifi {
        position: relative;
        width: 22px;
        height: 16px;
      }

      .brand-wifi span {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        border: solid transparent;
        border-top-left-radius: 999px;
        border-top-right-radius: 999px;
      }

      .brand-wifi span:nth-child(1) {
        top: 0;
        width: 22px;
        height: 12px;
        border-width: 3px;
        border-top-color: rgba(56,189,248,.92);
      }

      .brand-wifi span:nth-child(2) {
        top: 5px;
        width: 14px;
        height: 8px;
        border-width: 3px;
        border-top-color: rgba(168,85,247,.92);
      }

      .brand-wifi span:nth-child(3) {
        top: 12px;
        width: 6px;
        height: 6px;
        border-width: 3px;
        border-top-color: rgba(255,255,255,.92);
      }

      .brand-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }

      .brand-kicker {
        font-size: .68rem;
        color: var(--muted);
        letter-spacing: .16em;
        text-transform: uppercase;
        font-weight: 800;
      }

      .brand-name {
        font-size: 1rem;
        font-weight: 900;
        color: var(--text);
        letter-spacing: .02em;
      }

      .nav {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.03);
      }

      .nav button,
      .menu-btn,
      .ghost-btn,
      .primary-btn,
      .mobile-link,
      .slide-dot,
      .chip-btn {
        transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease, opacity .18s ease;
      }

      .nav button,
      .mobile-link {
        border: 0;
        cursor: pointer;
        background: transparent;
        color: var(--muted-2);
        min-height: 42px;
        padding: 0 14px;
        border-radius: 999px;
        font-weight: 700;
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
      .chip-btn {
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--text);
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 800;
      }

      .primary-btn {
        background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(59,130,246,.14));
        border-color: rgba(125,211,252,.24);
        box-shadow: 0 16px 34px rgba(2,8,23,.28);
      }

      .ghost-btn:hover,
      .menu-btn:hover,
      .chip-btn:hover {
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
        padding: 0;
        display: none;
        place-items: center;
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

      .hero-copy,
      .hero-visual-wrap,
      .glass-card,
      .plan-card,
      .device-card,
      .benefit-card,
      .contact-card {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(15,23,42,.78), rgba(8,14,26,.88));
        backdrop-filter: blur(16px);
        box-shadow: var(--shadow);
      }

      .hero-copy {
        border-radius: 34px;
        padding: 34px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 720px;
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
        margin: 24px 0 18px;
        font-size: clamp(2.7rem, 5vw, 5.4rem);
        line-height: .96;
        letter-spacing: -.04em;
        font-weight: 950;
        display: grid;
        gap: 8px;
      }

      .hero-title .accent {
        background: linear-gradient(135deg, #f8fafc 0%, #7dd3fc 44%, #c084fc 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .hero-text {
        max-width: 58ch;
        font-size: 1.05rem;
        line-height: 1.8;
        color: var(--muted);
        margin: 0 0 28px;
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
        border-radius: 20px;
        padding: 18px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
      }

      .stat-card span {
        display: block;
        font-size: .75rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        margin-bottom: 10px;
      }

      .stat-card strong {
        display: block;
        font-size: 1rem;
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
      }

      .slide-dot.active {
        width: 30px;
        background: linear-gradient(135deg, rgba(56,189,248,.92), rgba(168,85,247,.92));
        border-color: transparent;
      }

      .hero-visual-wrap {
        border-radius: 34px;
        padding: 18px;
        min-height: 720px;
      }

      .radar-shell {
        position: relative;
        height: 100%;
        min-height: 682px;
        overflow: hidden;
        border-radius: 28px;
        background:
          radial-gradient(circle at 80% 15%, rgba(56,189,248,.10), transparent 22%),
          radial-gradient(circle at 15% 80%, rgba(168,85,247,.10), transparent 20%),
          linear-gradient(180deg, rgba(8,14,26,.98), rgba(5,10,20,.98));
        border: 1px solid rgba(148,163,184,.10);
      }

      .radar-bg,
      .radar-grid {
        position: absolute;
        inset: 0;
      }

      .radar-grid {
        opacity: .06;
        background-image:
          linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      .radar-badge {
        position: absolute;
        top: 22px;
        left: 22px;
        z-index: 4;
        min-height: 38px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        color: var(--muted-2);
        font-size: .72rem;
        font-weight: 900;
        letter-spacing: .16em;
      }

      .radar-float {
        position: absolute;
        z-index: 4;
        min-width: 160px;
        padding: 16px 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.04);
        backdrop-filter: blur(16px);
      }

      .radar-float.left { left: 22px; top: 44%; }
      .radar-float.right { right: 22px; top: 36%; }

      .float-label {
        display: block;
        font-size: .72rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        margin-bottom: 8px;
      }

      .float-value {
        font-size: 1rem;
        font-weight: 900;
        color: var(--text);
      }

      .wifi-stack {
        position: absolute;
        top: 17%;
        left: 50%;
        transform: translateX(-50%);
        width: min(92%, 430px);
        height: 200px;
        z-index: 3;
        pointer-events: none;
      }

      .wifi-arc {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        border: solid transparent;
        border-top-left-radius: 999px;
        border-top-right-radius: 999px;
        animation: floatArc 3.6s ease-in-out infinite;
      }

      .wifi-arc.a1 {
        top: 0;
        width: 100%;
        height: 210px;
        border-width: 14px;
        border-top-color: rgba(56,189,248,.84);
      }

      .wifi-arc.a2 {
        top: 34px;
        width: 74%;
        height: 156px;
        border-width: 12px;
        border-top-color: rgba(59,130,246,.84);
        animation-duration: 4.2s;
      }

      .wifi-arc.a3 {
        top: 68px;
        width: 48%;
        height: 100px;
        border-width: 10px;
        border-top-color: rgba(168,85,247,.88);
        animation-duration: 3s;
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
        border: 1px solid rgba(125,211,252,.14);
      }

      .ring-1 { width: 360px; height: 360px; }
      .ring-2 { width: 250px; height: 250px; }
      .ring-3 { width: 160px; height: 160px; }

      .radar-sweep {
        width: 360px;
        height: 360px;
        background:
          conic-gradient(
            from 0deg,
            rgba(0,0,0,0) 0deg,
            rgba(0,0,0,0) 304deg,
            rgba(96,165,250,.12) 336deg,
            rgba(125,211,252,.34) 350deg,
            rgba(255,255,255,.10) 360deg
          );
        animation: sweep 6s linear infinite;
      }

      .radar-core {
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(125,211,252,.20);
        background: linear-gradient(180deg, rgba(17,28,50,.96), rgba(9,16,30,.98));
        box-shadow: 0 0 30px rgba(56,189,248,.10);
        z-index: 5;
      }

      .radar-core-inner {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, rgba(56,189,248,.84), rgba(168,85,247,.84));
      }

      .core-pulse {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 0 18px rgba(255,255,255,.42);
        animation: pulse 2.1s ease-in-out infinite;
      }

      .visual-mini-row {
        position: absolute;
        left: 22px;
        right: 22px;
        bottom: 22px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .visual-mini-card {
        min-height: 102px;
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(20,28,48,.86), rgba(11,18,32,.86));
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .visual-mini-card span {
        font-size: .72rem;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
      }

      .visual-mini-card strong {
        font-size: 1rem;
        font-weight: 900;
      }

      .section {
        padding: 28px 0;
      }

      .section-head {
        display: grid;
        grid-template-columns: 1.1fr .9fr;
        gap: 20px;
        align-items: end;
        margin-bottom: 22px;
      }

      .section-title {
        font-size: clamp(1.8rem, 3vw, 3rem);
        line-height: 1.05;
        letter-spacing: -.03em;
        margin: 14px 0 0;
        font-weight: 950;
      }

      .section-text {
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.8;
        margin: 0;
      }

      .plans-grid,
      .devices-grid,
      .benefits-grid,
      .contact-grid {
        display: grid;
        gap: 16px;
      }

      .plans-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .devices-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .benefits-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .contact-grid {
        grid-template-columns: 1.15fr .85fr;
      }

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
        font-size: .76rem;
        font-weight: 800;
      }

      .plan-name,
      .device-name,
      .benefit-title {
        margin: 0 0 10px;
        font-size: 1.38rem;
        font-weight: 900;
        letter-spacing: -.02em;
      }

      .plan-price {
        font-size: 2.2rem;
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
        font-size: 1.5rem;
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
      }

      .card-action:hover {
        transform: translateY(-2px);
        border-color: var(--line-strong);
      }

      .benefit-card {
        min-height: 230px;
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
        font-size: 1.4rem;
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
        font-size: 1.8rem;
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
        cursor: pointer;
        font-size: 1.15rem;
        font-weight: 900;
      }

      .close-btn:hover {
        border-color: var(--line-strong);
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
        50% { opacity: 1; box-shadow: 0 0 18px rgba(255,255,255,.24); }
        100% { opacity: .55; box-shadow: 0 0 0 rgba(255,255,255,0); }
      }

      @keyframes floatArc {
        0% { transform: translateX(-50%) translateY(0px); opacity: .82; }
        50% { transform: translateX(-50%) translateY(-7px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0px); opacity: .82; }
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

        .radar-shell {
          min-height: 620px;
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

        .menu-btn,
        .mobile-menu {
          display: grid;
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

        .radar-float.left,
        .radar-float.right {
          display: none;
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

        .hero-title {
          font-size: clamp(2.2rem, 11vw, 3.5rem);
        }

        .hero-stats,
        .visual-mini-row,
        .plans-grid,
        .devices-grid,
        .benefits-grid {
          grid-template-columns: 1fr;
        }

        .radar-shell {
          min-height: 540px;
        }

        .ring-1 { width: 280px; height: 280px; }
        .ring-2 { width: 190px; height: 190px; }
        .ring-3 { width: 120px; height: 120px; }
        .radar-sweep { width: 280px; height: 280px; }

        .wifi-stack {
          width: min(92%, 280px);
          height: 150px;
          top: 20%;
        }

        .contact-link {
          grid-template-columns: 48px 1fr;
        }

        .contact-arrow {
          display: none;
        }

        .footer-card {
          align-items: flex-start;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .wifi-arc,
        .radar-sweep,
        .core-pulse {
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
        .chip-btn {
          transition: none !important;
        }
      }
    `}</style>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <div className="brand-wifi">
        <span />
        <span />
        <span />
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.background = "#020617";
    document.body.style.margin = "0";
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
                  <span>{slide.title[0]}</span>
                  <span>{slide.title[1]}</span>
                  <span className="accent">{slide.title[2]}</span>
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
              <RadarVisual />
            </div>
          </div>
        </section>

        <section id="plans" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">Packages</div>
                <h2 className="section-title">Plans rebuilt to feel clearer, darker, and more premium.</h2>
              </div>
              <p className="section-text">
                Better pricing hierarchy, stronger badges, cleaner specs, and a section that feels sellable instead of patched.
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
                <h2 className="section-title">Hardware cards that finally look premium and organized.</h2>
              </div>
              <p className="section-text">
                Better tags, cleaner spacing, sharper specs, and stronger visual rhythm across the whole devices section.
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
                <h2 className="section-title">A cleaner provider brand feel with less noise and more trust.</h2>
              </div>
              <p className="section-text">
                This rebuild improves pacing, hierarchy, conversion paths, and overall balance without turning the page into a visual mess.
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
                <h2 className="section-title">Fast action paths for support, location, and direct customer reach.</h2>
              </div>
              <p className="section-text">
                The last section is built to convert faster: clear support routes, visible phone action, and cleaner contact grouping.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card contact-primary">
                <div>
                  <h3 className="benefit-title" style={{ marginBottom: 10 }}>Reach NoComment faster</h3>
                  <p className="contact-text">
                    Open support, call directly, or jump to our public pages without hunting through messy blocks.
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
                  <p>Need fast help? Use the direct call button and keep the customer journey simple and immediate.</p>
                  <a className="card-action" href={BRAND.phoneHref}>Call {BRAND.phoneDisplay}</a>
                </div>

                <div className="contact-card contact-block">
                  <h3>Support login</h3>
                  <p>Open the support access modal from here without breaking the main customer landing rhythm.</p>
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
            <strong>{BRAND.name} — Premium ISP landing rebuild</strong>
            <span>Cleaner UX • Stronger hierarchy • Better balance</span>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2 className="modal-title">Support Login</h2>
                <p className="modal-text">Clean modal flow with clearer spacing and less clutter.</p>
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
                Note: this keeps your current frontend-style demo login behavior for compatibility. Later we should move it to backend auth.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
