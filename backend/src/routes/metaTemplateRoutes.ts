import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuperOrAdmin from "../middleware/isSuperOrAdmin";
import * as MetaTemplateController from "../controllers/MetaTemplateController";

const routes = Router();

routes.get("/meta-templates", isAuth, isSuperOrAdmin, MetaTemplateController.index);
routes.get("/meta-templates/:id", isAuth, isSuperOrAdmin, MetaTemplateController.show);
routes.post("/meta-templates", isAuth, isSuperOrAdmin, MetaTemplateController.store);
routes.put("/meta-templates/:id", isAuth, isSuperOrAdmin, MetaTemplateController.update);
routes.delete("/meta-templates/:id", isAuth, isSuperOrAdmin, MetaTemplateController.remove);

export default routes;
