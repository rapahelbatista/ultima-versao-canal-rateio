const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email e password obrigatórios" });

    const { rows: existing } = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()]);

    if (existing.length > 0) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, existing[0].id]);
      return res.json({ success: true, action: "updated", id: existing[0].id });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows: [newUser] } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email.trim().toLowerCase(), hash]
    );
    await pool.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')", [newUser.id]);

    res.json({ success: true, action: "created", id: newUser.id });
  } catch (err) {
    console.error("setup-admin error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
