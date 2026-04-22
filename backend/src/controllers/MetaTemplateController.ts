import { Request, Response } from "express";
import MetaTemplate from "../models/MetaTemplate";
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
    name = "Novo modelo",
    templateType = "standard",
    language = "pt_BR",
    category = "Utility",
    payload = {},
    currentStep = 0
  } = req.body || {};

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
