import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuperOrAdmin from "../middleware/isSuperOrAdmin";
import * as Ctrl from "../controllers/MetaTemplateVersionController";

const routes = Router();

routes.get("/meta-templates/:id/versions", isAuth, isSuperOrAdmin, Ctrl.index);
routes.post("/meta-templates/:id/versions/:versionId/restore", isAuth, isSuperOrAdmin, Ctrl.restore);
routes.delete("/meta-templates/:id/versions/:versionId", isAuth, isSuperOrAdmin, Ctrl.remove);

export default routes;
