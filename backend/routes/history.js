const express = require("express");
const router = express.Router();

const {
  getUplinkHistory,
  UPLINK_HISTORY_FILE
} = require("../lib/historyStore");

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    feature: "history",
    phase: 2,
    mode: "useful-filters",
    file: UPLINK_HISTORY_FILE,
    supported: {
      range: ["1h", "6h", "24h", "7d"],
      q: true,
      uplink: true,
      limit: true
    }
  });
});

router.get("/uplink", (req, res) => {
  const options = {
    limit: req.query.limit,
    range: req.query.range,
    q: req.query.q,
    uplink: req.query.uplink
  };

  const rows = getUplinkHistory(options);

  res.json({
    ok: true,
    feature: "history",
    phase: 2,
    filters: {
      limit: Number(req.query.limit || 200),
      range: req.query.range || null,
      q: req.query.q || "",
      uplink: req.query.uplink || ""
    },
    count: rows.length,
    items: rows
  });
});

module.exports = router;
