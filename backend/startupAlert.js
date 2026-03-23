const os = require("os");

// TELEGRAM CONFIG
const TELEGRAM_TOKEN = "8732391910:AAHU7-0ZI4YBioJMV7-INC53X7R35rRX_0U";
const TELEGRAM_CHAT_ID = "8292425726";

async function sendStartupAlert() {
  try {
    const msg = `?? SYSTEM STARTED\nHost: ${os.hostname()}\nTime: ${new Date().toISOString()}`;

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

    console.log("Startup alert sent");
  } catch (err) {
    console.error("Startup alert error:", err.message);
  }
}

module.exports = { sendStartupAlert };
