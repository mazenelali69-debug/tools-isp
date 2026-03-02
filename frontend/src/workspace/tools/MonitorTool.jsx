import React, { useEffect, useMemo, useRef, useState } from "react";
import { io as ioClient } from "socket.io-client";

const API = window.location.origin.replace(/:\d+$/, ":9090");

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function fmtMbps(x){
  if(x == null || Number.isNaN(Number(x))) return "—";
  const n = Number(x);
  if(n >= 1000) return (n/1000).toFixed(2) + " Gbps";
  return n.toFixed(n >= 100 ? 1 : 2) + " Mbps";
}

function Spark({ data, height=34 }){
  const w = 220;
  const h = height;
  const pad = 2;
  const max = Math.max(1, ...data.map(x => Number(x)||0));
  const pts = data.map((v,i)=>{
    const x = pad + (i/(Math.max(1,data.length-1))) * (w - pad*2);
    const y = h - pad - (clamp((Number(v)||0)/max,0,1)) * (h - pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="wsMonSpark" viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke="rgba(120,200,255,.90)" strokeWidth="2" points={pts} />
    </svg>
  );
}

export default function MonitorTool({ win, onChange }) {
  const [ip, setIp] = useState(win.ip ?? "");
  const [community, setCommunity] = useState(win.community ?? "");
  const [ifIndex, setIfIndex] = useState(win.ifIndex ?? "");
  const [ifName, setIfName] = useState(win.ifName ?? "");
  const [loadingIfs, setLoadingIfs] = useState(false);
  const [ifs, setIfs] = useState([]);
  const [running, setRunning] = useState(!!win.monitorId);
  const [err, setErr] = useState("");

  const [down, setDown] = useState(null);
  const [up, setUp] = useState(null);
  const [histDown, setHistDown] = useState([]);
  const [histUp, setHistUp] = useState([]);

  const socketRef = useRef(null);
  const monIdRef = useRef(win.monitorId ?? null);

  // keep window state synced
  useEffect(() => { onChange?.({ ip }); }, [ip]);
  useEffect(() => { onChange?.({ community }); }, [community]);
  useEffect(() => { onChange?.({ ifIndex }); }, [ifIndex]);
  useEffect(() => { onChange?.({ ifName }); }, [ifName]);

  const canStart = useMemo(() => {
    return String(ip||"").trim() && String(community||"").trim() && String(ifIndex||"").trim();
  }, [ip,community,ifIndex]);

  async function loadIfs(){
    const tip = String(ip||"").trim();
    const tcom = String(community||"").trim();
    if(!tip || !tcom){ setErr("Enter IP + Community first"); return; }

    setErr("");
    setLoadingIfs(true);
    try{
      // robust endpoint (snmpwalk)
      let r = await fetch(API + "/api/interfaces-cli", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ip: tip, community: tcom })
      });
      let j = await r.json();
      if(!j?.ok || !Array.isArray(j.interfaces)){
        // fallback to /api/interfaces
        r = await fetch(API + "/api/interfaces", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ ip: tip, community: tcom })
        });
        j = await r.json();
      }

      const list = (j?.interfaces || j?.rows || j?.data || j?.ifaces || j?.result || j?.monitors || []);
      const normalized = Array.isArray(j?.interfaces) ? j.interfaces : (Array.isArray(j?.interfaces) ? j.interfaces : (Array.isArray(j?.interfaces) ? j.interfaces : []));
      const useList = Array.isArray(j?.interfaces) ? j.interfaces : (Array.isArray(j?.interfaces) ? j.interfaces : null);

      const ifList = Array.isArray(j?.interfaces)
        ? j.interfaces.map(x => ({ ifIndex: x.ifIndex, ifName: x.ifName || x.ifDescr || x.name || String(x.ifIndex) }))
        : (Array.isArray(j?.interfaces) ? j.interfaces : []);

      // If fallback /api/interfaces returns {interfaces:[{ifIndex,ifName,ifDescr,speed}]}
      if(ifList.length === 0 && Array.isArray(j?.interfaces)){
        // already handled
      }

      let final = ifList;
      if(final.length === 0 && Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false){
        // try common shape: {interfaces:[...]}
        if(Array.isArray(j?.interfaces)){
          final = j.interfaces.map(x => ({ ifIndex: x.ifIndex, ifName: x.ifName || x.ifDescr || x.name || String(x.ifIndex) }));
        }
        if(Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false){
          // ignore
        }
      }

      // last fallback if /api/interfaces used
      if(final.length === 0 && Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false){
        if(Array.isArray(j?.interfaces)) final = j.interfaces;
      }

      if(final.length === 0 && Array.isArray(j?.interfaces) === false){
        // /api/interfaces likely returns {ok:true, interfaces:[...]}
        if(Array.isArray(j?.interfaces)) final = j.interfaces;
        if(Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false){
          if(Array.isArray(j?.interfaces)) final = j.interfaces;
        }
      }

      // best-effort: if /api/interfaces returns {interfaces:[...]}
      if(final.length === 0 && Array.isArray(j?.interfaces) === false && Array.isArray(j?.interfaces) === false){
        if(Array.isArray(j?.interfaces)) final = j.interfaces;
      }

      // actual shapes:
      // /api/interfaces-cli => { ok:true, interfaces:[{ifIndex, ifName}] }
      // /api/interfaces     => { ok:true, interfaces:[{ifIndex, ifName, ifDescr, speed}] }
      if(final.length === 0 && Array.isArray(j?.interfaces) === false){
        if(Array.isArray(j?.interfaces)) final = j.interfaces;
      }

      // handle correct real shapes explicitly
      if(Array.isArray(j?.interfaces)){
        final = j.interfaces.map(x => ({ ifIndex: x.ifIndex, ifName: x.ifName || x.ifDescr || x.name || String(x.ifIndex) }));
      }

      if(final.length === 0){
        setErr("No interfaces returned");
        setIfs([]);
        return;
      }

      setIfs(final);

      // auto-select current ifIndex or first
      const current = String(ifIndex||"").trim();
      const pick = current ? final.find(x => String(x.ifIndex) === current) : final[0];
      if(pick){
        setIfIndex(String(pick.ifIndex));
        setIfName(String(pick.ifName || ("if"+pick.ifIndex)));
      }
    }catch(e){
      setErr(String(e?.message || e));
    }finally{
      setLoadingIfs(false);
    }
  }

  function ensureSocket(){
    if(socketRef.current) return socketRef.current;
    const s = ioClient(API, { transports: ["websocket","polling"] });
    socketRef.current = s;
    return s;
  }

  async function start(){
    const tip = String(ip||"").trim();
    const tcom = String(community||"").trim();
    const tif  = String(ifIndex||"").trim();
    if(!tip || !tcom || !tif){ setErr("ip + community + ifIndex required"); return; }

    setErr("");
    setDown(null); setUp(null);
    setHistDown([]); setHistUp([]);

    // create monitor on backend
    const r = await fetch(API + "/api/monitors", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ ip: tip, community: tcom, ifIndex: Number(tif), label: tip, intervalMs: 1000 })
    });
    const j = await r.json();
    if(!j?.ok || !j?.id){ setErr(j?.error || "Failed to start monitor"); return; }

    monIdRef.current = j.id;
    onChange?.({ monitorId: j.id, title: "Monitor — " + tip + (ifName?(" ("+ifName+")"):"") });

    const s = ensureSocket();
    setRunning(true);

    s.off("monitor:update");
    s.on("monitor:update", (msg) => {
      if(!msg || msg.id !== monIdRef.current) return;
      if(msg.ok === false){
        setErr(msg.error || "Monitor error");
        return;
      }
      setErr("");
      const d = Number(msg.down_mbps);
      const u = Number(msg.up_mbps);
      setDown(d); setUp(u);
      setHistDown(prev => [...prev, d].slice(-80));
      setHistUp(prev => [...prev, u].slice(-80));
    });

    s.off("monitor:stopped");
    s.on("monitor:stopped", (msg) => {
      if(!msg || msg.id !== monIdRef.current) return;
      monIdRef.current = null;
      onChange?.({ monitorId: null });
      setRunning(false);
    });
  }

  async function stop(){
    const id = monIdRef.current;
    if(!id){
      setRunning(false);
      return;
    }
    try{
      await fetch(API + "/api/monitors/" + encodeURIComponent(id), { method:"DELETE" });
    }catch{}
    monIdRef.current = null;
    onChange?.({ monitorId: null });
    setRunning(false);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try{ socketRef.current?.close(); }catch{}
      socketRef.current = null;
      // stop backend monitor if still running
      const id = monIdRef.current;
      if(id){
        fetch(API + "/api/monitors/" + encodeURIComponent(id), { method:"DELETE" }).catch(()=>{});
      }
      monIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wsMonRoot">
      <div className="wsMonTop">
        <div className="wsMonField">
          <div className="wsMonLbl">IP</div>
          <input className="wsMonIn" value={ip} onChange={(e)=>setIp(e.target.value)} placeholder="192.168.1.1" />
        </div>

        <div className="wsMonField">
          <div className="wsMonLbl">Community</div>
          <input className="wsMonIn" value={community} onChange={(e)=>setCommunity(e.target.value)} placeholder="public" />
        </div>

        <div className="wsMonField">
          <div className="wsMonLbl">Interface</div>
          <select className="wsMonSel" value={String(ifIndex||"")} onChange={(e)=> {
            const v = e.target.value;
            setIfIndex(v);
            const pick = ifs.find(x => String(x.ifIndex) === String(v));
            setIfName(pick ? String(pick.ifName) : "");
          }}>
            {(ifs.length ? ifs : [{ifIndex:"", ifName:"(load interfaces)"}]).map((x,idx)=>(
              <option key={idx} value={String(x.ifIndex)}>{String(x.ifName)} (#{String(x.ifIndex)})</option>
            ))}
          </select>
        </div>

        <div className="wsMonBtns">
          <button className="wsMonBtn ghost" onClick={loadIfs} disabled={loadingIfs}>
            {loadingIfs ? "Loading..." : "Load IFs"}
          </button>

          {!running ? (
            <button className="wsMonBtn" onClick={start} disabled={!canStart}>Start</button>
          ) : (
            <button className="wsMonBtn danger" onClick={stop}>Stop</button>
          )}
        </div>
      </div>

      {err ? <div className="wsMonErr">⚠ {err}</div> : null}

      <div className="wsMonCards">
        <div className="wsMonCard">
          <div className="wsMonCardTop">
            <div className="wsMonCardTitle">Download</div>
            <div className="wsMonCardVal">{fmtMbps(down)}</div>
          </div>
          <Spark data={histDown} />
        </div>

        <div className="wsMonCard">
          <div className="wsMonCardTop">
            <div className="wsMonCardTitle">Upload</div>
            <div className="wsMonCardVal">{fmtMbps(up)}</div>
          </div>
          <Spark data={histUp} />
        </div>
      </div>

      <div className="wsMonFoot">
        <div className="wsMonHint">
          Tip: حمّل interfaces، اختار ifIndex، بعدين Start. بيجيك live Mbps.
        </div>
      </div>
    </div>
  );
}
