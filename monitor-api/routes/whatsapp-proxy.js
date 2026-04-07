const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

async function getZapConfig() {
  const { rows } = await pool.query(
    "SELECT zapmeow_url, instance_id FROM whatsapp_config WHERE is_active = true LIMIT 1"
  );
  return rows[0] || null;
}

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const config = await getZapConfig();
    if (!config?.zapmeow_url) {
      return res.json({ error: "ZapMeow não configurado", configured: false });
    }

    const { action, phone, message } = req.body;
    const baseUrl = config.zapmeow_url;
    const instance = config.instance_id || "equipechat";

    if (action === "qrcode") {
      const r = await fetch(`${baseUrl}/${instance}/qrcode`);
      return res.json(await r.json());
    }
    if (action === "status") {
      const r = await fetch(`${baseUrl}/${instance}/status`);
      return res.json(await r.json());
    }
    if (action === "profile") {
      const r = await fetch(`${baseUrl}/${instance}/profile`);
      return res.json(await r.json());
    }
    if (action === "send-text") {
      if (!phone || !message) return res.status(400).json({ error: "phone e message são obrigatórios" });
      const cleanPhone = phone.replace(/\D/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      const r = await fetch(`${baseUrl}/${instance}/chat/send/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: jid, message }),
      });
      return res.json(await r.json());
    }
    if (action === "logout") {
      const r = await fetch(`${baseUrl}/${instance}/logout`, { method: "POST" });
      return res.json(await r.json());
    }

    res.status(400).json({ error: "Ação inválida" });
  } catch (err) {
    console.error("whatsapp-proxy error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
