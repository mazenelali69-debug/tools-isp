import React, { useEffect, useMemo, useState } from "react";
/* NEI-BADGE-HELPER-START */
function neiBadgeClass(src){
  const s = String(src || "");
  if(s === "ARP+ICMP") return "badge both";
  if(s === "ICMP") return "badge icmp";
  return "badge arp";
}
/* NEI-BADGE-HELPER-END */

export default function NeighborsPanel(){
  const [data, setData] = useState({ subnets: [], neighbors: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [cidr, setCidr] = useState("ALL");

  /* PING-SCAN-UI-START */
  // Ping-scan UI state (/api/ping-scan?cidr=...)
  const [scanCidr, setScanCidr] = useState("88.88.88.0/24");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanErr, setScanErr] = useState("");
  const [scanAlive, setScanAlive] = useState([]);
  const [scanMeta, setScanMeta] = useState({ cidr:"", count:0, aliveCount:0 });
  /* PING-SCAN-UI-END */
  async function load(mode){
    setLoading(true);
    setErr("");
    try{
      const r = await fetch("/api/neighbors", { cache: "no-store" });
      const j = await r.json();
      if(!r.ok || !j || j.ok === false) throw new Error((j && j.error) ? j.error : ("HTTP " + r.status));
      setData({
        subnets: Array.isArray(j.subnets) ? j.subnets : (j.subnets ? [j.subnets] : []),
        neighbors: Array.isArray(j.neighbors) ? j.neighbors : (j.neighbors ? [j.neighbors] : []),
        discovered: Array.isArray(j.discovered) ? j.discovered : (j.discovered ? [j.discovered] : []),
      });
    } catch(e){
      setErr(String(e && e.message ? e.message : e));
    } finally {
      setLoading(false);
    }
  }
  /* PING-SCAN-FN-START */
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
      if(!r.ok || !j || j.ok === false) throw new Error((j && j.error) ? j.error : ("HTTP " + r.status));
      const alive = Array.isArray(j.alive) ? j.alive : (j.alive ? [j.alive] : []);
      setScanAlive(alive);
      setScanMeta({ cidr: j.cidr || c, count: j.count || 0, aliveCount: j.aliveCount || alive.length });
    }catch(e){
      setScanErr(String(e && e.message ? e.message : e));
      setScanAlive([]);
      setScanMeta({ cidr: c, count: 0, aliveCount: 0 });
    }finally{
      setScanLoading(false);
    }
  }
  /* PING-SCAN-FN-END */
