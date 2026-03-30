const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const seenIPs = new Map();

function cleanIp(ip) {
  let v = String(ip || "").trim();
  if (!v) return "";
  if (v.includes(",")) v = v.split(",")[0].trim();
  if (v.startsWith("::ffff:")) v = v.slice(7);
  return v;
}

function isPrivateIp(ip) {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    /^169\.254\./.test(ip)
  );
}

function shouldIgnoreUrl(url) {
  const u = String(url || "");
  return (
    !u ||
    u === "/health" ||
    u.startsWith("/favicon") ||
    u.startsWith("/assets/") ||
    u.startsWith("/src/") ||
    u.startsWith("/node_modules/") ||
    u.startsWith("/@vite") ||
    u.startsWith("/api/ping") ||
    u.startsWith("/api/eth/snapshot")
  );
}

function shouldAlert(ip) {
  const now = Date.now();
  const last = seenIPs.get(ip) || 0;
  if (now - last < 10 * 60 * 1000) return false;
  seenIPs.set(ip, now);
  return true;
}

async function sendTelegram(payload) {
  try {
    const token = process.env.TELEGRAM_TOKEN || "";
    const chatId = process.env.TELEGRAM_CHAT_ID || "";

    if (!token || !chatId) {
      console.error("[VISITOR-ALERT] Telegram config missing");
      return;
    }

    const msg =
      "NEW VISITOR\n" +
      "IP: " + (payload.ip || "-") + "\n" +
      "URL: " + (payload.url || "-") + "\n" +
      "Device: " + (payload.ua || "-") + "\n" +
      "Time: " + new Date().toISOString();

    const res = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg
      })
    });

    const txt = await res.text();
    console.log("[VISITOR-ALERT] telegram status:", res.status);
    console.log("[VISITOR-ALERT] telegram body:", txt);
  } catch (err) {
    console.error("[VISITOR-ALERT] Telegram error:", err.message);
  }
}

async function visitorAlertMiddleware(req, res, next) {
  try {
    const rawIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "";

    const ip = cleanIp(rawIp);
    const ua = req.headers["user-agent"] || "";
    const url = req.originalUrl || "";

    if (!ip || isPrivateIp(ip) || shouldIgnoreUrl(url)) {
      return next();
    }

    console.log("[VISITOR]", ip, url);

    if (shouldAlert(ip)) {
      sendTelegram({
        ip: ip,
        ua: ua,
        url: url
      }).catch(function (err) {
        console.error("[VISITOR-ALERT] async error:", err.message);
      });
    }
  } catch (err) {
    console.error("[VISITOR-MW ERROR]", err.message);
  }

  next();
}

module.exports = { visitorAlertMiddleware };
