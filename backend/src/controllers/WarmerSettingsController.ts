import { Request, Response } from "express";
import WarmerSetting from "../models/WarmerSetting";

const DEFAULT_CONFIG = {
  minIntervalSec: 20,
  maxIntervalSec: 60,
  dailyLimit: 50,
  startTime: "09:00",
  endTime: "18:00"
};

const findOrCreate = async (companyId: number) => {
  const [setting] = await WarmerSetting.findOrCreate({
    where: { companyId },
    defaults: {
      companyId,
      messages: [],
      config: DEFAULT_CONFIG
    } as any
  });
  return setting;
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const setting = await findOrCreate(companyId);
  return res.json({
    messages: setting.messages || [],
    config: { ...DEFAULT_CONFIG, ...(setting.config || {}) }
  });
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { messages, config } = req.body || {};

  const setting = await findOrCreate(companyId);

  await setting.update({
    messages: Array.isArray(messages)
      ? messages.filter((m: unknown) => typeof m === "string")
      : setting.messages,
    config:
      config && typeof config === "object"
        ? { ...DEFAULT_CONFIG, ...setting.config, ...config }
        : setting.config
  });

  return res.json({
    messages: setting.messages,
    config: setting.config
  });
};
