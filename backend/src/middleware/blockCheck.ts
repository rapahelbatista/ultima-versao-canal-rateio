import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

const CHECK_URL =
  "https://cicwzhpsiewdpugmceqm.supabase.co/functions/v1/check-block-status";

// Cache para evitar chamadas excessivas à API
let cachedResult: { blocked: boolean; reason?: string } | null = null;
let lastCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cache do IP público do servidor
let serverIp: string | null = null;

async function getServerIp(): Promise<string | null> {
  if (serverIp) return serverIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    serverIp = data.ip ?? null;
    return serverIp;
  } catch {
    return null;
  }
}

/**
 * Middleware que verifica se esta instalação está bloqueada no monitor antipirataria.
 * Consulta a Edge Function usando frontend_url E IP do servidor.
 * Se bloqueada, retorna 403 para todas as requisições.
 */
const blockCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = Date.now();

    // Usar cache se ainda válido
    if (cachedResult && now - lastCheck < CACHE_TTL) {
      if (cachedResult.blocked) {
        res.status(403).json({
          error: "INSTALLATION_BLOCKED",
          message:
            cachedResult.reason ||
            "Esta instalação foi bloqueada pelo administrador.",
        });
        return;
      }
      return next();
    }

    // Determinar o frontend_url desta instalação
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.URL_FRONTEND ||
      process.env.REACT_APP_FRONTEND_URL;

    // Obter IP público do servidor
    const ip = await getServerIp();

    if (!frontendUrl && !ip) {
      logger.warn(
        "[AntiPiracy] FRONTEND_URL não configurada e IP indisponível — verificação ignorada"
      );
      return next();
    }

    // Montar query params com IP e frontend_url
    const params = new URLSearchParams();
    if (ip) params.set("ip", ip);
    if (frontendUrl) params.set("frontend_url", frontendUrl);

    const url = `${CHECK_URL}?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      cachedResult = { blocked: false };
      lastCheck = now;
      return next();
    }

    const data = await response.json();

    cachedResult = {
      blocked: data.blocked === true,
      reason: data.reason,
    };
    lastCheck = now;

    if (cachedResult.blocked) {
      logger.warn(
        `[AntiPiracy] ⛔ Instalação BLOQUEADA (IP: ${ip || "?"}, URL: ${frontendUrl || "?"}) — Motivo: ${cachedResult.reason || "Não informado"}`
      );
      res.status(403).json({
        error: "INSTALLATION_BLOCKED",
        message:
          cachedResult.reason ||
          "Esta instalação foi bloqueada pelo administrador.",
      });
      return;
    }

    return next();
  } catch (err: any) {
    if (err.name === "AbortError") {
      logger.warn("[AntiPiracy] Timeout ao verificar status de bloqueio");
    } else {
      logger.warn(`[AntiPiracy] Erro ao verificar bloqueio: ${err.message}`);
    }
    cachedResult = { blocked: false };
    lastCheck = Date.now();
    return next();
  }
};

export default blockCheck;

export default blockCheck;
