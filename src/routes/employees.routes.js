// routes/employees.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// HR: Obtener todos los empleados (solo HR)
router.get("/all", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/all - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.department,
        u.role,
        u.created_at
      FROM users u
      WHERE u.role = 'EMPLOYEE'
      ORDER BY u.full_name ASC
    `;

    const [results] = await db.query(query);
    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener resumen de empleados (solo HR)
router.get("/summary", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/summary - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT * FROM employee_summary
      ORDER BY full_name ASC
    `;

    const [results] = await db.query(query);
    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener empleados por departamento (solo HR)
router.get("/by-department/:department", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/by-department - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;
    const { department } = req.params;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.department,
        u.role,
        u.created_at
      FROM users u
      WHERE u.role = 'EMPLOYEE' AND u.department = ?
      ORDER BY u.full_name ASC
    `;

    const [results] = await db.query(query, [department]);
    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener empleados presentes hoy (solo HR)
router.get("/present-today", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/present-today - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.full_name,
        u.department,
        u.role,
        c.created_at as checkin_time
      FROM users u
      INNER JOIN checkins c ON u.id = c.user_id
      WHERE u.role = 'EMPLOYEE' 
        AND DATE(c.created_at) = CURDATE()
      ORDER BY u.full_name ASC
    `;

    const [results] = await db.query(query);
    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener empleados ausentes hoy (solo HR)
router.get("/absent-today", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/absent-today - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.department,
        u.role,
        u.created_at
      FROM users u
      WHERE u.role = 'EMPLOYEE' 
        AND u.id NOT IN (
          SELECT DISTINCT user_id FROM checkins
          WHERE DATE(created_at) = CURDATE()
        )
      ORDER BY u.full_name ASC
    `;

    const [results] = await db.query(query);
    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener estadísticas de empleados (solo HR)
router.get("/statistics", verifyToken, async (req, res) => {
  try {
    console.debug(
      "/api/employees/statistics - incoming request, Authorization:",
      req.headers.authorization,
    );
    const userRole = req.userRole;

    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    const query = `
      SELECT 
        COUNT(DISTINCT u.id) as total_employees,
        COUNT(DISTINCT c.user_id) as present_today,
        COUNT(DISTINCT u.id) - COUNT(DISTINCT c.user_id) as absent_today,
        COUNT(DISTINCT sr.id) as pending_support_requests,
        AVG(CASE WHEN c.mood IN ('happy', 'very_happy') THEN 1 ELSE 0 END) as positive_mood_percentage
      FROM users u
      LEFT JOIN checkins c ON u.id = c.user_id AND DATE(c.created_at) = CURDATE()
      LEFT JOIN support_requests sr ON u.id = sr.user_id AND sr.status = 'pending'
      WHERE u.role = 'EMPLOYEE'
    `;

    const [rows] = await db.query(query);
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// HR: Obtener check-ins anonimos y estadísticas (solo HR)
router.get("/checkins", verifyToken, async (req, res) => {
  try {
    const userRole = req.userRole;
    if (userRole !== "HR") {
      return res
        .status(403)
        .json({ message: "Unauthorized: HR role required" });
    }

    // Estadísticas por estado (hoy)
    const statsQuery = `
      SELECT mood, COUNT(*) as count
      FROM checkins
      WHERE DATE(created_at) = CURDATE()
      GROUP BY mood
    `;

    // Entradas recientes (anonimas) - sin user_id ni referencia al usuario
    const recentQuery = `
      SELECT mood, notes, created_at
      FROM checkins
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const [statsRows] = await db.query(statsQuery);
    const [recentRows] = await db.query(recentQuery);

    return res.json({ stats: statsRows, recent: recentRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
