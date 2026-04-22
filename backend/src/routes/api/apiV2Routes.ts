import express, { Request, Response } from "express";
import * as Yup from "yup";

import { requireApiKey } from "../../middleware/apiKeyAuth";
import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";
import Whatsapp from "../../models/Whatsapp";
import CreateCampaignService from "../../services/CampaignService/CreateService";
import UpdateCampaignService from "../../services/CampaignService/UpdateService";
import CampaignWebhook from "../../models/CampaignWebhook";

const router = express.Router();

/**
 * GET /api/v2/health
 * Healthcheck público (sem auth) — útil para clientes monitorarem.
 */
router.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), version: "v2" });
});

/**
 * GET /api/v2/me
 * Retorna informações da API Key autenticada.
 */
router.get("/me", requireApiKey(), (req: Request, res: Response) => {
  res.json({ companyId: req.apiKey?.companyId, scopes: req.apiKey?.scopes });
});

/**
 * GET /api/v2/campaigns
 */
router.get("/campaigns", requireApiKey("campaigns:read"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;
  const { status, limit = 50, offset = 0 } = req.query;
  const where: any = { companyId };
  if (status) where.status = status;

  const { rows, count } = await Campaign.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: Math.min(Number(limit), 200),
    offset: Number(offset)
  });
  res.json({ count, data: rows });
});

/**
 * POST /api/v2/campaigns
 */
router.post("/campaigns", requireApiKey("campaigns:write"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;

  const schema = Yup.object().shape({
    name: Yup.string().min(3).max(120).required(),
    contactListId: Yup.number().required(),
    whatsappId: Yup.number().nullable(),
    whatsappIds: Yup.array().of(Yup.number()).nullable(),
    message1: Yup.string().nullable(),
    message2: Yup.string().nullable(),
    message3: Yup.string().nullable(),
    message4: Yup.string().nullable(),
    message5: Yup.string().nullable(),
    scheduledAt: Yup.string().nullable(),
    confirmation: Yup.boolean().default(false),
    useSpintax: Yup.boolean().default(false),
    validateNumbers: Yup.boolean().default(false),
    minDelaySeconds: Yup.number().min(1).default(5),
    maxDelaySeconds: Yup.number().min(1).default(25),
    sendWindow: Yup.object().nullable(),
    batchSize: Yup.number().nullable(),
    batchPauseSeconds: Yup.number().nullable()
  });

  let payload: any;
  try {
    payload = await schema.validate(req.body, { stripUnknown: true });
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const list = await ContactList.findOne({ where: { id: payload.contactListId, companyId } });
  if (!list) throw new AppError("Lista de contatos não pertence à empresa.", 404);

  const created = await CreateCampaignService({
    ...payload,
    status: "INATIVA",
    companyId,
    userId: 0,
    queueId: 0,
    statusTicket: "closed",
    openTicket: "disabled"
  } as any);

  res.status(201).json(created);
});

/**
 * GET /api/v2/campaigns/:id
 */
router.get("/campaigns/:id", requireApiKey("campaigns:read"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;
  const c = await Campaign.findOne({ where: { id: req.params.id, companyId } });
  if (!c) throw new AppError("Campanha não encontrada.", 404);
  res.json(c);
});

/**
 * PUT /api/v2/campaigns/:id
 */
router.put("/campaigns/:id", requireApiKey("campaigns:write"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;
  const c = await Campaign.findOne({ where: { id: req.params.id, companyId } });
  if (!c) throw new AppError("Campanha não encontrada.", 404);

  const updated = await UpdateCampaignService({
    ...req.body,
    id: c.id,
    companyId
  } as any);
  res.json(updated);
});

/**
 * POST /api/v2/messages
 * Envia mensagem avulsa para um número (sem precisar de campanha).
 * Body: { whatsappId, number, message }
 */
router.post("/messages", requireApiKey("messages:send"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;

  const schema = Yup.object().shape({
    whatsappId: Yup.number().required(),
    number: Yup.string().min(8).required(),
    message: Yup.string().min(1).required()
  });

  let body: any;
  try {
    body = await schema.validate(req.body);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const wpp = await Whatsapp.findOne({ where: { id: body.whatsappId, companyId } });
  if (!wpp) throw new AppError("WhatsApp não pertence à empresa.", 404);

  // Encaminha ao serviço já existente do projeto.
  const SendWhatsAppMessage = (await import("../../services/WbotServices/SendWhatsAppMessage")).default;
  const ShowOrCreateContactService = (await import("../../services/ContactServices/CreateContactService")).default;

  const contact = await ShowOrCreateContactService({
    name: body.number,
    number: body.number.replace(/\D/g, ""),
    isGroup: false,
    email: "",
    companyId,
    whatsappId: wpp.id
  } as any).catch(() => null);

  if (!contact) throw new AppError("Falha ao resolver contato.", 500);

  const sent = await SendWhatsAppMessage({
    body: body.message,
    ticket: { contact, whatsappId: wpp.id, companyId } as any
  } as any).catch((e: any) => {
    throw new AppError(`Falha ao enviar: ${e?.message || e}`, 502);
  });

  res.status(202).json({ accepted: true, messageId: (sent as any)?.id || null });
});

/**
 * POST /api/v2/contacts/bulk
 * Adiciona contatos em massa a uma lista.
 * Body: { contactListId, contacts: [{name, number, email?}] }
 */
router.post("/contacts/bulk", requireApiKey("contacts:write"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;

  const schema = Yup.object().shape({
    contactListId: Yup.number().required(),
    contacts: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().required(),
          number: Yup.string().required(),
          email: Yup.string().email().nullable()
        })
      )
      .min(1)
      .max(5000)
      .required()
  });

  let body: any;
  try {
    body = await schema.validate(req.body, { stripUnknown: true });
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const list = await ContactList.findOne({ where: { id: body.contactListId, companyId } });
  if (!list) throw new AppError("Lista não encontrada.", 404);

  const created = await ContactListItem.bulkCreate(
    body.contacts.map((c: any) => ({
      name: c.name,
      number: String(c.number).replace(/\D/g, ""),
      email: c.email || "",
      contactListId: list.id,
      companyId,
      isWhatsappValid: true
    })),
    { ignoreDuplicates: true }
  );

  res.status(201).json({ inserted: created.length });
});

