import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as WarmerSettingsController from "../controllers/WarmerSettingsController";

const routes = Router();

routes.get("/warmer-settings", isAuth, WarmerSettingsController.show);
routes.put("/warmer-settings", isAuth, WarmerSettingsController.update);

export default routes;
