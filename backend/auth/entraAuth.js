const msal = require("@azure/msal-node");

function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(v).trim();
}

function authority() {
  return `https://login.microsoftonline.com/${required("ENTRA_TENANT_ID")}`;
}

function createMsalClient() {
  return new msal.ConfidentialClientApplication({
    auth: {
      clientId: required("ENTRA_CLIENT_ID"),
      authority: authority(),
      clientSecret: required("ENTRA_CLIENT_SECRET"),
    },
    system: {
      loggerOptions: {
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Warning,
        loggerCallback(level, message, containsPii) {
          if (!containsPii) {
            console.log("[MSAL]", message);
          }
        },
      },
    },
  });
}

function getRedirectUri() {
  return required("ENTRA_REDIRECT_URI");
}

function getPostLogoutRedirectUri() {
  return process.env.ENTRA_POST_LOGOUT_REDIRECT_URI || "http://localhost:5177";
}

function getScopes() {
  return ["openid", "profile", "email"];
}

module.exports = {
  createMsalClient,
  getRedirectUri,
  getPostLogoutRedirectUri,
  getScopes,
};
