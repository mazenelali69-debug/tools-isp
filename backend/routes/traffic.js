const express = require("express");
const router = express.Router();
const snmp = require("net-snmp");

function getTraffic(ip, community = "public") {
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, community);

    const oids = [
      "1.3.6.1.2.1.2.2.1.10.1", // ifInOctets
      "1.3.6.1.2.1.2.2.1.16.1", // ifOutOctets
    ];

    session.get(oids, (err, varbinds) => {
      if (err) return resolve(null);

      const rx = varbinds[0].value;
      const tx = varbinds[1].value;

      resolve({ rx, tx });
      session.close();
    });
  });
}

router.get("/traffic", async (req, res) => {
  const ip = req.query.ip;
  if (!ip) return res.status(400).json({ error: "ip required" });

  const data = await getTraffic(ip);
  res.json(data || { rx: 0, tx: 0 });
});

module.exports = router;
