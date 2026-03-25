const { io } = require("socket.io-client");

const URL = process.env.URL || "http://localhost:9090";
const ONLY_ID = process.env.ONLY_ID || "";

const socket = io(URL, { transports: ["websocket", "polling"] });

function fmt(n){
  if(n === null || n === undefined) return "—";
  return Number(n).toFixed(3);
}

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id, "->", URL);
  if(ONLY_ID) console.log("🔎 Filtering ONLY_ID =", ONLY_ID);
});

socket.on("monitor:update", (msg) => {
  if(ONLY_ID && msg.id !== ONLY_ID) return;
  const t = new Date(msg.ts || Date.now()).toLocaleTimeString();

  if(msg.ok){
    console.log(`[${t}] ${msg.label} (${msg.ip}) ifIndex=${msg.ifIndex} mode=${msg.mode||"?"} DOWN=${fmt(msg.down_mbps)} Mbps UP=${fmt(msg.up_mbps)} Mbps`);
  } else {
    console.log(`[${t}] ${msg.label} (${msg.ip}) ifIndex=${msg.ifIndex} ❌ ${msg.error || "error"} mode=${msg.mode||"?"}`);
  }
});

socket.on("disconnect", (r)=> console.log("⚠ Disconnected:", r));
socket.on("connect_error", (e)=> console.log("❌ connect_error:", e.message || e));