/**
 * GET /api/v2/webhooks
 */
router.get("/webhooks", requireApiKey("webhooks:manage"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;
  const list = await CampaignWebhook.findAll({
    where: { companyId },
    order: [["createdAt", "DESC"]]
  });
  res.json(list);
});

/**
 * POST /api/v2/webhooks
 * Body: { url, events?, secret?, campaignId? }
 */
router.post("/webhooks", requireApiKey("webhooks:manage"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;

  const schema = Yup.object().shape({
    url: Yup.string().url().required(),
    events: Yup.array().of(Yup.string()).nullable(),
    secret: Yup.string().nullable(),
    campaignId: Yup.number().nullable()
  });

  let body: any;
  try {
    body = await schema.validate(req.body);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const wh = await CampaignWebhook.create({
    url: body.url,
    events: body.events || ["sent", "delivered", "read", "replied", "failed"],
    secret: body.secret || null,
    campaignId: body.campaignId || null,
    companyId,
    isActive: true
  } as any);

  res.status(201).json(wh);
});

router.delete("/webhooks/:id", requireApiKey("webhooks:manage"), async (req: Request, res: Response) => {
  const { companyId } = req.apiKey!;
  const wh = await CampaignWebhook.findOne({ where: { id: req.params.id, companyId } });
  if (!wh) throw new AppError("Webhook não encontrado.", 404);
  await wh.destroy();
  res.status(204).send();
});

export default router;
