import { Request, Response } from "express";
import WarmerDraft from "../models/WarmerDraft";
import WarmerVersion from "../models/WarmerVersion";
import AppError from "../errors/AppError";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const drafts = await WarmerDraft.findAll({
    where: { companyId },
    order: [["updatedAt", "DESC"]]
  });
  return res.json(drafts);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { name = "Rascunho sem nome", messages = [], config = {} } = req.body || {};
  const draft = await WarmerDraft.create({
    name, messages, config, companyId, userId
  } as any);
  return res.status(201).json(draft);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const draft = await WarmerDraft.findOne({ where: { id, companyId } });
  if (!draft) throw new AppError("Rascunho não encontrado", 404);
  const { name, messages, config } = req.body || {};
  await draft.update({
    name: name ?? draft.name,
    messages: Array.isArray(messages) ? messages : draft.messages,
    config: config && typeof config === "object" ? { ...draft.config, ...config } : draft.config
  });
  return res.json(draft);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const draft = await WarmerDraft.findOne({ where: { id, companyId } });
  if (!draft) throw new AppError("Rascunho não encontrado", 404);
  await draft.destroy();
  return res.json({ message: "Rascunho removido" });
};

// ===== Versões automáticas =====
export const versionsIndex = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const versions = await WarmerVersion.findAll({
    where: { companyId },
    order: [["createdAt", "DESC"]],
    limit: 30
  });
  return res.json(versions);
};

export const versionsRemove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const v = await WarmerVersion.findOne({ where: { id, companyId } });
  if (!v) throw new AppError("Versão não encontrada", 404);
  await v.destroy();
  return res.json({ message: "Versão removida" });
};
