import { useEffect, useMemo, useRef, useState } from "react";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "morad3alamdar";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeNodes(count = 52) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand(2, 98),
    y: rand(4, 96),
    r: rand(0.12, 0.22),
  }));
}

function makeEdges(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 16) {
        edges.push({
          id: `${i}-${j}`,
          a: nodes[i],
          b: nodes[j],
          opacity: Math.max(0.04, 0.16 - d / 140),
        });
      }
    }
  }
  return edges.slice(0, 140);
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
      <div style={styles.vignette} />
      <div style={styles.leftGlow} />
      <div style={styles.rightGlow} />

      <svg style={styles.net} viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.a.x}
            y1={edge.a.y}
            x2={edge.b.x}
            y2={edge.b.y}
            stroke="rgba(56,189,248,0.22)"
            strokeWidth="0.08"
            opacity={edge.opacity}
          />
        ))}

        {nodes.map((n) => {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = mouse.active && d < 13;

          return (
            <g key={n.id}>
              {near ? (
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={mouse.x}
                  y2={mouse.y}
                  stroke="rgba(125,211,252,0.32)"
                  strokeWidth="0.10"
                  opacity={Math.max(0.12, 1 - d / 13)}
                />
              ) : null}
              <circle
                cx={n.x}
                cy={n.y}
                r={near ? n.r * 1.8 : n.r}
                fill={near ? "rgba(125,211,252,0.95)" : "rgba(125,211,252,0.48)"}
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
            stroke="rgba(56,189,248,0.95)"
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

      <div style={styles.center}>
        <div
          style={{
            ...styles.cardGlow,
            opacity: mouse.active ? 1 : 0.7,
            transform: mouse.active
              ? `translate(${(mouse.x - 50) * 0.18}px, ${(mouse.y - 50) * 0.14}px)`
              : "translate(0,0)",
          }}
        />
        <div
          style={{
            ...styles.card,
            boxShadow: mouse.active
              ? "0 30px 90px rgba(0,0,0,.62), 0 0 0 1px rgba(96,165,250,.18), 0 0 36px rgba(56,189,248,.12)"
              : "0 24px 70px rgba(0,0,0,.56), 0 0 0 1px rgba(148,163,184,.08)",
          }}
        >
          <div
            style={{
              ...styles.cardAura,
              background: mouse.active
                ? `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(56,189,248,.12), rgba(59,130,246,.06) 20%, rgba(0,0,0,0) 56%)`
                : "radial-gradient(circle at 50% 50%, rgba(56,189,248,.05), rgba(0,0,0,0) 56%)",
            }}
          />

          <div style={styles.kicker}>NoComment Network</div>
          <h1 style={styles.title}>Secure Access</h1>
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

      <style>{`
        .pulse-line {
          animation: pulseLine 0.8s ease-out forwards;
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

        input:focus {
          outline: none;
          border-color: rgba(96,165,250,.55) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.08), 0 0 22px rgba(56,189,248,.08);
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 32px rgba(34,211,238,.12);
        }

        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#020613",
    padding: "24px",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(3,8,20,1) 0%, rgba(2,6,18,1) 100%)",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,.34) 100%)",
  },
  leftGlow: {
    position: "absolute",
    width: "560px",
    height: "560px",
    borderRadius: "999px",
    left: "-180px",
    top: "-140px",
    background: "radial-gradient(circle, rgba(37,99,235,.14), rgba(37,99,235,0) 68%)",
    filter: "blur(28px)",
  },
  rightGlow: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "999px",
    right: "-160px",
    bottom: "-160px",
    background: "radial-gradient(circle, rgba(34,211,238,.08), rgba(34,211,238,0) 68%)",
    filter: "blur(30px)",
  },
  net: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },
  mouseGlow: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "999px",
    transform: "translate(-50%, -50%)",
    background: "radial-gradient(circle, rgba(56,189,248,.10), rgba(56,189,248,0) 70%)",
    filter: "blur(18px)",
    pointerEvents: "none",
    transition: "opacity .16s ease",
  },
  center: {
    position: "relative",
    zIndex: 3,
  },
  cardGlow: {
    position: "absolute",
    inset: "-30px",
    borderRadius: "36px",
    background: "radial-gradient(circle at center, rgba(56,189,248,.08), rgba(0,0,0,0) 64%)",
    filter: "blur(22px)",
    transition: "transform .12s ease-out, opacity .16s ease",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    width: "100%",
    maxWidth: "420px",
    padding: "36px",
    borderRadius: "28px",
    background: "linear-gradient(180deg, rgba(7,12,24,.92), rgba(3,8,18,.96))",
    border: "1px solid rgba(148,163,184,.10)",
    overflow: "hidden",
    backdropFilter: "blur(16px)",
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
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: ".24em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  title: {
    position: "relative",
    zIndex: 1,
    margin: 0,
    color: "#f8fafc",
    fontSize: "48px",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-.05em",
  },
  sub: {
    position: "relative",
    zIndex: 1,
    marginTop: "12px",
    marginBottom: "28px",
    color: "#93a4bc",
    fontSize: "15px",
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
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    height: "56px",
    borderRadius: "15px",
    border: "1px solid rgba(148,163,184,.14)",
    background: "rgba(2,6,23,.72)",
    color: "#f8fafc",
    padding: "0 16px",
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
    height: "58px",
    border: "none",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    letterSpacing: ".02em",
    color: "#04111f",
    background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 52%, #06b6d4 100%)",
    transition: "all .16s ease",
  },
  footer: {
    position: "relative",
    zIndex: 1,
    marginTop: "15px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "11px",
    letterSpacing: ".16em",
    textTransform: "uppercase",
  },
};






