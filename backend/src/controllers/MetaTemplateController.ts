import { Request, Response } from "express";
import MetaTemplate from "../models/MetaTemplate";
import MetaTemplateVersion from "../models/MetaTemplateVersion";
import AppError from "../errors/AppError";

const ALLOWED_STATUS = ["draft", "pending", "approved", "rejected"];

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const templates = await MetaTemplate.findAll({
    where: { companyId },
    order: [["updatedAt", "DESC"]]
  });
  return res.json(templates);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const template = await MetaTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("Template não encontrado", 404);
  return res.json(template);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const {
    name = "novo_modelo",
    templateType = "standard",
    language = "pt_BR",
    category = "Utility",
    payload = {},
    currentStep = 0
  } = req.body || {};

  try {
    const template = await MetaTemplate.create({
      name,
      templateType,
      language,
      category,
      payload,
      currentStep,
      status: "draft",
      companyId,
      userId
    } as any);

    return res.status(201).json(template);
  } catch (err: any) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw new AppError("Já existe um modelo com esse nome nesta empresa.", 409);
    }
    throw err;
  }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const template = await MetaTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("Template não encontrado", 404);

  const {
    name,
    templateType,
    language,
    category,
    payload,
    currentStep,
    status,
    statusReason
  } = req.body || {};

  try {
    await template.update({
      name: name ?? template.name,
      templateType: templateType ?? template.templateType,
      language: language ?? template.language,
      category: category ?? template.category,
      payload:
        payload && typeof payload === "object"
          ? { ...template.payload, ...payload }
          : template.payload,
      currentStep:
        typeof currentStep === "number" ? currentStep : template.currentStep,
      status:
        status && ALLOWED_STATUS.includes(status) ? status : template.status,
      statusReason: statusReason ?? template.statusReason
    });
  } catch (err: any) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw new AppError("Já existe um modelo com esse nome nesta empresa.", 409);
    }
    throw err;
  }

  // Snapshot automático (1/60s por template, mantém últimas 50)
  try {
    const last = await MetaTemplateVersion.findOne({
      where: { templateId: template.id, companyId },
      order: [["createdAt", "DESC"]]
    });
    const now = Date.now();
    const lastTs = last ? new Date(last.createdAt).getTime() : 0;
    if (!last || now - lastTs > 60_000) {
      await MetaTemplateVersion.create({
        templateId: template.id,
        companyId,
        snapshot: {
          name: template.name,
          templateType: template.templateType,
          language: template.language,
          category: template.category,
          payload: template.payload,
          currentStep: template.currentStep,
          status: template.status
        }
      } as any);
      const all = await MetaTemplateVersion.findAll({
        where: { templateId: template.id, companyId },
        order: [["createdAt", "DESC"]]
      });
      if (all.length > 50) {
        const toDel = all.slice(50).map(v => v.id);
        await MetaTemplateVersion.destroy({ where: { id: toDel } });
      }
    }
  } catch (_) { /* não bloqueia o save */ }

  return res.json(template);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const template = await MetaTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("Template não encontrado", 404);
  await template.destroy();
  return res.json({ message: "Template removido" });
};
