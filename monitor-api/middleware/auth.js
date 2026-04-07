const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "monitor-secret-change-me";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'",
      [req.userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: "Acesso negado: permissão de admin necessária" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
}

module.exports = { verifyToken, requireAdmin, JWT_SECRET };
