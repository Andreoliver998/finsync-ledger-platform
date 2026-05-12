import { Router } from "express";
import { OpenFinanceController } from "../controllers/OpenFinanceController.js";
import { openFinanceConnectTokenRateLimitMiddleware } from "../middlewares/securityMiddleware.js";

export const openFinanceRoutes = Router();

openFinanceRoutes.post("/connect-token", openFinanceConnectTokenRateLimitMiddleware, OpenFinanceController.createConnectToken);
openFinanceRoutes.get("/connections", OpenFinanceController.listConnections);
openFinanceRoutes.post("/connections", OpenFinanceController.saveConnection);
openFinanceRoutes.get("/items/:itemId/accounts", OpenFinanceController.getAccounts);
openFinanceRoutes.get("/accounts/:accountId/transactions", OpenFinanceController.getTransactions);
openFinanceRoutes.get("/items/:itemId/credit-cards", OpenFinanceController.getCreditCards);
