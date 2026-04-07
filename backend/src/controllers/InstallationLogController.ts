import { Request, Response } from "express";
import InstallationLog from "../models/InstallationLog";
import AppError from "../errors/AppError";
import { getMonitorSecretKey } from "../helpers/monitorSecretKey";

function validateMonitorKey(req: Request): void {
  const monitorKey = req.headers["x-monitor-key"];
  if (!monitorKey || monitorKey !== getMonitorSecretKey()) {
    throw new AppError("Não autorizado", 401);
  }
}

// ─── POST /monitor/installations
// Recebe o payload do script instalador e salva no banco
export const registerInstallation = async (req: Request, res: Response): Promise<Response> => {
  validateMonitorKey(req);

  const {
    ip,
    frontend_url,
    backend_url,
    admin_url,
    hostname,
    os_info,
    installer_version,
  } = req.body;

  if (!ip || !frontend_url || !backend_url) {
    throw new AppError("Campos obrigatórios: ip, frontend_url, backend_url", 422);
  }

  const log = await InstallationLog.create({
    ip,
    frontend_url,
    backend_url,
    admin_url: admin_url || null,
    hostname: hostname || null,
    os_info: os_info || null,
    installer_version: installer_version || null,
    raw_payload: req.body
  });

  return res.status(201).json({ id: log.id, message: "Instalação registrada." });
};

// ─── GET /monitor/installations
// Lista instalações — acesso protegido por chave secreta
export const listInstallations = async (req: Request, res: Response): Promise<Response> => {
  validateMonitorKey(req);

  const logs = await InstallationLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 500
  });

  return res.json(logs);
};

// ─── GET /monitor/installations/stats
export const installationStats = async (req: Request, res: Response): Promise<Response> => {
  validateMonitorKey(req);

  const total = await InstallationLog.count();
  const lastWeek = await InstallationLog.count({
    where: {
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return res.json({ total, lastWeek });
};
