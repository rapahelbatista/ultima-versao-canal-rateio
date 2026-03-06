import crypto from "crypto";
import logger from "../utils/logger";

let generatedKey: string | null = null;

/**
 * Retorna a MONITOR_SECRET_KEY.
 * Se não estiver definida no .env, gera uma aleatória no boot e loga no console.
 */
export function getMonitorSecretKey(): string {
  if (process.env.MONITOR_SECRET_KEY) {
    return process.env.MONITOR_SECRET_KEY;
  }

  if (!generatedKey) {
    generatedKey = crypto.randomBytes(32).toString("hex");
    logger.warn("═══════════════════════════════════════════════════════════");
    logger.warn("⚠️  MONITOR_SECRET_KEY não encontrada no .env");
    logger.warn("⚠️  Chave gerada automaticamente para esta sessão:");
    logger.warn(`⚠️  ${generatedKey}`);
    logger.warn("⚠️  Adicione ao .env para persistir: MONITOR_SECRET_KEY=" + generatedKey);
    logger.warn("═══════════════════════════════════════════════════════════");
  }

  return generatedKey;
}
