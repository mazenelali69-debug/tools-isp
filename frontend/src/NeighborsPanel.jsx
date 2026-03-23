import React, { useState } from "react";

function monoStyle(){
  return {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  };
}

export default function NeighborsPanel(){
  const [scanCidr, setScanCidr] = useState("88.88.88.0/24");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanErr, setScanErr] = useState("");
  const [scanAlive, setScanAlive] = useState([]);
  const [scanMeta, setScanMeta] = useState({ cidr:"", count:0, aliveCount:0 });

  async function scanNow(){
    const c = String(scanCidr || "").trim();
    if(!c){
      setScanErr("Enter a CIDR, e.g. 88.88.88.0/24");
      return;
    }

    setScanLoading(true);
    setScanErr("");

    try{
      const url = "/api/ping-scan?cidr=" + encodeURIComponent(c);
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();

      if(!r.ok || !j || j.ok === false){
        throw new Error((j && j.error) ? j.error : ("HTTP " + r.status));
      }

      const alive = Array.isArray(j.alive) ? j.alive : (j.alive ? [j.alive] : []);
      setScanAlive(alive);
      setScanMeta({
        cidr: j.cidr || c,
        count: j.count || 0,
        aliveCount: j.aliveCount || alive.length
      });
    } catch(e){
      setScanErr(String(e && e.message ? e.message : e));
      setScanAlive([]);
      setScanMeta({ cidr: c, count: 0, aliveCount: 0 });
    } finally {
      setScanLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>
          Neighbors
        </div>
        <div style={{ opacity: 0.68, fontSize: 14 }}>
          CIDR ping scan tool
        </div>
      </div>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          padding: 18,
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
            background: "radial-gradient(circle at top right, rgba(0,255,220,.08), transparent 35%), radial-gradient(circle at bottom left, rgba(90,110,255,.08), transparent 35%)"
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Ping Scan (CIDR)</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {scanMeta && scanMeta.cidr
                ? <span>Alive: <b>{scanMeta.aliveCount}</b> / {scanMeta.count} ({scanMeta.cidr})</span>
                : <span>Example: 88.88.88.0/24 or 155.15.59.0/24</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={scanCidr}
              onChange={(e)=>setScanCidr(e.target.value)}
              placeholder="88.88.88.0/24"
              style={{
                flex: "1 1 320px",
                minWidth: 0,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.04)",
                color: "white"
              }}
            />

            <button
              onClick={scanNow}
              disabled={scanLoading}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.14)",
                background: "rgba(255,255,255,.05)",
                color: "white",
                fontWeight: 900,
                cursor: scanLoading ? "not-allowed" : "pointer"
              }}
            >
              {scanLoading ? "Scanning..." : "Scan"}
            </button>

            <button
              onClick={() => {
                try{
                  const t = (scanAlive || []).join("`n");
                  navigator.clipboard.writeText(t);
                } catch {}
              }}
              disabled={!scanAlive || !scanAlive.length}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.14)",
                background: "rgba(255,255,255,.03)",
                color: "white",
                fontWeight: 900,
                cursor: (!scanAlive || !scanAlive.length) ? "not-allowed" : "pointer",
                opacity: (!scanAlive || !scanAlive.length) ? 0.6 : 1
              }}
            >
              Copy Alive IPs
            </button>
          </div>

          {scanErr ? (
            <div
              style={{
                marginTop: 12,
                color: "#ffb3b3",
                background: "rgba(255,90,90,.08)",
                border: "1px solid rgba(255,90,90,.18)",
                borderRadius: 12,
                padding: 12,
                whiteSpace: "pre-wrap"
              }}
            >
              {scanErr}
            </div>
          ) : null}

          {scanAlive && scanAlive.length ? (
            <div
              style={{
                marginTop: 14,
                maxHeight: 360,
                overflow: "auto",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.10)",
                padding: 10,
                background: "rgba(255,255,255,.03)"
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                {scanAlive.map((ip) => (
                  <div
                    key={ip}
                    style={{
                      ...monoStyle(),
                      fontSize: 12,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.02)"
                    }}
                  >
                    {ip}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 14,
                opacity: 0.65,
                fontSize: 13
              }}
            >
              Enter a CIDR range, then press Scan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




