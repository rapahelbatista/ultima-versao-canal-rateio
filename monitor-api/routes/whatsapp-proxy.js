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

async function zapFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(url, { ...options, signal: controller.signal });
    if (!r.ok) return { error: `ZapMeow HTTP ${r.status}` };
    return await r.json();
  } catch (err) {
    if (err.name === "AbortError") return { error: "ZapMeow timeout (10s)" };
    return { error: "ZapMeow não acessível" };
  } finally {
    clearTimeout(timeout);
  }
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
      return res.json(await zapFetch(`${baseUrl}/${instance}/qrcode`));
    }
    if (action === "status") {
      return res.json(await zapFetch(`${baseUrl}/${instance}/status`));
    }
    if (action === "profile") {
      return res.json(await zapFetch(`${baseUrl}/${instance}/profile`));
    }
    if (action === "send-text") {
      if (!phone || !message) return res.status(400).json({ error: "phone e message são obrigatórios" });
      const cleanPhone = phone.replace(/\D/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      return res.json(await zapFetch(`${baseUrl}/${instance}/chat/send/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: jid, message }),
      }));
    }
    if (action === "logout") {
      return res.json(await zapFetch(`${baseUrl}/${instance}/logout`, { method: "POST" }));
    }

    res.status(400).json({ error: "Ação inválida" });
  } catch (err) {
    console.error("whatsapp-proxy error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
