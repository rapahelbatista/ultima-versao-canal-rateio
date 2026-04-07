const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

// List all links (admin)
router.get("/links", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM purchase_links ORDER BY created_at DESC");
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Create link (admin)
router.post("/links", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { client_label } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO purchase_links (client_label) VALUES ($1) RETURNING *",
      [client_label || null]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Delete link (admin)
router.delete("/links/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM purchase_links WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Get link by token (public)
router.get("/link/:token", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, token, client_label, status FROM purchase_links WHERE token = $1 LIMIT 1",
      [req.params.token]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Link não encontrado" });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// List all requests (admin)
router.get("/requests", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM purchase_requests ORDER BY created_at DESC");
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: "Erro interno" }); }
});

// Submit request (public)
router.post("/requests", async (req, res) => {
  try {
    const { company_name, document_type, document_number, contact_name, contact_email,
      contact_phone, usage_type, how_found_us, agreed_anti_piracy, notes, link_id } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO purchase_requests (company_name, document_type, document_number, contact_name, contact_email,
       contact_phone, usage_type, how_found_us, agreed_anti_piracy, notes, link_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [company_name, document_type, document_number, contact_name, contact_email,
       contact_phone || null, usage_type, how_found_us || null, agreed_anti_piracy, notes || null, link_id]
    );

    // Mark link as completed
    if (link_id) {
      await pool.query("UPDATE purchase_links SET status = 'completed' WHERE id = $1", [link_id]);
    }

    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error("purchase request error:", err);
    res.status(500).json({ error: "Erro ao salvar" });
  }
});

module.exports = router;
