const express = require("express");
const {
  createMsalClient,
  getRedirectUri,
  getPostLogoutRedirectUri,
  getScopes,
} = require("../auth/entraAuth");

const router = express.Router();

function safeDecodeJwtPart(tokenPart) {
  try {
    const normalized = tokenPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function extractRolesFromIdToken(idToken) {
  try {
    const parts = String(idToken || "").split(".");
    if (parts.length < 2) return [];
    const payload = safeDecodeJwtPart(parts[1]) || {};
    if (Array.isArray(payload.roles)) return payload.roles;
    if (Array.isArray(payload.groups)) return payload.groups;
    return [];
  } catch {
    return [];
  }
}

router.get("/login", async (req, res) => {
  try {
    const cca = createMsalClient();

    const authCodeUrlParameters = {
      scopes: getScopes(),
      redirectUri: getRedirectUri(),
    };

    const state = Buffer.from(JSON.stringify({
      returnTo: String(req.query.returnTo || "/"),
      ts: Date.now(),
    })).toString("base64url");

    req.session.authFlow = { state };

    const authUrl = await cca.getAuthCodeUrl({
      ...authCodeUrlParameters,
      state,
      prompt: "select_account",
    });

    return res.redirect(authUrl);
  } catch (err) {
    console.error("[AUTH /login]", err);
    return res.status(500).send("Entra login init failed");
  }
});

router.get("/callback", async (req, res) => {
  try {
    const cca = createMsalClient();
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    if (!code) {
      return res.status(400).send("Missing auth code");
    }

    const expectedState = req.session?.authFlow?.state || "";
    if (!expectedState || state !== expectedState) {
      return res.status(400).send("Invalid auth state");
    }

    const tokenRequest = {
      code,
      scopes: getScopes(),
      redirectUri: getRedirectUri(),
    };

    const tokenResponse = await cca.acquireTokenByCode(tokenRequest);

    const account = tokenResponse.account || {};
    const idTokenClaims = tokenResponse.idTokenClaims || {};
    const roles = extractRolesFromIdToken(tokenResponse.idToken);

    req.session.user = {
      homeAccountId: account.homeAccountId || "",
      localAccountId: account.localAccountId || "",
      username: account.username || "",
      name: account.name || idTokenClaims.name || "",
      tenantId: idTokenClaims.tid || "",
      oid: idTokenClaims.oid || "",
      roles,
      idTokenClaims,
    };

    req.session.msal = {
      accessTokenExpiresOn: tokenResponse.expiresOn || null,
    };

    delete req.session.authFlow;

    let returnTo = "/";
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (parsed && typeof parsed.returnTo === "string" && parsed.returnTo.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    } catch {}

    return res.redirect(returnTo);
  } catch (err) {
    console.error("[AUTH /callback]", err);
    return res.status(500).send("Entra callback failed");
  }
});

router.post("/logout", async (req, res) => {
  try {
    const postLogoutRedirectUri = getPostLogoutRedirectUri();
    req.session.destroy(() => {
      return res.json({
        ok: true,
        logoutUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
      });
    });
  } catch (err) {
    console.error("[AUTH /logout]", err);
    return res.status(500).json({ ok: false, error: "logout failed" });
  }
});

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, authenticated: false });
  }

  return res.json({
    ok: true,
    authenticated: true,
    user: {
      username: req.session.user.username,
      name: req.session.user.name,
      tenantId: req.session.user.tenantId,
      oid: req.session.user.oid,
      roles: req.session.user.roles || [],
    }
  });
});

module.exports = router;
