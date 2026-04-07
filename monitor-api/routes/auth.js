const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET, verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    // Get roles
    const { rows: roles } = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [user.id]);

    const token = jwt.sign(
      { sub: user.id, email: user.email, roles: roles.map(r => r.role) },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, roles: roles.map(r => r.role) },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, email, created_at FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    const { rows: roles } = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [req.userId]);
    res.json({ user: { ...rows[0], roles: roles.map(r => r.role) } });
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
