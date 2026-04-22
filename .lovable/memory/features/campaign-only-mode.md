---
name: Campaign-Only Mode
description: Sistema EquipeChat foi refatorado faseado para foco exclusivo em campanhas + APIs robustas, com flag CAMPAIGN_ONLY_MODE
type: feature
---
# Modo Somente Campanhas (Fase 1 — Soft-remove)

## Decisão
O sistema EquipeChat (backend Node/Express + frontend React, self-hosted nas VPS dos clientes) foi refatorado de forma **faseada**: primeiro **esconder** atendimento/chat/flowbuilder/filas/kanban antigo, **depois** apagar definitivamente.

## Flag central
- Backend: `backend/src/config/featureFlags.ts` → `FEATURE_FLAGS.CAMPAIGN_ONLY_MODE` (default: true)
- Frontend: `frontend/src/config/featureFlags.js` → idem (default: true)
- Override por env: `CAMPAIGN_ONLY_MODE=false` (backend) ou `REACT_APP_CAMPAIGN_ONLY_MODE=false` (frontend)

## O que está escondido quando CAMPAIGN_ONLY_MODE=true
Frontend (`routes/index.js` + `layout/MainListItems.js`):
- Tickets, Chat ao vivo, Chat interno, Moments, Kanban antigo, TagsKanban
- FlowBuilder, FlowBuilder submenu, FollowUP/Floup
- Contatos avulsos, Filas (Queues), Queue-Integration, Prompts (OpenAI), Files
- QuickMessages, Template Manager, Tags, Wallets, AllConnections
- Rota `/` redireciona para Campaigns

## Recursos novos de Campanha
Migrations em `backend/src/database/migrations/`:
- `20260417220000-add-advanced-campaign-features.ts` — useSpintax, validateNumbers, minDelaySeconds, maxDelaySeconds, whatsappIds (multi-chip JSON), sendWindow (janela), batchSize/batchPauseSeconds
- `20260417220100-create-warmup-sessions.ts` — tabela WarmupSessions para aquecimento de chip
- `20260417220200-create-campaign-webhooks.ts` — CampaignWebhooks + CampaignWebhookDeliveries (assinatura HMAC)
- `20260417220300-create-api-keys.ts` — ApiKeys (prefix + sha256 hash, escopos)

Helpers:
- `backend/src/helpers/CampaignAntiBan.ts` — expandSpintax, humanizedDelayMs (Box-Muller), isWithinSendWindow, nextSendableDate, pickWhatsappRoundRobin
- `backend/src/services/CampaignWebhookService/DispatchService.ts` — dispatchWebhook com HMAC-SHA256 + log

## API pública v2
- `backend/src/middleware/apiKeyAuth.ts` — middleware `requireApiKey(scope?)` valida X-API-Key
- `backend/src/routes/api/apiV2Routes.ts` — endpoints: /health, /me, /campaigns CRUD, /messages (avulsa), /contacts/bulk, /webhooks CRUD
- `backend/src/routes/api/apiV2Docs.ts` — Swagger UI em `/api/v2/docs` + `/api/v2/openapi.json`
- `backend/src/routes/apiKeyRoutes.ts` — gerenciamento de keys via painel (isAuth)
- Escopos: campaigns:read, campaigns:write, messages:send, contacts:write, webhooks:manage, *
- Chave gerada: `ec_live_<48hex>`, retornada **uma única vez** na criação (apenas hash sha256 fica no banco)

## Layout estilo whatsCRM (Fase 1.5)
Quando `CAMPAIGN_ONLY_MODE=true`, `frontend/src/routes/index.js` troca `LoggedInLayout` por:
- `frontend/src/layout/CampaignLayout.js` — sidebar branca, acentos verde-esmeralda, ícones lucide-react, agrupamento por seções (Campanhas / Anti-ban / APIs / Relatórios / Admin), topbar minimalista com avatar + tema toggle
- `frontend/src/pages/CampaignsHome/index.js` — home com 4 stat cards (Campanhas Ativas, Mensagens Enviadas, Taxa de Entrega, Contatos), atalhos rápidos (Nova Campanha, Aquecer Chip, API Key, Webhook) e placeholder de atividade
Marca exibida: "EquipeChat Campaigns".

## Próximas fases
- **Fase 2**: implementar workers de warmup, integrar spintax/delay/multi-chip no `CampaignQueue` existente, tela de gerenciamento de API Keys e Webhooks no frontend, Kanban opcional de campanhas (toggle: respostas / status de envio)
- **Fase 3**: apagar definitivamente código de tickets/flowbuilder/chat após validação em produção

## Variáveis de ambiente novas
```
CAMPAIGN_ONLY_MODE=true
CAMPAIGN_KANBAN=true
CAMPAIGN_WARMUP=true
CAMPAIGN_MULTI_CHIP=true
CAMPAIGN_SPINTAX=true
CAMPAIGN_NUMBER_VALIDATION=true
CAMPAIGN_TIME_WINDOW=true
CAMPAIGN_WEBHOOKS=true
PUBLIC_API_V2=true
```

Frontend: prefixar com `REACT_APP_`.
