import { Request, Response } from "express";
import MetaTemplate from "../models/MetaTemplate";
import MetaTemplateVersion from "../models/MetaTemplateVersion";
import AppError from "../errors/AppError";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const template = await MetaTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("Template não encontrado", 404);
  const versions = await MetaTemplateVersion.findAll({
    where: { templateId: id, companyId },
    order: [["createdAt", "DESC"]],
    limit: 50
  });
  return res.json(versions);
};

export const restore = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id, versionId } = req.params;
  const template = await MetaTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("Template não encontrado", 404);
  const version = await MetaTemplateVersion.findOne({
    where: { id: versionId, templateId: id, companyId }
  });
  if (!version) throw new AppError("Versão não encontrada", 404);
  const snap: any = version.snapshot || {};
  await template.update({
    name: snap.name ?? template.name,
    templateType: snap.templateType ?? template.templateType,
    language: snap.language ?? template.language,
    category: snap.category ?? template.category,
    payload: snap.payload && typeof snap.payload === "object" ? snap.payload : template.payload,
    currentStep: typeof snap.currentStep === "number" ? snap.currentStep : template.currentStep
  });
  return res.json(template);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id, versionId } = req.params;
  const v = await MetaTemplateVersion.findOne({
    where: { id: versionId, templateId: id, companyId }
  });
  if (!v) throw new AppError("Versão não encontrada", 404);
  await v.destroy();
  return res.json({ message: "Versão removida" });
};
