import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

/**
 * Permite acesso somente a super usuários ou administradores da empresa.
 * Usado em rotas sensíveis: WhatsApp Warmer, Meta Templates e API Keys.
 */
const isSuperOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError("Acesso não permitido", 401);
  }
  const isSuper = !!user.super;
  const isAdmin = String(user.profile || "").toLowerCase() === "admin";
  if (!isSuper && !isAdmin) {
    throw new AppError(
      "Você não tem permissão para acessar este recurso.",
      403
    );
  }
  return next();
};

export default isSuperOrAdmin;
