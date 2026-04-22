import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuperOrAdmin from "../middleware/isSuperOrAdmin";
import * as WarmerSettingsController from "../controllers/WarmerSettingsController";

const routes = Router();

routes.get("/warmer-settings", isAuth, isSuperOrAdmin, WarmerSettingsController.show);
routes.put("/warmer-settings", isAuth, isSuperOrAdmin, WarmerSettingsController.update);

export default routes;
