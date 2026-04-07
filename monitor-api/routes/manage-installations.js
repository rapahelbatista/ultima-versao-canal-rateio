const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { sendEmail } = require("../helpers/notify");
const { sendWhatsAppMessage, getTemplate } = require("../helpers/whatsapp");
const router = express.Router();

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM installations ORDER BY created_at DESC");
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id, action, reason } = req.body;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });

    const { rows: [installation] } = await pool.query("SELECT * FROM installations WHERE id = $1", [id]);

    if (action === "block") {
      await pool.query(
        "UPDATE installations SET is_blocked=true, block_reason=$1, blocked_at=now() WHERE id=$2",
        [reason || "Motivo não informado", id]
      );

      if (installation) {
        sendEmail(
          `🚫 Instalação Bloqueada — ${installation.hostname || installation.ip}`,
          `<h2>Instalação bloqueada</h2><table cellpadding="6">
           <tr><td><strong>IP</strong></td><td>${installation.ip}</td></tr>
           <tr><td><strong>Hostname</strong></td><td>${installation.hostname || '-'}</td></tr>
           <tr><td><strong>Frontend</strong></td><td>${installation.frontend_url}</td></tr>
           <tr><td><strong>Motivo</strong></td><td style="color:#c0392b">${reason || 'Não informado'}</td></tr></table>`
        );

        // WhatsApp block notification
        try {
          const { rows: prs } = await pool.query(
            "SELECT contact_phone, contact_name, company_name FROM purchase_requests WHERE contact_phone IS NOT NULL LIMIT 50"
          );
          for (const pr of prs) {
            if (pr.contact_phone) {
              const vars = {
                contact_name: pr.contact_name, company_name: pr.company_name || "—",
                reason: reason || "Uso irregular detectado",
                hostname: installation.hostname || installation.ip,
                date: new Date().toLocaleString("pt-BR"),
              };
              const msg = await getTemplate("block", vars,
                `⚠️ *AVISO DE BLOQUEIO*\n\nPrezado(a) *${pr.contact_name}*,\nInstalação bloqueada. Motivo: ${reason || "Uso irregular"}.\n— EquipeChat`);
              await sendWhatsAppMessage(pr.contact_phone, msg);
              break;
            }
          }
        } catch (e) { console.error("WhatsApp block notification error:", e); }
      }

      return res.json({ success: true });
    }

    if (action === "unblock") {
      await pool.query(
        "UPDATE installations SET is_blocked=false, block_reason=NULL, blocked_at=NULL WHERE id=$1", [id]
      );

      if (installation) {
        sendEmail(
          `✅ Instalação Desbloqueada — ${installation.hostname || installation.ip}`,
          `<h2>Instalação desbloqueada</h2><table cellpadding="6">
           <tr><td><strong>IP</strong></td><td>${installation.ip}</td></tr>
           <tr><td><strong>Hostname</strong></td><td>${installation.hostname || '-'}</td></tr>
           <tr><td><strong>Frontend</strong></td><td>${installation.frontend_url}</td></tr></table>`
        );

        try {
          const { rows: prs } = await pool.query(
            "SELECT contact_phone, contact_name, company_name FROM purchase_requests WHERE contact_phone IS NOT NULL LIMIT 50"
          );
          for (const pr of prs) {
            if (pr.contact_phone) {
              const vars = {
                contact_name: pr.contact_name, company_name: pr.company_name || "—",
                hostname: installation.hostname || installation.ip,
                date: new Date().toLocaleString("pt-BR"),
              };
              const msg = await getTemplate("unblock", vars,
                `✅ *DESBLOQUEIO*\n\nPrezado(a) *${pr.contact_name}*,\nInstalação desbloqueada.\n— EquipeChat`);
              await sendWhatsAppMessage(pr.contact_phone, msg);
              break;
            }
          }
        } catch (e) { console.error("WhatsApp unblock notification error:", e); }
      }

      return res.json({ success: true });
    }

    if (action === "delete") {
      await pool.query("DELETE FROM installations WHERE id = $1", [id]);
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Ação inválida. Use 'block', 'unblock' ou 'delete'" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
