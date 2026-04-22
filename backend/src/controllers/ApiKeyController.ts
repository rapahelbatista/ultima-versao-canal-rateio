import { Request, Response } from "express";
import * as Yup from "yup";

import AppError from "../errors/AppError";
import ApiKey from "../models/ApiKey";
import { generateApiKey, hashApiKey } from "../middleware/apiKeyAuth";

const ALLOWED_SCOPES = [
  "campaigns:read",
  "campaigns:write",
  "messages:send",
  "contacts:write",
  "webhooks:manage",
  "*"
];

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const keys = await ApiKey.findAll({
    where: { companyId },
    attributes: ["id", "name", "keyPrefix", "scopes", "isActive", "lastUsedAt", "expiresAt", "createdAt"],
    order: [["createdAt", "DESC"]]
  });
  return res.json(keys);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string().min(2).max(120).required(),
    scopes: Yup.array().of(Yup.string().oneOf(ALLOWED_SCOPES)).min(1).required(),
    expiresAt: Yup.date().nullable()
  });

  try {
    await schema.validate(req.body);
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const { name, scopes, expiresAt } = req.body;
  const generated = generateApiKey();

  const record = await ApiKey.create({
    name,
    scopes,
    expiresAt: expiresAt || null,
    keyPrefix: generated.prefix,
    keyHash: generated.hash,
    isActive: true,
    companyId,
    createdBy: Number(userId)
  } as any);

  // Retorna a chave em texto APENAS uma vez. Frontend deve avisar para copiar.
  return res.status(201).json({
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    scopes: record.scopes,
    expiresAt: record.expiresAt,
    plainKey: generated.plain,
    warning: "Guarde esta chave em local seguro. Ela não será exibida novamente."
  });
};

export const revoke = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  const record = await ApiKey.findOne({ where: { id, companyId } });
  if (!record) throw new AppError("API Key não encontrada.", 404);

  await record.update({ isActive: false });
  return res.status(204).send();
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  const record = await ApiKey.findOne({ where: { id, companyId } });
  if (!record) throw new AppError("API Key não encontrada.", 404);

  await record.destroy();
  return res.status(204).send();
};
