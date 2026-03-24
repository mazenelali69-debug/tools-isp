import { useEffect, useMemo, useRef, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeNodes(count = 56) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand(4, 96),
    y: rand(6, 94),
    r: rand(0.14, 0.24),
  }));
}

function makeEdges(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 17) {
        edges.push({
          id: `${i}-${j}`,
          a: nodes[i],
          b: nodes[j],
          opacity: Math.max(0.05, 0.18 - d / 120),
        });
      }
    }
  }
  return edges.slice(0, 150);
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [mouse, setMouse] = useState({ x: 50, y: 50, active: false });
  const [pulses, setPulses] = useState([]);
  const wrapRef = useRef(null);

  const nodes = useMemo(() => makeNodes(), []);
  const edges = useMemo(() => makeEdges(nodes), [nodes]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  function submit(e) {
    e.preventDefault();
    const u = String(username || "").trim();
    const p = String(password || "");

    if (u === VALID_USERNAME && p === VALID_PASSWORD) {
      ;
      ;
      setErr("");
      onLogin?.();
      return;
    }

    setErr("Invalid credentials");
  }

  function handleMove(e) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y, active: true });
  }

  function handleLeave() {
    setMouse((prev) => ({ ...prev, active: false }));
  }

  function handleClick(e) {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const tx = x + (Math.random() * 10 - 5);
    const ty = y + (Math.random() * 10 - 5);
    const id = Date.now() + Math.random();

    setPulses((prev) => [...prev, { id, x, y, tx, ty }]);

    window.setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.id !== id));
    }, 800);
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={styles.page}
    >
      <div style={styles.bg} />
      <div style={styles.gridGlow} />
      <div style={styles.leftGlow} />
      <div style={styles.rightGlow} />
      <div style={styles.scanline} />

      <svg style={styles.net} viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.a.x}
            y1={edge.a.y}
            x2={edge.b.x}
            y2={edge.b.y}
            stroke="rgba(61,214,255,0.22)"
            strokeWidth="0.08"
            opacity={edge.opacity}
          />
        ))}

        {nodes.map((n) => {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = mouse.active && d < 14;

          return (
            <g key={n.id}>
              {near ? (
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={mouse.x}
                  y2={mouse.y}
                  stroke="rgba(129,140,248,0.28)"
                  strokeWidth="0.10"
                  opacity={Math.max(0.12, 1 - d / 14)}
                />
              ) : null}
              <circle
                cx={n.x}
                cy={n.y}
                r={near ? n.r * 1.95 : n.r}
                fill={near ? "rgba(129,140,248,0.95)" : "rgba(103,232,249,0.46)"}
              />
            </g>
          );
        })}

        {pulses.map((p) => (
          <line
            key={p.id}
            x1={p.x}
            y1={p.y}
            x2={p.tx}
            y2={p.ty}
            stroke="rgba(61,214,255,0.95)"
            strokeWidth="0.18"
            strokeDasharray="1.2 1.2"
            className="pulse-line"
          />
        ))}
      </svg>

      <div
        style={{
          ...styles.mouseGlow,
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
          opacity: mouse.active ? 1 : 0,
        }}
      />

      <div style={styles.shell}>
        <div style={styles.visualCol}>
          <div style={styles.visualFrame}>
            <div style={styles.visualGlass} />

            <svg width="100%" height="100%" viewBox="0 0 520 520" style={styles.logoSvg}>
              <defs>
                <linearGradient id="ringA" x1="120" y1="90" x2="410" y2="430" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#67e8f9" />
                  <stop offset="0.52" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="ringB" x1="150" y1="120" x2="390" y2="390" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
                <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g opacity="0.16">
                <circle cx="260" cy="260" r="168" stroke="url(#ringA)" strokeWidth="3" fill="none" />
                <circle cx="260" cy="260" r="126" stroke="url(#ringA)" strokeWidth="2.2" fill="none" />
                <circle cx="260" cy="260" r="84" stroke="url(#ringB)" strokeWidth="2" fill="none" />
              </g>

              <g className="logo-rotor" filter="url(#logoGlow)">
                <circle cx="260" cy="108" r="11" fill="url(#ringA)" />
                <circle cx="412" cy="260" r="11" fill="url(#ringB)" />
                <circle cx="260" cy="412" r="11" fill="url(#ringA)" />
                <circle cx="108" cy="260" r="11" fill="url(#ringB)" />

                <path d="M260 122 L260 190" stroke="url(#ringA)" strokeWidth="8" strokeLinecap="round" />
                <path d="M398 260 L330 260" stroke="url(#ringA)" strokeWidth="8" strokeLinecap="round" />
                <path d="M260 398 L260 330" stroke="url(#ringA)" strokeWidth="8" strokeLinecap="round" />
                <path d="M122 260 L190 260" stroke="url(#ringA)" strokeWidth="8" strokeLinecap="round" />

                <path d="M152 152 L210 210" stroke="url(#ringB)" strokeWidth="7" strokeLinecap="round" />
                <path d="M368 152 L310 210" stroke="url(#ringB)" strokeWidth="7" strokeLinecap="round" />
                <path d="M152 368 L210 310" stroke="url(#ringB)" strokeWidth="7" strokeLinecap="round" />
                <path d="M368 368 L310 310" stroke="url(#ringB)" strokeWidth="7" strokeLinecap="round" />

                <circle cx="260" cy="260" r="30" fill="url(#ringB)" />
                <circle cx="260" cy="260" r="56" stroke="url(#ringB)" strokeWidth="4" fill="none" strokeDasharray="10 14" className="logo-dash" />
              </g>

              <g className="logo-sweepA">
                <path d="M260 52 C365 52 454 118 488 214" stroke="url(#ringA)" strokeWidth="5" strokeLinecap="round" opacity="0.4" fill="none" />
              </g>
              <g className="logo-sweepB">
                <path d="M260 468 C155 468 66 402 32 306" stroke="url(#ringB)" strokeWidth="5" strokeLinecap="round" opacity="0.36" fill="none" />
              </g>
            </svg>

            <div style={styles.visualCaption}>
              <div style={styles.capLine} />
              <div style={styles.capText}>Live Network Core</div>
              <div style={styles.capLine} />
            </div>
          </div>
        </div>

        <div style={styles.formCol}>
          <div
            style={{
              ...styles.cardGlow,
              opacity: mouse.active ? 1 : 0.74,
              transform: mouse.active
                ? `translate(${(mouse.x - 50) * 0.12}px, ${(mouse.y - 50) * 0.1}px)`
                : "translate(0,0)",
            }}
          />

          <div
            style={{
              ...styles.card,
              boxShadow: mouse.active
                ? "0 30px 90px rgba(0,0,0,.62), 0 0 0 1px rgba(96,165,250,.18), 0 0 36px rgba(56,189,248,.14)"
                : "0 24px 70px rgba(0,0,0,.56), 0 0 0 1px rgba(148,163,184,.08)",
            }}
          >
            <div
              style={{
                ...styles.cardAura,
                background: mouse.active
                  ? `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(56,189,248,.13), rgba(99,102,241,.07) 18%, rgba(0,0,0,0) 56%)`
                  : "radial-gradient(circle at 50% 50%, rgba(56,189,248,.06), rgba(0,0,0,0) 56%)",
              }}
            />

            <div style={styles.kicker}>NoComment Network</div>
            <h1 style={styles.title}>Access Portal</h1>
            <div style={styles.sub}>Enter the operations control layer</div>

            <form onSubmit={submit}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={styles.input}
                />
              </div>

              {err ? <div style={styles.err}>{err}</div> : null}

              <button type="submit" style={styles.button}>
                Enter Dashboard
              </button>

              <div style={styles.footer}>Protected Network Control Access</div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .pulse-line {
          animation: pulseLine 0.8s ease-out forwards;
        }

        .logo-rotor {
          transform-origin: 260px 260px;
          animation: logoSpin 12s linear infinite;
        }

        .logo-dash {
          transform-origin: 260px 260px;
          animation: logoDash 8s linear infinite reverse;
        }

        .logo-sweepA {
          animation: logoSweepA 2.8s ease-in-out infinite;
        }

        .logo-sweepB {
          animation: logoSweepB 3.3s ease-in-out infinite;
        }

        @keyframes pulseLine {
          0% {
            opacity: 1;
            stroke-dashoffset: 12;
          }
          100% {
            opacity: 0;
            stroke-dashoffset: 0;
          }
        }

        @keyframes logoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes logoDash {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes logoSweepA {
          0%, 100% { opacity: 0.22; }
          50% { opacity: 0.62; }
        }

        @keyframes logoSweepB {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.48; }
        }

        input:focus {
          outline: none;
          border-color: rgba(96,165,250,.60) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.08), 0 0 22px rgba(56,189,248,.11);
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(34,211,238,.14);
        }

        button:active {
          transform: translateY(0);
        }

        @media (max-width: 980px) {
          .login-stack {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }

        @media (max-width: 980px) {
          .login-visual {
            min-height: 300px !important;
          }
        }

        @media (max-width: 680px) {
          .login-visual {
            min-height: 240px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#030712",
    padding: "20px",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(115deg, rgba(3,7,18,1) 0%, rgba(4,10,24,1) 40%, rgba(7,16,38,1) 100%)",
  },
  gridGlow: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    opacity: 0.08,
    WebkitMaskImage: "radial-gradient(circle at center, black 45%, transparent 95%)",
    maskImage: "radial-gradient(circle at center, black 45%, transparent 95%)",
  },
  leftGlow: {
    position: "absolute",
    width: "680px",
    height: "680px",
    borderRadius: "999px",
    left: "-220px",
    top: "-180px",
    background: "radial-gradient(circle, rgba(37,99,235,.18), rgba(37,99,235,0) 68%)",
    filter: "blur(44px)",
  },
  rightGlow: {
    position: "absolute",
    width: "640px",
    height: "640px",
    borderRadius: "999px",
    right: "-180px",
    bottom: "-180px",
    background: "radial-gradient(circle, rgba(34,211,238,.12), rgba(34,211,238,0) 68%)",
    filter: "blur(44px)",
  },
  scanline: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0) 8%, rgba(255,255,255,0.02) 100%)",
    pointerEvents: "none",
    opacity: 0.18,
  },
  net: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0.92,
  },
  mouseGlow: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    transform: "translate(-50%, -50%)",
    background: "radial-gradient(circle, rgba(56,189,248,.10), rgba(56,189,248,0) 70%)",
    filter: "blur(22px)",
    pointerEvents: "none",
    transition: "opacity .16s ease",
  },
  shell: {
    position: "relative",
    zIndex: 3,
    width: "100%",
    maxWidth: "1240px",
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: "34px",
    alignItems: "center",
  },
  visualCol: {
    position: "relative",
    minHeight: "620px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  visualFrame: {
    position: "relative",
    width: "100%",
    maxWidth: "680px",
    aspectRatio: "1 / 1",
    borderRadius: "34px",
    background: "linear-gradient(180deg, rgba(8,14,28,.52), rgba(4,8,18,.22))",
    border: "1px solid rgba(103,232,249,.12)",
    boxShadow: "0 0 0 1px rgba(255,255,255,.03), 0 0 80px rgba(56,189,248,.06), inset 0 1px 0 rgba(255,255,255,.04)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  visualGlass: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 50%, rgba(56,189,248,.06), rgba(0,0,0,0) 56%)",
    pointerEvents: "none",
  },
  logoSvg: {
    width: "78%",
    height: "78%",
    display: "block",
  },
  visualCaption: {
    position: "absolute",
    left: "50%",
    bottom: "28px",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    width: "72%",
  },
  capLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(103,232,249,.55), rgba(0,0,0,0))",
  },
  capText: {
    color: "#90a8c7",
    fontSize: "12px",
    letterSpacing: ".22em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  formCol: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    inset: "-28px",
    borderRadius: "38px",
    background: "radial-gradient(circle at center, rgba(56,189,248,.09), rgba(0,0,0,0) 64%)",
    filter: "blur(24px)",
    transition: "transform .12s ease-out, opacity .16s ease",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "424px",
    padding: "36px",
    borderRadius: "30px",
    background: "linear-gradient(180deg, rgba(6,11,23,.94), rgba(2,6,18,.98))",
    border: "1px solid rgba(90,166,255,.14)",
    overflow: "hidden",
    backdropFilter: "blur(24px)",
    transition: "box-shadow .16s ease",
  },
  cardAura: {
    position: "absolute",
    inset: "-25%",
    pointerEvents: "none",
  },
  kicker: {
    position: "relative",
    zIndex: 1,
    color: "#7dd3fc",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".24em",
    textTransform: "uppercase",
    marginBottom: "18px",
  },
  title: {
    position: "relative",
    zIndex: 1,
    margin: 0,
    color: "#f8fafc",
    fontSize: "44px",
    fontWeight: 900,
    lineHeight: 0.96,
    letterSpacing: "-.055em",
  },
  sub: {
    position: "relative",
    zIndex: 1,
    marginTop: "12px",
    marginBottom: "30px",
    color: "#93a4bc",
    fontSize: "14px",
  },
  field: {
    position: "relative",
    zIndex: 1,
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#d3deea",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: "58px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,.14)",
    background: "rgba(2,6,23,.82)",
    color: "#f8fafc",
    padding: "0 18px",
    boxSizing: "border-box",
    fontSize: "15px",
    transition: "all .16s ease",
  },
  err: {
    position: "relative",
    zIndex: 1,
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(127,29,29,.22)",
    border: "1px solid rgba(248,113,113,.18)",
    color: "#fecaca",
    fontSize: "13px",
    fontWeight: 700,
  },
  button: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    height: "60px",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    letterSpacing: ".03em",
    color: "#04111f",
    background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 46%, #818cf8 100%)",
    transition: "all .16s ease",
    marginTop: "6px",
  },
  footer: {
    position: "relative",
    zIndex: 1,
    marginTop: "16px",
    color: "#64748b",
    fontSize: "11px",
    letterSpacing: ".16em",
    textTransform: "uppercase",
  },
};


