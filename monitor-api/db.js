const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "monitor_db",
  user: process.env.DB_USER || "monitor_user",
  password: process.env.DB_PASS || "monitor_pass",
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = pool;
