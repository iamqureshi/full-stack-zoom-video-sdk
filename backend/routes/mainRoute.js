const express = require("express");
const config = require("../config");
const jwt = require("jsonwebtoken");
const { KJUR } = require("jsrsasign");
const router = express.Router();
const crypto = require("crypto");

router.post("/access-token", (req, res) => {
  const { sessionName, role } = req.body;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour validity

  const payload = {
    app_key: config.SDK_KEY,
    tpc: sessionName, // <=200 chars
    role_type: role, // 1 = host (Expert), 0 = participant (Learner)
    iat,
    exp,
    version: 1,
  };

  const token = jwt.sign(payload, config.SDK_SECRET, { algorithm: "HS256" });

  res.json({
    token,
  });
});

router.post("/token", (req, res) => {
  const payload = req.body;

  // Debug: Log the received payload
  console.log("Received token request:", {
    sessionName: payload.sessionName,
    sessionNameLength: payload.sessionName ? payload.sessionName.length : 0,
    role: payload.role,
    userIdentity: payload.userIdentity,
  });

  // Validate session name length
  if (!payload.sessionName || payload.sessionName.length > 200) {
    return res.status(400).json({
      error: "Session name is required and must be 200 characters or less",
    });
  }

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: config.SDK_KEY, // Video SDK Key
    exp: now + (payload.expirationSeconds || 7200), // Default 2 hours
    iat: now, // Issued at
    aud: "zoom", // Audience
    appKey: config.SDK_KEY, // App Key (same as iss)
    tokenExp: now + (payload.expirationSeconds || 7200),
    alg: "HS256",

    // Session specific data
    tpc: payload.sessionName, // Topic/Session name (max 200 chars)
    role_type: payload.role, // 0 = participant, 1 = host
    session_key: payload.sessionKey || "",
    user_identity: payload.userIdentity || "",

    // Optional parameters
    // geo_regions: payload.geoRegions || "US",
    // cloud_recording_option: payload.cloudRecordingOption || 0,
    // cloud_recording_election: payload.cloudRecordingElection || 0,
    // telemetry_tracking_id: payload.telemetryTrackingId || "",
    // video_webrtc_mode: payload.videoWebRtcMode || 0,
    // audio_webrtc_mode: payload.audioWebRtcMode || 0,
  };

  // Debug: Log the JWT payload being created
  console.log("Creating JWT payload:", {
    tpc: jwtPayload.tpc,
    tpcLength: jwtPayload.tpc ? jwtPayload.tpc.length : 0,
    role_type: jwtPayload.role_type,
    user_identity: jwtPayload.user_identity,
    iss: jwtPayload.iss,
    exp: jwtPayload.exp,
    iat: jwtPayload.iat,
  });

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url"
  );
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString(
    "base64url"
  );

  const signature = crypto
    .createHmac("sha256", config.SDK_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  // Return complete JWT
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  // Debug: Log the final token
  console.log("Final JWT token created:", {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + "...",
  });

  res.json({
    signature: token,
  });
});

router.post("/get-token", (req, res) => {
  try {
    const payload = req.body;

    if (!config.SDK_KEY || !config.SDK_SECRET) {
      res.json({
        message: "Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET",
        success: false,
        data: null,
      });
      return;
    }

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const oHeader = { alg: "HS256", typ: "JWT" };
    const sdkKey = config.SDK_KEY;
    const sdkSecret = config.SDK_SECRET;
    const oPayload = {
      app_key: sdkKey,
      tpc: payload.sessionName,
      role_type: payload.role,
      version: 1,
      iat: iat,
      exp: exp,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const sdkJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
    res.json({
      signature: sdkJWT,
    });
  } catch (error) {
    console.log("ERROR:_______", error.message);
  }
});

module.exports = router;
