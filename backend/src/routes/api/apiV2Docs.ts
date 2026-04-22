import express, { Request, Response } from "express";

const router = express.Router();

// OpenAPI 3.0 inline (sem dependências extras).
// Documentação da API pública v2 do EquipeChat — Campanhas + Mensagens.
const openapi = {
  openapi: "3.0.3",
  info: {
    title: "EquipeChat API v2",
    description:
      "API pública para integração com campanhas, envio de mensagens e webhooks. Autentique-se com `X-API-Key`.",
    version: "2.0.0"
  },
  servers: [{ url: "/api/v2" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" }
    },
    schemas: {
      Campaign: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          status: { type: "string", enum: ["INATIVA", "PROGRAMADA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"] },
          contactListId: { type: "integer" },
          whatsappId: { type: "integer", nullable: true },
          whatsappIds: { type: "array", items: { type: "integer" }, nullable: true },
          message1: { type: "string", nullable: true },
          useSpintax: { type: "boolean" },
          validateNumbers: { type: "boolean" },
          minDelaySeconds: { type: "integer" },
          maxDelaySeconds: { type: "integer" },
          sendWindow: {
            type: "object",
            nullable: true,
            properties: {
              start: { type: "string", example: "08:00" },
              end: { type: "string", example: "18:00" },
              days: { type: "array", items: { type: "integer" }, example: [1, 2, 3, 4, 5] }
            }
          }
        }
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "integer" },
          url: { type: "string" },
          events: { type: "array", items: { type: "string" } },
          isActive: { type: "boolean" }
        }
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Healthcheck",
        security: [],
        responses: { "200": { description: "OK" } }
      }
    },
    "/me": {
      get: { summary: "Dados da API Key autenticada", responses: { "200": { description: "OK" } } }
    },
    "/campaigns": {
      get: {
        summary: "Listar campanhas",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } }
        ],
        responses: { "200": { description: "Lista de campanhas" } }
      },
      post: {
        summary: "Criar campanha",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Campaign" } } }
        },
        responses: { "201": { description: "Criada" } }
      }
    },
    "/campaigns/{id}": {
      get: {
        summary: "Detalhar campanha",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Não encontrada" } }
      },
      put: {
        summary: "Atualizar campanha",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/messages": {
      post: {
        summary: "Enviar mensagem avulsa",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsappId", "number", "message"],
                properties: {
                  whatsappId: { type: "integer" },
                  number: { type: "string", example: "5511999998888" },
                  message: { type: "string", example: "Olá {nome}, tudo bem?" }
                }
              }
            }
          }
        },
        responses: { "202": { description: "Aceita para envio" } }
      }
    },
    "/contacts/bulk": {
      post: {
        summary: "Adicionar contatos em massa a uma lista",
        requestBody: { required: true, content: { "application/json": {} } },
        responses: { "201": { description: "Inseridos" } }
      }
    },
    "/webhooks": {
      get: { summary: "Listar webhooks", responses: { "200": { description: "OK" } } },
      post: { summary: "Criar webhook", responses: { "201": { description: "Criado" } } }
    },
    "/webhooks/{id}": {
      delete: {
        summary: "Remover webhook",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "204": { description: "Removido" } }
      }
    }
  }
};

router.get("/openapi.json", (_req: Request, res: Response) => {
  res.json(openapi);
});

// UI Swagger CDN (sem dependência npm)
router.get("/docs", (_req: Request, res: Response) => {
  res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <title>EquipeChat API v2 — Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0;background:#0f172a}</style>
</head>
<body>
  <div id="ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "/api/v2/openapi.json",
        dom_id: "#ui",
        deepLinking: true,
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

export default router;
