import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as MetaTemplateController from "../controllers/MetaTemplateController";

const routes = Router();

routes.get("/meta-templates", isAuth, MetaTemplateController.index);
routes.get("/meta-templates/:id", isAuth, MetaTemplateController.show);
routes.post("/meta-templates", isAuth, MetaTemplateController.store);
routes.put("/meta-templates/:id", isAuth, MetaTemplateController.update);
routes.delete("/meta-templates/:id", isAuth, MetaTemplateController.remove);

export default routes;
