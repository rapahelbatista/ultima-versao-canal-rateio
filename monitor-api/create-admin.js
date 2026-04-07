#!/bin/bash
# EquipeChat Monitor — Script de criação do admin inicial
# Execute após a instalação: node create-admin.js

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createAdmin() {
  const email = process.argv[2] || "admin@equipechat.com";
  const password = process.argv[3] || "admin123";

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2 RETURNING id",
    [email, hash]
  );

  await pool.query(
    "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING",
    [rows[0].id]
  );

  console.log(`✅ Admin criado: ${email}`);
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
