import { useEffect, useState } from "react";

export default function LoginPage({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  function submit(e) {
    e.preventDefault();
    if (u === "admin" && p === "morad3alamdar") {
      ;
      onLogin?.();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg} />

      <div style={styles.particles}>
        {Array.from({ length: 80 }).map((_, i) => (
          <span key={i} style={{
            left: Math.random()*100+"%",
            top: Math.random()*100+"%",
            animationDelay: (Math.random()*5)+"s"
          }} />
        ))}
      </div>

      <div style={styles.centerBox}>
        <div style={styles.glow} />

        <form onSubmit={submit} style={styles.card}>
          <h2 style={styles.title}>LOGIN</h2>

          <input
            placeholder="Username"
            value={u}
            onChange={e=>setU(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Password"
            type="password"
            value={p}
            onChange={e=>setP(e.target.value)}
            style={styles.input}
          />

          <button style={styles.btn}>Enter</button>
        </form>
      </div>

      <style>{`
        span {
          position:absolute;
          width:2px;
          height:2px;
          background:#38bdf8;
          opacity:.5;
          animation: float 6s linear infinite;
        }

        @keyframes float {
          0% { transform: translateY(0); opacity:.2 }
          50% { opacity:1 }
          100% { transform: translateY(-40px); opacity:.2 }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page:{
    height:"100vh",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    background:"#020617",
    position:"relative",
    overflow:"hidden"
  },

  bg:{
    position:"absolute",
    inset:0,
    background:"radial-gradient(circle at center,#0ea5e9 0%,#020617 60%)",
    opacity:.15
  },

  particles:{
    position:"absolute",
    inset:0
  },

  centerBox:{
    position:"relative",
    zIndex:2
  },

  glow:{
    position:"absolute",
    inset:"-20px",
    borderRadius:"30px",
    background:"linear-gradient(90deg,#38bdf8,#818cf8)",
    filter:"blur(30px)",
    opacity:.4
  },

  card:{
    width:"320px",
    padding:"40px",
    borderRadius:"24px",
    background:"#020617",
    border:"1px solid rgba(56,189,248,.4)",
    display:"flex",
    flexDirection:"column",
    gap:"15px",
    boxShadow:"0 0 30px rgba(56,189,248,.3)"
  },

  title:{
    color:"#e2e8f0",
    textAlign:"center"
  },

  input:{
    height:"45px",
    borderRadius:"10px",
    border:"1px solid #1e293b",
    background:"#020617",
    color:"#fff",
    padding:"0 10px"
  },

  btn:{
    height:"45px",
    borderRadius:"10px",
    border:"none",
    background:"linear-gradient(90deg,#38bdf8,#818cf8)",
    color:"#020617",
    fontWeight:"bold",
    cursor:"pointer"
  }
};




