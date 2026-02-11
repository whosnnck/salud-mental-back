// routes/support.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// Crear solicitud de apoyo
router.post("/", verifyToken, async (req, res) => {
  try {
    // Accept multiple payload shapes from different frontends/components
    const userId = req.userId;
    const request_type = req.body.request_type || req.body.type || "general";
    const subject = req.body.subject || null;
    const message = req.body.message || req.body.description || "";
    // Normalize urgency to allowed enum values in DB
    const rawUrgency = (
      req.body.urgency ||
      req.body.priority ||
      "low"
    ).toString();
    const allowedUrgencies = ["low", "medium", "high", "crisis"];
    const urgency = allowedUrgencies.includes(rawUrgency.toLowerCase())
      ? rawUrgency.toLowerCase()
      : "low";
    const phone_contact = req.body.phone_contact || req.body.phone || null;

    if (!message) {
      return res
        .status(400)
        .json({ message: "Description/message is required" });
    }

    const query =
      "INSERT INTO support_requests (user_id, request_type, subject, message, urgency, phone_contact, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [
      userId,
      request_type,
      subject,
      message,
      urgency,
      phone_contact,
      "pending",
    ]);

    try {
      console.debug("Created support request:", {
        id: result.insertId,
        userId,
        request_type,
        subject,
        message,
        urgency,
      });
    } catch (e) {}

    return res.status(201).json({
      id: result.insertId,
      user_id: userId,
      request_type,
      subject,
      message,
      urgency,
      phone_contact,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating support request:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener mis solicitudes
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      "SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC";
    const [results] = await db.query(query, [userId]);
    return res.json(results);
  } catch (error) {
    console.error("Error fetching my support requests:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Obtener solicitudes recientes
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit || 10;
    const query =
      "SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";
    const [results] = await db.query(query, [userId, parseInt(limit)]);
    return res.json(results);
  } catch (error) {
    console.error("Error fetching recent support requests:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener todas las solicitudes (solo HR)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = "SELECT * FROM support_requests ORDER BY created_at DESC";
    const [results] = await db.query(query);
    return res.json(results);
  } catch (error) {
    console.error("Error fetching all support requests:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener solicitudes pendientes (solo HR)
router.get("/status/pending", verifyToken, async (req, res) => {
  try {
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query =
      "SELECT * FROM support_requests WHERE status = ? ORDER BY created_at DESC";
    const [results] = await db.query(query, ["pending"]);
    return res.json(results);
  } catch (error) {
    console.error("Error fetching pending support requests:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// HR: Actualizar estado de una solicitud (solo HR)
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    if (
      !status ||
      !["pending", "in_progress", "resolved", "closed"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const query =
      "UPDATE support_requests SET status = ?, updated_at = NOW() WHERE id = ?";
    const [result] = await db.query(query, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Support request not found" });
    }

    return res.json({
      message: "Support request updated successfully",
      status,
    });
  } catch (error) {
    console.error("Error updating support request status:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// HR: Eliminar una solicitud (solo HR)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = "DELETE FROM support_requests WHERE id = ?";
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Support request not found" });
    }

    try {
      console.debug("Deleted support request:", id);
    } catch (e) {}
    return res.json({ message: "Support request deleted" });
  } catch (error) {
    console.error("Error deleting support request:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
