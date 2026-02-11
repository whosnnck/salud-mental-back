// routes/diary.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// Crear una nueva entrada en el diario
router.post("/", verifyToken, async (req, res) => {
  try {
    const { emotion, content, is_shareable } = req.body;
    const userId = req.userId;

    if (!emotion || !content) {
      return res
        .status(400)
        .json({ message: "Emotion and content are required" });
    }

    const query =
      "INSERT INTO diary_entries (user_id, emotion, content, is_shareable) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(query, [
      userId,
      emotion,
      content,
      is_shareable || false,
    ]);

    return res.status(201).json({
      id: result.insertId,
      user_id: userId,
      emotion,
      content,
      is_shareable: is_shareable || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener mis entradas del diario
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      "SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC";

    const [results] = await db.query(query, [userId]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener entradas recientes
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const query =
      "SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";

    const [results] = await db.query(query, [userId, limit]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener una entrada específica
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const query = "SELECT * FROM diary_entries WHERE id = ? AND user_id = ?";

    const [results] = await db.query(query, [id, userId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    return res.json(results[0]);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Actualizar una entrada
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { emotion, content, is_shareable } = req.body;
    const userId = req.userId;

    const query =
      "UPDATE diary_entries SET emotion = ?, content = ?, is_shareable = ?, updated_at = NOW() WHERE id = ? AND user_id = ?";
    const [result] = await db.query(query, [
      emotion,
      content,
      is_shareable,
      id,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    return res.json({ message: "Entry updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Eliminar una entrada
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const query = "DELETE FROM diary_entries WHERE id = ? AND user_id = ?";
    const [result] = await db.query(query, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    return res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