useEffect(() => { load("refresh"); }, []);

  const subnetOptions = useMemo(() => {
    const s = data.subnets || [];
    const unique = new Map();
    for(const x of s){
      if(x && x.cidr) unique.set(x.cidr, x);
    }
    return Array.from(unique.keys());
  }, [data.subnets]);

  const rows = useMemo(() => {
  /* NEI-MERGE-ARP-ICMP-START */
  // Merge ARP neighbors + ICMP discovered into one list with a source badge.
  const __arpList  = (data && data['neighbors'])  ? data['neighbors']  : [];
  const __icmpList = (data && data['discovered']) ? data['discovered'] : [];

  const __map = new Map();

  // ARP first
  for (const n of __arpList) {
    if(!n || !n.ip) continue;
    __map.set(n.ip, { ...n, source: "ARP" });
  }

  // ICMP merge
  for (const d of __icmpList) {
    if(!d || !d.ip) continue;

    if (__map.has(d.ip)) {
      __map.set(d.ip, { ...__map.get(d.ip), source: "ARP+ICMP" });
    } else {
      __map.set(d.ip, { ip: d.ip, mac: "-", state: "-", ifIndex: null, source: "ICMP" });
    }
  }

  const mergedList = Array.from(__map.values()).sort((a, b) => {
    const pa = String(a.ip || "").split(".").map(x => parseInt(x,10));
    const pb = String(b.ip || "").split(".").map(x => parseInt(x,10));
    for (let i=0;i<4;i++){
      const da = isNaN(pa[i]) ? 0 : pa[i];
      const db = isNaN(pb[i]) ? 0 : pb[i];
      if (da !== db) return da - db;
    }
    return 0;
  });
  /* NEI-MERGE-ARP-ICMP-END */
    const list = mergedList || [];
    const qq = q.trim().toLowerCase();
    return list.filter(n => {
      if(!n) return false;
      if(cidr !== "ALL"){
        // best-effort: if backend later adds cidr on neighbor rows; if not, we just don't filter
        if(n.cidr && n.cidr !== cidr) return false;
      }
      if(!qq) return true;
      const s = `$<>
  {n.ip || ""}
  <span className={neiBadgeClass(n.source)}>
    {n.source || ""}
  </span>
</> ${n.mac||""} ${n.state||""} ${n.ifIndex||""}`.toLowerCase();
      return s.includes(qq);
    });
  }, [data.neighbors, data.discovered, q, cidr]);

  return (
    <div className="panel">
      <div className="panelHead" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
        <div style={{display:"flex", alignItems:"baseline", gap:10}}>
          <div style={{fontWeight:900, fontSize:16}}>Neighbors</div>
          <div style={{opacity:.7, fontSize:12}}>
            {loading ? "Loading…" : `${rows.length} devices`}
          </div>
        </div>

        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <select
            value={cidr}
            onChange={(e)=>setCidr(e.target.value)}
            title="Subnet"
            style={{padding:"6px 8px", borderRadius:10}}
          >
            <option value="ALL">All subnets</option>
            {subnetOptions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>

          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search IP / MAC / state…"
            style={{padding:"6px 10px", borderRadius:10, minWidth:220}}
          />

          <button className="btn" onClick={()=>load("discover")} disabled={loading} title="Discover / Scan" style={{fontWeight:900}}>
              {loading ? "…" : "Discover"}
            </button>
            <button className="btn" onClick={()=>load("refresh")} disabled={loading} title="Refresh">
              {loading ? "…" : "Refresh"}
            </button>
        </div>
      </div>

      {err ? (
        <div className="panelErr" style={{marginTop:10, padding:10, borderRadius:12}}>
          {err}
        </div>
      ) : null}

      <div className="panelBody" style={{marginTop:10}}>
        <div className="neiTableWrap" style={{maxHeight:"65vh", overflowY:"auto", overflowX:"auto", borderRadius:14}}>
        /* PING-SCAN-RENDER-START */
        <div style={{margin:"10px 0 14px 0", padding:"10px", border:"1px solid rgba(255,255,255,.10)", borderRadius:12, background:"rgba(255,255,255,.03)"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap"}}>
            <div style={{fontWeight:800}}>Ping Scan (CIDR)</div>
            <div style={{fontSize:12, opacity:.75}}>
              {scanMeta && scanMeta.cidr ? (
                <span>Alive: <b>{scanMeta.aliveCount}</b> / {scanMeta.count} ({scanMeta.cidr})</span>
              ) : (
                <span>Example: 88.88.88.0/24 or 155.15.59.0/24</span>
              )}
            </div>
          </div>

          <div style={{display:"flex", gap:10, marginTop:10, alignItems:"center", flexWrap:"wrap"}}>
            <input
              value={scanCidr}
              onChange={(e)=>setScanCidr(e.target.value)}
              placeholder="88.88.88.0/24"
              style={{flex:"1 1 260px", minWidth:220, padding:"8px 10px", borderRadius:10, border:"1px solid rgba(255,255,255,.14)", background:"rgba(0,0,0,.22)", color:"inherit"}}
            />
            <button
              onClick={scanNow}
              disabled={scanLoading}
              style={{padding:"8px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.06)", cursor: scanLoading ? "not-allowed" : "pointer", fontWeight:800}}
            >
              {scanLoading ? "Scanning..." : "Scan"}
            </button>

            <button
              onClick={()=>{
                try{
                  const t = (scanAlive || []).join("\n");
                  navigator.clipboard.writeText(t);
                }catch{}
              }}
              disabled={!scanAlive || !scanAlive.length}
              style={{padding:"8px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.03)", cursor: (!scanAlive || !scanAlive.length) ? "not-allowed" : "pointer", fontWeight:800, opacity: (!scanAlive || !scanAlive.length) ? .6 : 1}}
            >
              Copy Alive IPs
            </button>
          </div>

          {scanErr ? (
            <div style={{marginTop:10, color:"#ffb3b3", fontSize:12, whiteSpace:"pre-wrap"}}>{scanErr}</div>
          ) : null}

          {scanAlive && scanAlive.length ? (
            <div style={{marginTop:10, maxHeight:180, overflow:"auto", borderRadius:10, border:"1px solid rgba(255,255,255,.10)", padding:"8px", background:"rgba(0,0,0,.18)"}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:6}}>
                {scanAlive.map((ip)=>(
                  <div key={ip} style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize:12, padding:"4px 6px", borderRadius:8, border:"1px solid rgba(255,255,255,.08)"}}>
                    {ip}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        /* PING-SCAN-RENDER-END */

          <table className="table" style={{width:"100%", borderCollapse:"separate", borderSpacing:0}}>
            <thead>
              <tr>
                <th style={{textAlign:"left", padding:"10px"}}>IP</th>
                <th style={{textAlign:"left", padding:"10px"}}>MAC</th>
                <th style={{textAlign:"left", padding:"10px"}}>State</th>
                <th style={{textAlign:"left", padding:"10px"}}>IfIndex</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n, i) => (
                <tr key={(n.ip||"") + "-" + i}>
                  <td style={{padding:"10px", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"}}><>
  {n.ip || ""}
  <span className={neiBadgeClass(n.source)}>
    {n.source || ""}
  </span>
</></td>
                  <td style={{padding:"10px", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"}}>{n.mac || ""}</td>
                  <td style={{padding:"10px"}}>{n.state || ""}</td>
                  <td style={{padding:"10px"}}>{String(n.ifIndex ?? "")}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan="4" style={{padding:"14px", opacity:.7}}>No neighbors found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:10, fontSize:12, opacity:.65}}>
          Tip: Neighbors table depends on ARP cache; if you want “WinBox-like discovery”, we can add an optional ping-sweep later.
        </div>
      </div>
    </div>
  );
}





