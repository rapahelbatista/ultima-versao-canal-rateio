const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { zapmeow_url, instance_id } = req.body;
    if (!zapmeow_url || typeof zapmeow_url !== "string") {
      return res.status(400).json({ error: "zapmeow_url é obrigatório" });
    }
    try { const p = new URL(zapmeow_url); if (!["http:", "https:"].includes(p.protocol)) throw 0; } catch { return res.status(400).json({ error: "zapmeow_url inválida" }); }

    const cleanUrl = zapmeow_url.replace(/\/+$/, "");
    const inst = instance_id || "equipechat";

    const { rows } = await pool.query("SELECT id FROM whatsapp_config WHERE is_active = true LIMIT 1");

    if (rows.length > 0) {
      await pool.query("UPDATE whatsapp_config SET zapmeow_url=$1, instance_id=$2, updated_at=now() WHERE id=$3", [cleanUrl, inst, rows[0].id]);
    } else {
      await pool.query("INSERT INTO whatsapp_config (zapmeow_url, instance_id) VALUES ($1, $2)", [cleanUrl, inst]);
    }

    res.json({ success: true, message: "ZapMeow registrado com sucesso" });
  } catch (err) {
    console.error("register-zapmeow error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
