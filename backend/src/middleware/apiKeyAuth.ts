import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import { FEATURE_FLAGS } from "../config/featureFlags";

// Hash determinístico para comparar com keyHash salvo no banco.
export const hashApiKey = (key: string): string => {
  return crypto.createHash("sha256").update(key).digest("hex");
};

// Gera nova API Key: ec_live_<32 hex>
export const generateApiKey = (): { plain: string; prefix: string; hash: string } => {
  const random = crypto.randomBytes(24).toString("hex"); // 48 chars
  const plain = `ec_live_${random}`;
  return {
    plain,
    prefix: plain.slice(0, 12), // ex: "ec_live_abc1"
    hash: hashApiKey(plain)
  };
};

// Augment de Request para carregar dados da API Key autenticada
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: number;
        companyId: number;
        scopes: string[];
      };
    }
  }
}

/**
 * Middleware: valida X-API-Key contra tabela ApiKeys.
 * Aceita também ?api_key= como fallback (útil para webhooks de retorno).
 */
export const requireApiKey = (requiredScope?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!FEATURE_FLAGS.PUBLIC_API_V2) {
      next(new AppError("API pública v2 desabilitada.", 503));
      return;
    }

    const headerKey = (req.headers["x-api-key"] || req.headers["X-API-Key"]) as string | undefined;
    const queryKey = (req.query.api_key as string) || undefined;
    const raw = headerKey || queryKey;

    if (!raw || typeof raw !== "string") {
      next(new AppError("API Key ausente. Envie em X-API-Key.", 401));
      return;
    }

    try {
      // Lazy import para evitar ciclo de dependência caso o model ainda não exista em build antigos.
      const ApiKey = (await import("../models/ApiKey")).default;
      const hash = hashApiKey(raw);

      const apiKey = await ApiKey.findOne({ where: { keyHash: hash, isActive: true } });
      if (!apiKey) {
        next(new AppError("API Key inválida.", 401));
        return;
      }
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        next(new AppError("API Key expirada.", 401));
        return;
      }
      const scopes: string[] = apiKey.scopes || [];
      if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes("*")) {
        next(new AppError(`API Key sem escopo necessário: ${requiredScope}`, 403));
        return;
      }

      // Atualiza lastUsedAt sem bloquear a request (fire-and-forget).
      apiKey.update({ lastUsedAt: new Date() }).catch(() => undefined);

      req.apiKey = {
        id: apiKey.id,
        companyId: apiKey.companyId,
        scopes
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};
