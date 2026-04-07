const express = require("express");
const pool = require("../db");
const router = express.Router();

router.all("/", async (req, res) => {
  try {
    let ip = null, frontend_url = null;

    if (req.method === "GET") {
      ip = req.query.ip;
      frontend_url = req.query.frontend_url;
    } else if (req.method === "POST") {
      ip = req.body.ip;
      frontend_url = req.body.frontend_url;
    }

    if (!ip && !frontend_url) {
      return res.status(400).json({ error: "Informe ao menos 'ip' ou 'frontend_url'" });
    }

    let data = null;

    if (frontend_url) {
      const { rows } = await pool.query(
        "SELECT id, ip, frontend_url, is_blocked, block_reason, blocked_at FROM installations WHERE frontend_url = $1 LIMIT 1",
        [frontend_url]
      );
      data = rows[0] || null;
    }

    if (!data && ip) {
      const { rows } = await pool.query(
        "SELECT id, ip, frontend_url, is_blocked, block_reason, blocked_at FROM installations WHERE ip = $1 LIMIT 1",
        [ip]
      );
      data = rows[0] || null;
    }

    // Not found — auto-register
    if (!data) {
      let newId = null;
      if (ip && frontend_url) {
        const backendUrl = frontend_url.replace(/^(https?:\/\/)/, '$1api.');
        const { rows } = await pool.query(
          "INSERT INTO installations (ip, frontend_url, backend_url) VALUES ($1, $2, $3) RETURNING id",
          [ip, frontend_url, backendUrl]
        );
        newId = rows[0]?.id;
      }
      return res.json({ blocked: false, found: false, registered: !!newId, id: newId });
    }

    // Update timestamp and ip
    if (ip && data.ip !== ip) {
      await pool.query("UPDATE installations SET ip = $1, updated_at = now() WHERE id = $2", [ip, data.id]);
    } else {
      await pool.query("UPDATE installations SET updated_at = now() WHERE id = $1", [data.id]);
    }

    if (data.is_blocked) {
      return res.json({
        blocked: true, found: true, id: data.id,
        reason: data.block_reason || "Acesso bloqueado pelo administrador",
        blocked_at: data.blocked_at,
      });
    }

    res.json({ blocked: false, found: true, id: data.id });
  } catch (err) {
    console.error("check-block-status error:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
