import { useEffect, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";
const LOGIN_STORAGE_KEY = "nnc_user";
const DASHBOARD_PATH = "/";

const BRAND = {
  name: "NoComment",
  label: "NoComment Network",
  phoneHref: "tel:70411518",
  whatsapp: "https://wa.me/96170411518",
  facebook: "https://www.facebook.com/nocomment.lb/",
};

function formatClock(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function WifiIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 11.5C11.8 6.2 20.2 6.2 27 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 16C13.8 12.4 18.2 12.4 23 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 20.2C15.1 18.8 16.9 18.8 19 20.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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

function TimeNowCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="visual-card time-card">
      <span className="mini-label">Time Now</span>
      <strong className="time-value">{formatClock(now)}</strong>
      <small className="time-date">{formatDate(now)}</small>
    </div>
  );
}

function WifiCard() {
  return (
    <div className="visual-card wifi-card">
      <div className="mini-head">
        <span className="mini-label">Signal</span>
        <strong className="mini-title">WiFi Coverage</strong>
      </div>

      <div className="wifi-stage" aria-hidden="true">
        <span className="wifi-arc a1" />
        <span className="wifi-arc a2" />
        <span className="wifi-arc a3" />
      </div>
    </div>
  );
}

function RadarCard() {
  return (
    <div className="visual-card radar-card">
      <div className="mini-head">
        <span className="mini-label">Support</span>
        <strong className="mini-title">Response Pattern</strong>
      </div>

      <div className="radar-stage" aria-hidden="true">
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="sweep" />
        <div className="radar-core">
          <span className="core-dot" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    document.body.style.background = "#020611";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  function handleLoginSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setLoginError("");

    window.setTimeout(() => {
      const ok = username === VALID_USERNAME && password === VALID_PASSWORD;

      if (!ok) {
        setSubmitting(false);
        setLoginError("Invalid username or password.");
        return;
      }

      localStorage.setItem(
        LOGIN_STORAGE_KEY,
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

      window.location.href = DASHBOARD_PATH;
    }, 500);
  }

  return (
    <div className="landing-shell">
      <style>{`
        :root{
          --bg:#020611;
          --bg2:#071126;
          --surface:rgba(10,16,33,.9);
          --line:rgba(120,170,255,.14);
          --text:#f4f7ff;
          --muted:#95a2be;
          --muted2:#7281a4;
          --shadow:0 24px 80px rgba(0,0,0,.42);
          --max:1180px;
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{
          margin:0;
          color:var(--text);
          background:
            radial-gradient(circle at 12% 20%, rgba(0,106,255,.14), transparent 28%),
            radial-gradient(circle at 82% 18%, rgba(121,49,255,.12), transparent 24%),
            linear-gradient(180deg, #030713 0%, #020611 100%);
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }
        a{text-decoration:none;color:inherit}
        button,input{font:inherit}
        button{cursor:pointer;border:0;background:none;color:inherit}

        .landing-shell{
          min-height:100vh;
          position:relative;
          overflow:hidden;
        }
        .landing-shell::before{
          content:"";
          position:fixed;
          inset:0;
          pointer-events:none;
          opacity:.7;
          background:
            linear-gradient(90deg, rgba(62,118,255,.06) 0%, transparent 18%, transparent 82%, rgba(110,58,255,.05) 100%),
            repeating-linear-gradient(to bottom, rgba(255,255,255,.015) 0px, rgba(255,255,255,.015) 1px, transparent 1px, transparent 4px);
        }

        .container{width:min(calc(100% - 28px), var(--max));margin:0 auto}

        .site-header{
          position:sticky;top:0;z-index:50;
          padding:12px 0 0;
          backdrop-filter:blur(18px);
          background:linear-gradient(180deg, rgba(2,6,17,.74), rgba(2,6,17,.28));
        }
        .header-bar{
          min-height:72px;
          display:grid;
          grid-template-columns:auto 1fr auto;
          align-items:center;
          gap:14px;
          padding:10px 0 14px;
        }

        .brand-card{
          display:inline-flex;align-items:center;gap:12px;
          padding:10px 16px;min-width:228px;
          border-radius:18px;border:1px solid var(--line);
          background:linear-gradient(180deg, rgba(13,22,42,.9), rgba(9,16,31,.86));
        }
        .brand-icon{
          width:40px;height:40px;display:grid;place-items:center;
          border-radius:14px;color:#8dd8ff;
          background:radial-gradient(circle at 50% 50%, rgba(102,187,255,.24), rgba(60,119,255,.08) 60%, transparent 72%), rgba(255,255,255,.03);
          border:1px solid rgba(114,181,255,.2);
        }
        .brand-label{
          display:block;
          font-size:.7rem;
          line-height:1;
          text-transform:uppercase;
          letter-spacing:.2em;
          color:var(--muted);
          margin-bottom:5px;
          font-weight:700;
        }
        .brand-name{font-size:1.28rem;line-height:1;font-weight:800;letter-spacing:-.03em}

        .desktop-nav{
          display:inline-flex;align-items:center;gap:6px;padding:6px;
          border-radius:999px;border:1px solid var(--line);
          background:rgba(10,17,34,.76);
        }
        .nav-shell{display:flex;justify-content:center}
        .nav-link{
          min-height:40px;padding:0 14px;border-radius:999px;
          color:#d8e4ff;font-size:.94rem;font-weight:700;
        }
        .nav-link:hover{background:rgba(255,255,255,.05)}

        .header-actions{display:flex;align-items:center;gap:10px}
        .ghost-btn,.primary-btn{
          min-height:42px;padding:0 16px;border-radius:14px;font-weight:800;font-size:.95rem;
          display:inline-flex;align-items:center;justify-content:center;
        }
        .ghost-btn{
          color:#e7efff;
          background:linear-gradient(180deg, rgba(18,28,49,.92), rgba(11,18,35,.92));
          border:1px solid var(--line);
        }
        .primary-btn{
          color:#f7fbff;
          background:linear-gradient(135deg, rgba(62,123,255,.96), rgba(85,198,255,.96));
          border:1px solid rgba(112,181,255,.34);
          box-shadow:0 10px 28px rgba(57,128,255,.18), inset 0 1px 0 rgba(255,255,255,.18);
        }

        .mobile-toggle{
          display:none;
          width:46px;height:46px;border-radius:14px;border:1px solid var(--line);
          background:rgba(10,17,34,.88);
        }
        .menu-lines{width:18px;display:flex;flex-direction:column;gap:4px;margin:0 auto}
        .menu-lines span{display:block;height:2px;border-radius:999px;background:#eaf2ff}

        .mobile-menu{
          display:none;
          margin-top:10px;padding:12px;border-radius:20px;border:1px solid var(--line);
          background:rgba(8,13,27,.95);
        }
        .mobile-link{
          width:100%;min-height:42px;text-align:left;padding:0 12px;border-radius:12px;
          color:#ecf3ff;font-weight:700;
        }
        .mobile-link:hover{background:rgba(255,255,255,.04)}

        .side-socials{
          position:fixed;left:16px;top:50%;transform:translateY(-50%);
          display:flex;flex-direction:column;gap:10px;z-index:10;
        }
        .social-link{
          width:44px;height:44px;border-radius:14px;border:1px solid var(--line);
          background:rgba(10,17,34,.84);color:#ecf3ff;display:grid;place-items:center;
        }

        .hero{padding:22px 0 18px}
        .hero-grid{
          display:grid;
          grid-template-columns:1.03fr .97fr;
          gap:16px;
          align-items:stretch;
        }

        .hero-copy,.hero-visual,.content-card,.modal{
          border-radius:28px;
          border:1px solid var(--line);
          background:linear-gradient(180deg, rgba(9,16,31,.92), rgba(6,11,23,.96));
          box-shadow:var(--shadow);
          position:relative;
          overflow:hidden;
        }

        .hero-copy,.hero-visual{padding:24px}
        .hero-copy{
          min-height:520px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .eyebrow,.mini-label{
          display:inline-flex;align-items:center;justify-content:center;
          min-height:30px;width:fit-content;padding:0 10px;border-radius:999px;
          border:1px solid rgba(124,173,255,.18);
          background:rgba(16,26,47,.76);
          font-size:.68rem;line-height:1;letter-spacing:.16em;text-transform:uppercase;
          color:#dbe7ff;font-weight:800;
        }

        .hero-title{
          margin:16px 0 12px;
          display:flex;flex-direction:column;gap:1px;
          font-size:clamp(2.1rem, 4.2vw, 4.1rem);
          line-height:.92;
          letter-spacing:-.06em;
          max-width:8.6ch;
          font-weight:900;
        }
        .hero-title .accent{
          background:linear-gradient(90deg, #8fdfff 0%, #75a4ff 52%, #af8eff 100%);
          -webkit-background-clip:text;background-clip:text;color:transparent;
        }
        .hero-text{
          max-width:52ch;margin:0 0 18px;
          color:var(--muted);font-size:.98rem;line-height:1.7;
        }
        .hero-actions{display:flex;flex-wrap:wrap;gap:10px}
        .hero-stats{
          margin-top:20px;
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
        }
        .stat-card,.visual-card,.tiny-card,.content-card{
          border-radius:22px;
          border:1px solid var(--line);
          background:linear-gradient(180deg, rgba(11,18,35,.9), rgba(7,12,24,.96));
        }
        .stat-card{padding:14px}
        .stat-card span{
          display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.16em;
          color:var(--muted2);margin-bottom:8px;font-weight:800;
        }

        .hero-visual{
          min-height:520px;
          display:grid;
          grid-template-rows:auto auto auto;
          gap:12px;
        }
        .visual-top{
          display:grid;
          grid-template-columns:160px 1fr;
          gap:12px;
        }
        .visual-card{padding:14px}
        .mini-head{
          display:flex;align-items:center;justify-content:space-between;gap:10px;
          margin-bottom:10px;
        }
        .mini-title{font-size:1rem;line-height:1.1;color:#fff}

        .time-card{min-height:118px;display:flex;flex-direction:column;justify-content:center}
        .time-value{display:block;margin:8px 0 6px;font-size:1.2rem;line-height:1;color:#fff}
        .time-date{color:var(--muted);font-size:.8rem}

        .wifi-card{min-height:118px}
        .wifi-stage{
          position:relative;height:110px;display:grid;place-items:center;
        }
        .wifi-arc{
          position:absolute;left:50%;transform:translateX(-50%);
          border-top-left-radius:999px;border-top-right-radius:999px;border-bottom:0;background:transparent;
        }
        .wifi-arc.a1{width:220px;height:106px;border:8px solid rgba(68,193,255,.95);border-bottom:0;top:8px}
        .wifi-arc.a2{width:168px;height:80px;border:7px solid rgba(66,120,255,.96);border-bottom:0;top:22px}
        .wifi-arc.a3{width:114px;height:54px;border:6px solid rgba(144,84,255,.96);border-bottom:0;top:38px}

        .radar-card{min-height:250px}
        .radar-stage{
          position:relative;min-height:190px;display:grid;place-items:center;
        }
        .ring,.sweep,.radar-core{
          position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
          border-radius:999px;
        }
        .ring{border:1px solid rgba(103,161,255,.14)}
        .r1{width:190px;height:190px}
        .r2{width:130px;height:130px}
        .r3{width:82px;height:82px}
        .sweep{
          width:190px;height:190px;
          background:conic-gradient(from 210deg, transparent 0deg, rgba(58,197,255,.18) 34deg, rgba(58,197,255,.06) 72deg, transparent 105deg);
          filter:blur(2px);
          animation:sweep 8s linear infinite;
          mask-image:radial-gradient(circle at center, transparent 0 24%, black 44%);
        }
        @keyframes sweep{
          from{transform:translate(-50%,-50%) rotate(0deg)}
          to{transform:translate(-50%,-50%) rotate(360deg)}
        }
        .radar-core{
          width:56px;height:56px;
          background:radial-gradient(circle at 50% 50%, rgba(140,90,255,.34), rgba(40,76,168,.16) 55%, transparent 72%);
          border:1px solid rgba(93,157,255,.2);
          display:grid;place-items:center;
        }
        .core-dot{
          width:12px;height:12px;border-radius:999px;
          background:linear-gradient(180deg, #c9e7ff, #8f72ff);
          box-shadow:0 0 18px rgba(120,161,255,.55);
          display:block;
        }

        .info-strip{
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
        }
        .tiny-card{padding:12px}
        .tiny-card span{
          display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.14em;
          color:var(--muted2);font-weight:800;margin-bottom:6px;
        }

        .section{padding:18px 0}
        .section-head{
          display:grid;
          grid-template-columns:minmax(0,1fr) minmax(260px,400px);
          gap:20px;
          align-items:end;
          margin-bottom:16px;
        }
        .section-title{
          margin:12px 0 0;
          font-size:clamp(1.6rem, 2.5vw, 2.4rem);
          line-height:1.05;
          letter-spacing:-.04em;
        }
        .section-text{margin:0;color:var(--muted);line-height:1.7;font-size:.96rem}

        .plans-grid,.devices-grid,.why-grid{
          display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .content-card{padding:18px}
        .card-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
        .pill{
          min-height:28px;padding:0 10px;border-radius:999px;
          display:inline-flex;align-items:center;justify-content:center;
          background:rgba(20,33,60,.94);border:1px solid rgba(116,170,255,.16);
          color:#e6f0ff;font-size:.68rem;text-transform:uppercase;letter-spacing:.13em;font-weight:800;
        }
        .pill.soft{color:var(--muted);background:rgba(255,255,255,.03)}
        .card-title{margin:0 0 8px;font-size:1.22rem;line-height:1.05;letter-spacing:-.03em}
        .plan-price{font-size:1.8rem;line-height:1;font-weight:900;margin-bottom:8px}
        .plan-speed,.device-speed{display:block;color:#b9d6ff;font-size:.98rem;font-weight:800;margin-bottom:14px}
        .card-text{margin:0;color:var(--muted);line-height:1.7;font-size:.95rem}
        .spec-stack{display:grid;gap:10px;margin-bottom:18px}
        .spec-row{
          min-height:44px;padding:0 12px;border-radius:14px;background:rgba(255,255,255,.025);
          border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;justify-content:space-between;gap:10px;
        }
        .spec-row span{color:var(--muted);font-size:.9rem}
        .spec-row strong{font-size:.9rem;text-align:right}
        .full-btn{width:100%}
        .why-card{min-height:180px}
        .why-icon{
          width:36px;height:36px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px;
          background:radial-gradient(circle at center, rgba(90,196,255,.28), rgba(52,101,255,.1) 60%, transparent 72%);
          border:1px solid rgba(110,173,255,.2);
        }
        .why-icon span{
          width:12px;height:12px;border-radius:999px;background:linear-gradient(180deg, #8ddfff, #7d6fff);display:block;
        }

        .contact-grid{display:grid;grid-template-columns:1fr;gap:12px}
        .contact-card{
          padding:18px;
          border-radius:22px;
          border:1px solid var(--line);
          background:linear-gradient(180deg, rgba(11,18,35,.9), rgba(7,12,24,.96));
          box-shadow:var(--shadow);
          display:grid;
          grid-template-columns:40px 1fr auto;
          align-items:center;
          gap:14px;
        }
        .contact-icon{
          width:40px;height:40px;border-radius:12px;display:grid;place-items:center;
          border:1px solid rgba(114,171,255,.18);
          background:rgba(255,255,255,.03);
          color:#dcebff;
        }
        .contact-copy strong{display:block;margin-bottom:4px;font-size:1rem}
        .contact-copy span{color:var(--muted);font-size:.92rem}

        .footer{padding:18px 0 28px}
        .footer-card{
          padding:18px;border-radius:22px;border:1px solid var(--line);
          background:linear-gradient(180deg, rgba(11,18,35,.9), rgba(7,12,24,.96));
          box-shadow:var(--shadow);text-align:center;
        }
        .footer-card strong{display:block;margin-bottom:6px}
        .footer-card span{color:var(--muted);font-size:.92rem}

        .modal-backdrop{
          position:fixed;inset:0;z-index:100;background:rgba(1,4,12,.72);
          backdrop-filter:blur(12px);display:grid;place-items:center;padding:20px;
        }
        .modal{width:min(100%, 480px);padding:22px}
        .modal-top{
          display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px;
        }
        .modal-title{margin:0 0 8px;font-size:1.45rem;line-height:1}
        .modal-text,.demo-note{margin:0;color:var(--muted);line-height:1.65;font-size:.94rem}
        .close-btn{
          width:38px;height:38px;border-radius:12px;border:1px solid var(--line);
          background:rgba(255,255,255,.03);font-size:1.25rem;line-height:1;
        }

        .field{margin-bottom:14px}
        .field label{display:block;margin-bottom:8px;color:#dde9ff;font-size:.92rem;font-weight:700}
        .field input{
          width:100%;min-height:48px;border-radius:14px;border:1px solid var(--line);
          outline:none;padding:0 14px;color:var(--text);background:rgba(255,255,255,.03);
        }
        .field input:focus{
          border-color:rgba(117,175,255,.34);
          box-shadow:0 0 0 4px rgba(70,135,255,.08);
        }
        .password-row{display:grid;grid-template-columns:1fr auto;gap:10px}
        .password-toggle{
          min-width:74px;min-height:48px;padding:0 12px;border-radius:14px;
          border:1px solid var(--line);background:rgba(255,255,255,.03);font-weight:700;
        }
        .error-box{
          min-height:44px;padding:0 14px;display:flex;align-items:center;border-radius:14px;
          border:1px solid rgba(255,99,132,.26);background:rgba(255,70,110,.08);
          color:#ffd7e2;margin-bottom:14px;font-size:.92rem;
        }
        .login-submit{width:100%;margin-bottom:12px}

        @media (max-width: 1180px){
          .hero-grid,.section-head,.plans-grid,.devices-grid,.why-grid{grid-template-columns:1fr}
          .side-socials{display:none}
        }

        @media (max-width: 860px){
          .header-bar{grid-template-columns:1fr auto}
          .nav-shell,.header-actions .ghost-btn,.header-actions .primary-btn{display:none}
          .mobile-toggle{display:inline-grid;place-items:center}
          .mobile-menu{display:grid;gap:6px}
          .hero-stats,.info-strip,.visual-top{grid-template-columns:1fr}
          .contact-card{grid-template-columns:40px 1fr}
          .contact-card a:last-child,.contact-card button:last-child{grid-column:1 / -1}
        }

        @media (max-width: 560px){
          .container{width:min(calc(100% - 18px), var(--max))}
          .brand-card{min-width:0;padding:9px 12px}
          .brand-name{font-size:1.08rem}
          .hero-copy,.hero-visual,.content-card,.contact-card,.footer-card,.modal,.visual-card{border-radius:20px}
          .hero-copy,.hero-visual{padding:18px}
          .hero-title{font-size:clamp(1.9rem, 10vw, 2.8rem)}
        }
      `}</style>

      <div className="side-socials">
        <a className="social-link" href={BRAND.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
        </a>
        <a className="social-link" href={BRAND.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
          <FacebookIcon />
        </a>
      </div>

      <header className="site-header">
        <div className="container">
          <div className="header-bar">
            <div className="brand-card">
              <div className="brand-icon">
                <WifiIcon size={18} />
              </div>
              <div>
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
              <button className="ghost-btn" onClick={() => setShowLogin(true)}>Support Login</button>
              <a className="primary-btn" href={BRAND.phoneHref}>Call Now</a>
              <button className="mobile-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
                <div className="menu-lines"><span /><span /><span /></div>
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
              <button className="ghost-btn" onClick={() => { setMenuOpen(false); setShowLogin(true); }}>Support Login</button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">PREMIUM DARK STYLE</div>
              <h1 className="hero-title">
                <span>Packages that</span>
                <span>look cleaner</span>
                <span className="accent">and sell better</span>
              </h1>
              <p className="hero-text">
                Rebuilt from zero with smaller proportions, split visual cards, a real live clock, and a working demo login flow.
              </p>

              <div className="hero-actions">
                <button className="primary-btn" onClick={() => scrollToId("plans")}>View Plans</button>
                <button className="ghost-btn" onClick={() => setShowLogin(true)}>Support Login</button>
              </div>

              <div className="hero-stats">
                <div className="stat-card"><span>Coverage</span><strong>Jabal Mohssen</strong></div>
                <div className="stat-card"><span>Support</span><strong>Fast response</strong></div>
                <div className="stat-card"><span>Setup</span><strong>Modem + Router</strong></div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-top">
                <TimeNowCard />
                <WifiCard />
              </div>

              <RadarCard />

              <div className="info-strip">
                <div className="tiny-card"><span>Plans</span><strong>3 Ready</strong></div>
                <div className="tiny-card"><span>Style</span><strong>Premium UX</strong></div>
                <div className="tiny-card"><span>Access</span><strong>Fast Actions</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Packages</div>
                <h2 className="section-title">Plans that feel easier to compare.</h2>
              </div>
              <p className="section-text">
                Cleaner hierarchy, smaller cards, and a calmer layout.
              </p>
            </div>

            <div className="plans-grid">
              <article className="content-card">
                <div className="card-head"><span className="pill">Starter</span><span className="pill soft">Plan</span></div>
                <h3 className="card-title">Night 8</h3>
                <div className="plan-price">$25</div>
                <div className="plan-speed">8 Mbps</div>
                <div className="spec-stack">
                  <div className="spec-row"><span>Cached</span><strong>Up to 30 Mbps</strong></div>
                  <div className="spec-row"><span>Daily</span><strong>8 GB</strong></div>
                  <div className="spec-row"><span>Monthly</span><strong>500 GB</strong></div>
                </div>
                <a className="primary-btn full-btn" href={BRAND.phoneHref}>Request Plan</a>
              </article>

              <article className="content-card">
                <div className="card-head"><span className="pill">Recommended</span><span className="pill soft">Plan</span></div>
                <h3 className="card-title">Night 12</h3>
                <div className="plan-price">$35</div>
                <div className="plan-speed">12 Mbps</div>
                <div className="spec-stack">
                  <div className="spec-row"><span>Cached</span><strong>Up to 45 Mbps</strong></div>
                  <div className="spec-row"><span>Daily</span><strong>12 GB</strong></div>
                  <div className="spec-row"><span>Monthly</span><strong>700 GB</strong></div>
                </div>
                <a className="primary-btn full-btn" href={BRAND.phoneHref}>Request Plan</a>
              </article>

              <article className="content-card">
                <div className="card-head"><span className="pill">Power</span><span className="pill soft">Plan</span></div>
                <h3 className="card-title">Night 20</h3>
                <div className="plan-price">$50</div>
                <div className="plan-speed">20 Mbps</div>
                <div className="spec-stack">
                  <div className="spec-row"><span>Cached</span><strong>Up to 60 Mbps</strong></div>
                  <div className="spec-row"><span>Daily</span><strong>20 GB</strong></div>
                  <div className="spec-row"><span>Monthly</span><strong>1000 GB</strong></div>
                </div>
                <a className="primary-btn full-btn" href={BRAND.phoneHref}>Request Plan</a>
              </article>
            </div>
          </div>
        </section>

        <section id="devices" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Devices</div>
                <h2 className="section-title">Cleaner hardware presentation.</h2>
              </div>
              <p className="section-text">
                Smaller cards and better spacing for a calmer first view.
              </p>
            </div>

            <div className="devices-grid">
              <article className="content-card">
                <div className="card-head"><span className="pill">Indoor</span><span className="pill soft">Device</span></div>
                <h3 className="card-title">Fiber Router</h3>
                <strong className="device-speed">Stable home coverage</strong>
                <p className="card-text">Clean customer-facing setup with dependable indoor use and simple deployment.</p>
              </article>

              <article className="content-card">
                <div className="card-head"><span className="pill">Long range</span><span className="pill soft">Device</span></div>
                <h3 className="card-title">Outdoor CPE</h3>
                <strong className="device-speed">Focused point coverage</strong>
                <p className="card-text">A stronger device profile for installs where signal direction and distance matter more.</p>
              </article>

              <article className="content-card">
                <div className="card-head"><span className="pill">Balanced</span><span className="pill soft">Device</span></div>
                <h3 className="card-title">Dual Band Modem</h3>
                <strong className="device-speed">Daily use ready</strong>
                <p className="card-text">A practical everyday modem layout for homes that need cleaner Wi-Fi distribution.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="whyus" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Why Us</div>
                <h2 className="section-title">A tighter first impression.</h2>
              </div>
              <p className="section-text">
                Dark premium feel, smaller proportions, and less visual clutter.
              </p>
            </div>

            <div className="why-grid">
              <article className="content-card why-card">
                <div className="why-icon"><span /></div>
                <h3 className="card-title">Clear plans</h3>
                <p className="card-text">Less confusion and easier scanning.</p>
              </article>

              <article className="content-card why-card">
                <div className="why-icon"><span /></div>
                <h3 className="card-title">Direct support</h3>
                <p className="card-text">Fast access to call and login actions.</p>
              </article>

              <article className="content-card why-card">
                <div className="why-icon"><span /></div>
                <h3 className="card-title">Better balance</h3>
                <p className="card-text">Split visuals instead of one giant crowded box.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Contact</div>
                <h2 className="section-title">Fast ways in.</h2>
              </div>
              <p className="section-text">
                Useful actions where they matter.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon"><WhatsAppIcon /></div>
                <div className="contact-copy">
                  <strong>WhatsApp Support</strong>
                  <span>Direct message for customer follow-up.</span>
                </div>
                <a className="primary-btn" href={BRAND.whatsapp} target="_blank" rel="noreferrer">Open WhatsApp</a>
              </div>

              <div className="contact-card">
                <div className="contact-icon"><WifiIcon /></div>
                <div className="contact-copy">
                  <strong>Support Login</strong>
                  <span>Demo credentials: admin / morad3alamdar</span>
                </div>
                <button className="ghost-btn" onClick={() => setShowLogin(true)}>Open Login</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-card">
            <strong>{BRAND.name} — repaired landing</strong>
            <span>Live time • split visuals • working demo login</span>
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
                  Demo login for now. Success redirects to {DASHBOARD_PATH}
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowLogin(false)} aria-label="Close login">×</button>
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
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError ? <div className="error-box">{loginError}</div> : null}

              <button className="primary-btn login-submit" type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Login"}
              </button>

              <p className="demo-note">
                Credentials: admin / morad3alamdar
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
