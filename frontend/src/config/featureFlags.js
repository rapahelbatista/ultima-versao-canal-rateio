// Feature flags centralizadas
// Ative CAMPAIGN_ONLY_MODE para esconder todo o atendimento (tickets, chat, flowbuilder, filas, kanban antigo, contatos avulsos)
// e deixar o sistema focado apenas em Campanhas + APIs.

const env = (key, fallback) => {
  const v = process.env[`REACT_APP_${key}`];
  if (v === undefined || v === null || v === "") return fallback;
  return v === "true" || v === "1" || v === true;
};

export const FEATURE_FLAGS = {
  // Modo "somente campanhas": esconde atendimento, chat, flowbuilder, filas, kanban antigo, contatos avulsos
  CAMPAIGN_ONLY_MODE: env("CAMPAIGN_ONLY_MODE", true),

  // Kanban opcional de campanhas (respostas + status de envio)
  CAMPAIGN_KANBAN: env("CAMPAIGN_KANBAN", true),

  // Recursos avançados de campanha
  CAMPAIGN_WARMUP: env("CAMPAIGN_WARMUP", true),
  CAMPAIGN_MULTI_CHIP: env("CAMPAIGN_MULTI_CHIP", true),
  CAMPAIGN_SPINTAX: env("CAMPAIGN_SPINTAX", true),
  CAMPAIGN_NUMBER_VALIDATION: env("CAMPAIGN_NUMBER_VALIDATION", true),
  CAMPAIGN_TIME_WINDOW: env("CAMPAIGN_TIME_WINDOW", true),
  CAMPAIGN_WEBHOOKS: env("CAMPAIGN_WEBHOOKS", true),

  // API pública v2
  PUBLIC_API_V2: env("PUBLIC_API_V2", true),
};

export const isCampaignOnly = () => FEATURE_FLAGS.CAMPAIGN_ONLY_MODE;

export default FEATURE_FLAGS;
