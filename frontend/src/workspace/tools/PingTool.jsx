import React, { useEffect, useMemo, useRef, useState } from "react";

// same backend port convention used in legacy
const API = window.location.origin.replace(/:\d+$/, ":9090");

function getPacketLossPct(out) {
  if (!out) return null;
  const s = String(out);

  // 1) Prefer Windows ping summary if present
  // Example:
  // Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
  const m = s.match(/Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)\s*\((\d+)%\s*loss\)/i);
  if (m) {
    const pct = Number(m[4]);
    if (!Number.isNaN(pct)) return pct;
  }

  // 2) Fallback heuristic: count timeouts/unreachable in last ~120 lines
  const lines = s.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const tail = lines.slice(-120);

  let sent = 0;
  let lost = 0;

  for (const l of tail) {
    // treat each ping attempt as "sent"
    if (/^reply from/i.test(l) || /\bbytes=\d+/i.test(l)) { sent++; continue; }

    if (
      /request timed out/i.test(l) ||
      /destination host unreachable/i.test(l) ||
      /general failure/i.test(l) ||
      /transmit failed/i.test(l) ||
      /\bunreachable\b/i.test(l)
    ) { sent++; lost++; continue; }

    // some outputs include "time<1ms" without bytes=
    if (/ttl=\d+/i.test(l) && /time/i.test(l)) { sent++; continue; }
  }

  if (sent === 0) return null;
  const pct = (lost / sent) * 100;
  return Math.round(pct * 10) / 10;
}
export default function PingTool({ ip, onIpChange }) {
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState("");
  const esRef = useRef(null);
  const outRef = useRef(null);

  const loss = useMemo(() => getPacketLossPct(out), [out]);

  function append(line){
    setOut(prev => (prev || "") + String(line ?? "") + "\n");
    // auto-scroll after paint
    setTimeout(() => {
      try{
        const el = outRef.current;
        if(el) el.scrollTop = el.scrollHeight;
      }catch{}
    }, 0);
  }

  function stop(){
    try{ esRef.current?.close(); }catch{}
    esRef.current = null;
    setRunning(false);
  }

  function start(){
    const target = String(ip || "").trim();
    if(!target){ append("Enter IP first"); return; }

    stop();
    setOut("");
    setRunning(true);
    append("Pinging " + target + " ...");

    const url = API + "/api/ping-sse?ip=" + encodeURIComponent(target);
    const es = new EventSource(url);
    esRef.current = es;

    const startedAt = Date.now();

    es.addEventListener("line", (ev) => {
      try{
        const obj = JSON.parse(ev.data || "{}");
        append(obj.line ?? String(ev.data ?? ""));
      }catch{
        append(String(ev.data ?? ""));
      }
    });

    es.addEventListener("end", () => {
      try{ es.close(); }catch{}
      esRef.current = null;
      const ms = Date.now() - startedAt;
      append("[done] " + ms + "ms");
      setRunning(false);
    });

    es.onerror = () => {
      try{ es.close(); }catch{}
      esRef.current = null;
      append("[error] stream disconnected");
      setRunning(false);
    };
  }

  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wsPingRoot">
      <div className="wsPingRow">
        <div className="wsPingLeft">
          <div className="wsPingLabel">IP</div>
          <input
            className="wsPingInput"
            value={ip ?? ""}
            onChange={(e)=> onIpChange?.(e.target.value)}
            placeholder="8.8.8.8"
          />
        </div>

        <div className="wsPingBtns">
          {!running ? (
            <button className="wsPingBtn" onClick={start}>Start</button>
          ) : (
            <button className="wsPingBtn danger" onClick={stop}>Stop</button>
          )}
          <button className="wsPingBtn ghost" onClick={()=> setOut("")}>Clear</button>
        </div>
      </div>

      <div className="wsPingMeta">
        <div className="wsPingMetaLabel">Packet loss</div>
        <div className="wsPingMetaValue">
          {loss == null ? "—" : (loss + "%")}
        </div>
      </div>

      <div className="wsPingBar">
        <div
          className="wsPingFill"
          style={{ width: (loss == null ? 0 : Math.min(100, Math.max(0, loss))) + "%" }}
        />
      </div>

      <pre ref={outRef} className="wsPingOut">{out}</pre>
    </div>
  );
}







