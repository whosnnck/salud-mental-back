// routes/checkins.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// Crear un nuevo check-in
router.post("/", verifyToken, async (req, res) => {
  try {
    const { mood, notes } = req.body;
    const userId = req.userId;

    if (!mood || !["good", "neutral", "bad", "tired"].includes(mood)) {
      return res.status(400).json({ message: "Invalid mood value" });
    }

    // Intervalo entre checkins en segundos.
    // Por defecto en producción: 1 día (86400s). En desarrollo/testing: 2 minutos (120s).
    const defaultInterval = process.env.NODE_ENV === "production" ? 86400 : 120;
    const intervalSeconds = parseInt(
      process.env.CHECKIN_INTERVAL_SECONDS || String(defaultInterval),
      10,
    );

    // Obtener último checkin del usuario
    const [lastRows] = await db.query(
      "SELECT created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    if (lastRows && lastRows.length > 0) {
      const last = new Date(lastRows[0].created_at).getTime();
      const now = Date.now();
      const ageSeconds = Math.floor((now - last) / 1000);
      if (ageSeconds < intervalSeconds) {
        const retryAfter = intervalSeconds - ageSeconds;
        console.debug(
          `/api/checkins POST - user ${userId} blocked, retryAfter ${retryAfter}s`,
        );
        return res.status(429).json({
          message: "Check-in already submitted recently",
          retryAfter,
          friendly: `No puedes enviar más solicitudes todavía. Intenta de nuevo en ${retryAfter} segundos.`,
        });
      }
    }

    const insertQuery =
      "INSERT INTO checkins (user_id, mood, notes) VALUES (?, ?, ?)";
    const [result] = await db.query(insertQuery, [userId, mood, notes || null]);

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      mood,
      notes: notes || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Obtener mis check-ins
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      "SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC";

    const [results] = await db.query(query, [userId]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener check-ins recientes
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const query =
      "SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";

    const [results] = await db.query(query, [userId, limit]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener check-ins de hoy
router.get("/today", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      "SELECT * FROM checkins WHERE user_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC";

    const [results] = await db.query(query, [userId]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener último check-in
router.get("/latest", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      "SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";

    const [results] = await db.query(query, [userId]);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No checkin found" });
    }

    return res.json(results[0]);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

// Endpoint to check if user can submit a new checkin (returns retryAfter seconds if not allowed)
// Note: this is exported after module.exports to keep simple insertion; if you prefer move up, adjust accordingly.
router.get("/can-submit", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const defaultInterval = process.env.NODE_ENV === "production" ? 86400 : 120;
    const intervalSeconds = parseInt(
      process.env.CHECKIN_INTERVAL_SECONDS || String(defaultInterval),
      10,
    );

    const [lastRows] = await db.query(
      "SELECT created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    if (!lastRows || lastRows.length === 0) {
      return res.json({ allowed: true });
    }

    const last = new Date(lastRows[0].created_at).getTime();
    const now = Date.now();
    const ageSeconds = Math.floor((now - last) / 1000);
    if (ageSeconds >= intervalSeconds) {
      return res.json({ allowed: true });
    }

    const retryAfter = intervalSeconds - ageSeconds;
    console.debug(
      `/api/checkins/can-submit - user ${userId} not allowed, retryAfter ${retryAfter}s`,
    );
    return res.json({ allowed: false, retryAfter });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});
