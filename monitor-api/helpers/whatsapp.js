const pool = require("../db");

async function sendWhatsAppMessage(phone, message) {
  try {
    const { rows } = await pool.query(
      "SELECT zapmeow_url, instance_id FROM whatsapp_config WHERE is_active = true LIMIT 1"
    );
    const config = rows[0];
    if (!config?.zapmeow_url) return { sent: false, error: "WhatsApp não configurado" };

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) return { sent: false, error: "Número inválido" };

    const jid = `${cleanPhone}@s.whatsapp.net`;
    const instance = config.instance_id || "equipechat";

    const res = await fetch(`${config.zapmeow_url}/${instance}/chat/send/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: jid, message }),
    });

    if (!res.ok) return { sent: false, error: `ZapMeow HTTP ${res.status}` };
    return { sent: true };
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    return { sent: false, error: String(err) };
  }
}

async function getTemplate(templateKey, variables, defaultMessage) {
  try {
    const { rows } = await pool.query(
      "SELECT message_body, is_active FROM whatsapp_templates WHERE template_key = $1 LIMIT 1",
      [templateKey]
    );
    const data = rows[0];
    if (!data || !data.is_active) return defaultMessage;

    let msg = data.message_body;
    for (const [key, value] of Object.entries(variables)) {
      msg = msg.replaceAll(`{{${key}}}`, value || "—");
    }
    return msg;
  } catch {
    return defaultMessage;
  }
}

module.exports = { sendWhatsAppMessage, getTemplate };
