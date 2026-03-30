const express = require("express");
const router = express.Router();
const { collectAllTpLinkJetstream } = require("../lib/tplinkJetstreamSnmp");

let cache = null;
let cacheAt = 0;
let inflight = null;
const CACHE_MS = 20000;

router.get("/devices", async (_req, res) => {
  try {
    const now = Date.now();

    if (cache && (now - cacheAt) < CACHE_MS) {
      return res.json(cache);
    }

    if (!inflight) {
      inflight = collectAllTpLinkJetstream()
        .then((data) => {
          cache = data;
          cacheAt = Date.now();
          return data;
        })
        .finally(() => {
          inflight = null;
        });
    }

    const data = await inflight;
    res.json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || "Failed to load TP-Link JetStream data"
    });
  }
});

module.exports = router;
