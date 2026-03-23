const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const visitorsLogFile = path.join(__dirname, "visitors.log");

// ===== TELEGRAM CONFIG =====
const TELEGRAM_TOKEN = "8732391910:AAHU7-0ZI4YBioJMV7-INC53X7R35rRX_0U";
const TELEGRAM_CHAT_ID = "8292425726";

// ===== EMAIL CONFIG =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ALERT_USER,
    pass: process.env.GMAIL_ALERT_PASS
  }
});

const seenIPs = new Map();

function shouldAlert(ip) {
  const now = Date.now();
  const last = seenIPs.get(ip) || 0;
  if (now - last < 10 * 60 * 1000) return false;
  seenIPs.set(ip, now);
  return true;
}

// ===== TELEGRAM SEND =====
async function sendTelegram(ip, ua, url) {
  try {
    const msg = `?? NEW VISITOR\nIP: ${ip}\nURL: ${url}\nDevice: ${ua}\nTime: ${new Date().toISOString()}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg
      })
    });
  } catch (err) {
    console.error("Telegram error:", err.message);
  }
}

// ===== EMAIL SEND =====
function sendEmail(ip, ua, url) {
  const mailOptions = {
    from: process.env.GMAIL_ALERT_USER,
    to: process.env.GMAIL_ALERT_USER,
    subject: "New Visitor Detected",
    text: `IP: ${ip}\nURL: ${url}\nDevice: ${ua}\nTime: ${new Date().toISOString()}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("Mail error:", err.message);
    else console.log("Mail sent:", info.response);
  });
}

function isRealVisitor(ip, ua, url) {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return false;
  if (!ua || ua === "unknown" || ua.toLowerCase() === "node") return false;
  if (!url || url.startsWith("/api/ping/once")) return false;
  return true;
}

function visitorAlertMiddleware(req, res, next) {
  try {
    const ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    const ua = req.headers["user-agent"] || "unknown";
    const url = req.originalUrl || "";

    if (isRealVisitor(ip, ua, url)) {
      const line = `${new Date().toISOString()} | IP: ${ip} | URL: ${url} | Device: ${ua}` + "\n";
      fs.appendFileSync(visitorsLogFile, line);

      if (shouldAlert(ip)) {
        sendEmail(ip, ua, url);     // Gmail
        sendTelegram(ip, ua, url);  // Telegram ??
      }
    }
  } catch (err) {
    console.error("visitorAlertMiddleware error:", err.message);
  }

  next();
}

module.exports = { visitorAlertMiddleware };
