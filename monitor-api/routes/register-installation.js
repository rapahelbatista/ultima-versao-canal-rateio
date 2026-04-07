const express = require("express");
const pool = require("../db");
const { sendEmail } = require("../helpers/notify");
const router = express.Router();

function isValidIP(ip) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(ip)) return ip.split('.').every(p => parseInt(p) >= 0 && parseInt(p) <= 255);
  return /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip);
}

function isValidURL(url) {
  try { const p = new URL(url); return ['http:', 'https:'].includes(p.protocol); } catch { return false; }
}

function truncate(val, max) { return val ? String(val).slice(0, max) : null; }
function sanitize(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

router.post("/", async (req, res) => {
  try {
    const { ip, frontend_url, backend_url, admin_url, hostname, os_info, installer_version } = req.body;

    if (!ip || !frontend_url || !backend_url) {
      return res.status(400).json({ error: "ip, frontend_url e backend_url são obrigatórios" });
    }
    if (!isValidIP(ip)) return res.status(400).json({ error: "Formato de IP inválido" });
    if (!isValidURL(frontend_url) || !isValidURL(backend_url)) return res.status(400).json({ error: "URL inválida" });
    if (admin_url && !isValidURL(admin_url)) return res.status(400).json({ error: "admin_url inválida" });

    const safe = {
      ip: truncate(ip, 45), frontend_url: truncate(frontend_url, 500), backend_url: truncate(backend_url, 500),
      admin_url: truncate(admin_url, 500), hostname: truncate(hostname, 255),
      os_info: truncate(os_info, 500), installer_version: truncate(installer_version, 50),
    };

    // Check existing
    const { rows: existing } = await pool.query("SELECT id FROM installations WHERE frontend_url = $1 LIMIT 1", [safe.frontend_url]);

    let resultId; let isNew = false;

    if (existing.length > 0) {
      const { rows } = await pool.query(
        `UPDATE installations SET ip=$1, backend_url=$2, admin_url=$3, deploy_password=$4, master_password=$5,
         hostname=$6, os_info=$7, installer_version=$8, updated_at=now() WHERE id=$9 RETURNING id`,
        [safe.ip, safe.backend_url, safe.admin_url, safe.deploy_password, safe.master_password,
         safe.hostname, safe.os_info, safe.installer_version, existing[0].id]
      );
      resultId = rows[0].id;
    } else {
      const { rows } = await pool.query(
        `INSERT INTO installations (ip, frontend_url, backend_url, admin_url, deploy_password, master_password, hostname, os_info, installer_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [safe.ip, safe.frontend_url, safe.backend_url, safe.admin_url, safe.deploy_password, safe.master_password,
         safe.hostname, safe.os_info, safe.installer_version]
      );
      resultId = rows[0].id;
      isNew = true;
    }

    if (isNew) {
      sendEmail(
        `✅ Nova Instalação Registrada — ${sanitize(safe.hostname || safe.ip)}`,
        `<h2>Nova instalação registrada</h2>
         <table cellpadding="6"><tr><td><strong>IP</strong></td><td>${sanitize(safe.ip)}</td></tr>
         <tr><td><strong>Hostname</strong></td><td>${sanitize(safe.hostname || '-')}</td></tr>
         <tr><td><strong>Frontend</strong></td><td>${sanitize(safe.frontend_url)}</td></tr>
         <tr><td><strong>Backend</strong></td><td>${sanitize(safe.backend_url)}</td></tr>
         <tr><td><strong>Versão</strong></td><td>${sanitize(safe.installer_version || '-')}</td></tr></table>`
      );
    }

    res.json({ success: true, id: resultId, isNew });
  } catch (err) {
    console.error("register-installation error:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
