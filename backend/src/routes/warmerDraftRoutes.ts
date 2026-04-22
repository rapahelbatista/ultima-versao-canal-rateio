import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuperOrAdmin from "../middleware/isSuperOrAdmin";
import * as WarmerDraftController from "../controllers/WarmerDraftController";

const routes = Router();

// Rascunhos nomeados
routes.get("/warmer-drafts", isAuth, isSuperOrAdmin, WarmerDraftController.index);
routes.post("/warmer-drafts", isAuth, isSuperOrAdmin, WarmerDraftController.store);
routes.put("/warmer-drafts/:id", isAuth, isSuperOrAdmin, WarmerDraftController.update);
routes.delete("/warmer-drafts/:id", isAuth, isSuperOrAdmin, WarmerDraftController.remove);

// Versões automáticas (snapshots)
routes.get("/warmer-versions", isAuth, isSuperOrAdmin, WarmerDraftController.versionsIndex);
routes.delete("/warmer-versions/:id", isAuth, isSuperOrAdmin, WarmerDraftController.versionsRemove);

export default routes;
