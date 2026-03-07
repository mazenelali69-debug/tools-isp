import { useEffect, useState } from "react";

const API_BASE = "";

function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMbps(v){
  const n = num(v);
  if(n >= 1000) return (n / 1000).toFixed(2) + " Gbps";
  return n.toFixed(2) + " Mbps";
}


function TrafficBar({value,color}){

  const v=Math.min(100,value/10)

  return(
    <div style={{
      height:6,
      background:"rgba(255,255,255,.06)",
      borderRadius:20,
      overflow:"hidden",
      marginTop:6,
      marginBottom:12
    }}>
      <div style={{
        width:v+"%",
        height:"100%",
        background:color,
        boxShadow:"0 0 8px "+color,
        transition:"width .5s"
      }}/>
    </div>
  )

}

function Metric({ label, value, accent }){
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        marginBottom: 10
      }}
    >
      <div style={{ opacity: 0.82, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || "white" }}>
        {fmtMbps(value)}<TrafficBar value={value} color={accent}/>
      </div>
    </div>
  );
}

function Card({ title, subtitle, rx, tx, total, error, large = false }){
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: large ? 24 : 20,
        minHeight: large ? 230 : 210,
        background: "linear-gradient(180deg, rgba(12,16,26,.95), rgba(8,11,18,.92))",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 18px 40px rgba(0,0,0,.22)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(0,255,220,.10), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.10), transparent 35%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: large ? 30 : 22, fontWeight: 900, marginBottom: 6 }}>
          {title}
        </div>

        {subtitle ? (
          <div style={{ opacity: 0.68, marginBottom: 18, fontSize: 14 }}>
            {subtitle}
          </div>
        ) : null}

        <Metric label="RX" value={rx} accent="#00f5d4" />
        <Metric label="TX" value={tx} accent="#7aa2ff" />
        <Metric label="Total" value={total} accent="#ffb84d" />

        {error ? (
          <div
            style={{
              marginTop: 12,
              color: "#ff7272",
              background: "rgba(255,90,90,.08)",
              border: "1px solid rgba(255,90,90,.18)",
              borderRadius: 12,
              padding: 12,
              whiteSpace: "pre-wrap"
            }}
          >
            Error: {String(error)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AviatWTM4200Page(){
  const [data, setData] = useState({
    combined: { rxMbps: 0, txMbps: 0, totalMbps: 0 },
    switchA: { rxMbps: 0, txMbps: 0, totalMbps: 0, ip: "10.88.88.254" },
    switchB: { rxMbps: 0, txMbps: 0, totalMbps: 0, ip: "88.88.88.254" }
  });
  const [err, setErr] = useState("");

  async function load(){
    try{
      setErr("");

      const r = await fetch(API_BASE + "/api/aviatwtm4200/live", { cache: "no-store" });
      const j = await r.json();

      if(!j?.ok){
        throw new Error(j?.error || "AviatWTM4200 live failed");
      }

      setData({
        combined: {
          rxMbps: num(j?.combined?.rxMbps),
          txMbps: num(j?.combined?.txMbps),
          totalMbps: num(j?.combined?.totalMbps)
        },
        switchA: {
          rxMbps: num(j?.switchA?.rxMbps),
          txMbps: num(j?.switchA?.txMbps),
          totalMbps: num(j?.switchA?.totalMbps),
          ip: j?.switchA?.ip || "10.88.88.254",
          error: j?.switchA?.error || ""
        },
        switchB: {
          rxMbps: num(j?.switchB?.rxMbps),
          txMbps: num(j?.switchB?.txMbps),
          totalMbps: num(j?.switchB?.totalMbps),
          ip: j?.switchB?.ip || "88.88.88.254",
          error: j?.switchB?.error || ""
        }
      });
    } catch(e){
      setErr(String(e?.message || e || "Unknown error"));
      setData({
        combined: { rxMbps: 0, txMbps: 0, totalMbps: 0 },
        switchA: { rxMbps: 0, txMbps: 0, totalMbps: 0, ip: "10.88.88.254" },
        switchB: { rxMbps: 0, txMbps: 0, totalMbps: 0, ip: "88.88.88.254" }
      });
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          AviatWTM4200
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          Live traffic overview for Switch A + Switch B
        </div>
      </div>

      <div style={{ maxWidth: 1200 }}>
        <div style={{ marginBottom: 18 }}>
          <Card
            title="Combined Traffic"
            subtitle="10.88.88.254 + 88.88.88.254"
            rx={data.combined.rxMbps}
            tx={data.combined.txMbps}
            total={data.combined.totalMbps}
            error={err}
            large={true}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 18
          }}
        >
          <Card
            title="vlan1559"
            subtitle={data.switchB.ip || "88.88.88.254"}
            rx={data.switchB.rxMbps}
            tx={data.switchB.txMbps}
            total={data.switchB.totalMbps}
            error={data.switchB.error}
          />

          <Card
            title="vlan2430"
            subtitle={data.switchA.ip || "10.88.88.254"}
            rx={data.switchA.rxMbps}
            tx={data.switchA.txMbps}
            total={data.switchA.totalMbps}
            error={data.switchA.error}
          />
        </div>
      </div>
    </div>
  );
}


