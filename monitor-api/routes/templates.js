const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

// List templates (authenticated)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM whatsapp_templates ORDER BY template_key");
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Update template (admin)
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { message_body, is_active } = req.body;
    const updates = [];
    const values = [];
    let i = 1;

    if (message_body !== undefined) { updates.push(`message_body = $${i++}`); values.push(message_body); }
    if (is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(is_active); }
    updates.push(`updated_at = now()`);

    values.push(req.params.id);
    await pool.query(`UPDATE whatsapp_templates SET ${updates.join(", ")} WHERE id = $${i}`, values);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

module.exports = router;
