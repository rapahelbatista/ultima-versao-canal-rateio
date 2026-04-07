const express = require("express");
const { sendWhatsAppMessage, getTemplate } = require("../helpers/whatsapp");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { phone, contact_name, company_name } = req.body;
    if (!phone || !contact_name) {
      return res.status(400).json({ error: "phone e contact_name são obrigatórios", sent: false });
    }

    const variables = { contact_name, company_name: company_name || "sua empresa" };
    const defaultMsg = `🎉 *Olá, ${contact_name}!*\n\nSeja muito bem-vindo(a) ao *EquipeChat*! 🚀\n\nRecebemos o formulário da empresa *${company_name || "sua empresa"}* com sucesso. ✅\n\n— *Equipe EquipeChat*`;

    const message = await getTemplate("welcome", variables, defaultMsg);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.json({ error: "Número inválido", sent: false });
    }

    const result = await sendWhatsAppMessage(cleanPhone, message);
    res.json(result);
  } catch (err) {
    console.error("welcome error:", err);
    res.json({ error: "Erro ao enviar mensagem", sent: false });
  }
});

module.exports = router;
