import express from "express";

import isAuth from "../middleware/isAuth";
import * as ApiKeyController from "../controllers/ApiKeyController";

const routes = express.Router();

// Gerenciamento de API Keys (precisa estar logado no painel)
routes.get("/api-keys", isAuth, ApiKeyController.index);
routes.post("/api-keys", isAuth, ApiKeyController.store);
routes.post("/api-keys/:id/revoke", isAuth, ApiKeyController.revoke);
routes.delete("/api-keys/:id", isAuth, ApiKeyController.remove);

export default routes;
