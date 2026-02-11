const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const db = require("../config/db");

router.get("/me", verifyToken, async (req, res) => {
  const [users] = await db.query(
    "SELECT id, full_name, email, role FROM users WHERE id = ?",
    [req.user.id],
  );
  res.json(users[0]);
});

module.exports = router;
