const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const checkBlockStatus = require("./routes/check-block-status");
const registerInstallation = require("./routes/register-installation");
const manageInstallations = require("./routes/manage-installations");
const whatsappProxy = require("./routes/whatsapp-proxy");
const whatsappWelcome = require("./routes/whatsapp-welcome");
const registerZapmeow = require("./routes/register-zapmeow");
const setupAdmin = require("./routes/setup-admin");
const purchaseRoutes = require("./routes/purchase");
const templateRoutes = require("./routes/templates");

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10kb" }));

// Health check (testa conexão real com o banco)
app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Health check DB error:", err.message);
    res.status(500).json({ status: "error", db: "disconnected", detail: err.message });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/check-block-status", checkBlockStatus);
app.use("/api/register-installation", registerInstallation);
app.use("/api/manage-installations", manageInstallations);
app.use("/api/whatsapp-proxy", whatsappProxy);
app.use("/api/whatsapp-welcome", whatsappWelcome);
app.use("/api/register-zapmeow", registerZapmeow);
app.use("/api/setup-admin", setupAdmin);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/templates", templateRoutes);

app.listen(PORT, () => {
  console.log(`Monitor API running on port ${PORT}`);
});
