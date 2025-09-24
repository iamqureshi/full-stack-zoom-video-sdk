const express = require("express");
const config = require("../config");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/access-token", (req, res) => {
  const { sessionName, role } = req.body;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour validity

  const payload = {
    app_key: config.SDK_KEY,
    tpc: sessionName, // <=200 chars
    role, // 1 = host (Expert), 0 = participant (Learner)
    iat,
    exp,
    version: 1,
  };

  const token = jwt.sign(payload, config.SDK_SECRET, { algorithm: "HS256" });

  res.json({
    token,
  });
});

module.exports = router;
