// Feature flags centralizadas no backend.
// Mantém paridade com frontend/src/config/featureFlags.js
// Variáveis de ambiente sobrescrevem os defaults (CAMPAIGN_ONLY_MODE=true|false etc.)

const bool = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  return raw === "true" || raw === "1";
};

export const FEATURE_FLAGS = {
  CAMPAIGN_ONLY_MODE: bool("CAMPAIGN_ONLY_MODE", true),

  CAMPAIGN_KANBAN: bool("CAMPAIGN_KANBAN", true),
  CAMPAIGN_WARMUP: bool("CAMPAIGN_WARMUP", true),
  CAMPAIGN_MULTI_CHIP: bool("CAMPAIGN_MULTI_CHIP", true),
  CAMPAIGN_SPINTAX: bool("CAMPAIGN_SPINTAX", true),
  CAMPAIGN_NUMBER_VALIDATION: bool("CAMPAIGN_NUMBER_VALIDATION", true),
  CAMPAIGN_TIME_WINDOW: bool("CAMPAIGN_TIME_WINDOW", true),
  CAMPAIGN_WEBHOOKS: bool("CAMPAIGN_WEBHOOKS", true),

  PUBLIC_API_V2: bool("PUBLIC_API_V2", true)
};

export const isCampaignOnly = (): boolean => FEATURE_FLAGS.CAMPAIGN_ONLY_MODE;

export default FEATURE_FLAGS;
