import express from "express";

import isAuth from "../middleware/isAuth";
import isSuperOrAdmin from "../middleware/isSuperOrAdmin";
import * as ApiKeyController from "../controllers/ApiKeyController";

const routes = express.Router();

// Gerenciamento de API Keys (somente super ou admin de empresa)
routes.get("/api-keys", isAuth, isSuperOrAdmin, ApiKeyController.index);
routes.post("/api-keys", isAuth, isSuperOrAdmin, ApiKeyController.store);
routes.post("/api-keys/:id/revoke", isAuth, isSuperOrAdmin, ApiKeyController.revoke);
routes.delete("/api-keys/:id", isAuth, isSuperOrAdmin, ApiKeyController.remove);

export default routes;
