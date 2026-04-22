import crypto from "crypto";
import axios from "axios";

import logger from "../../utils/logger";

interface DispatchInput {
  webhookUrl: string;
  secret?: string | null;
  event: string;
  payload: Record<string, any>;
}

/**
 * Assina o payload com HMAC-SHA256 (compatível com convenção GitHub-style).
 * Cliente pode validar com header X-Webhook-Signature.
 */
export const signPayload = (body: string, secret: string): string => {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
};

/**
 * Dispara webhook com timeout e retorna metadata para log.
 */
export const dispatchWebhook = async ({
  webhookUrl,
  secret,
  event,
  payload
}: DispatchInput): Promise<{ status: number | null; body: string; success: boolean }> => {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "EquipeChat-Webhook/1.0",
    "X-Webhook-Event": event
  };
  if (secret) {
    headers["X-Webhook-Signature"] = signPayload(body, secret);
  }

  try {
    const res = await axios.post(webhookUrl, body, {
      headers,
      timeout: 10_000,
      validateStatus: () => true
    });
    return {
      status: res.status,
      body: typeof res.data === "string" ? res.data.slice(0, 2000) : JSON.stringify(res.data).slice(0, 2000),
      success: res.status >= 200 && res.status < 300
    };
  } catch (err: any) {
    logger.warn(`[CampaignWebhook] Falha ao entregar ${event} -> ${webhookUrl}: ${err?.message}`);
    return { status: null, body: String(err?.message || err), success: false };
  }
};
