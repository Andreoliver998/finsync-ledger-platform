import { Router } from "express";
import { OpenFinanceWebhookController } from "../controllers/OpenFinanceWebhookController.js";
import { webhookRateLimitMiddleware } from "../middlewares/securityMiddleware.js";

export const openFinanceWebhookRoutes = Router();

openFinanceWebhookRoutes.post("/pluggy", webhookRateLimitMiddleware, OpenFinanceWebhookController.handlePluggyWebhook);
