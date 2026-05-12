import { Router } from "express";
import { FinancialSyncController } from "../controllers/FinancialSyncController.js";
import { syncRateLimitMiddleware } from "../middlewares/securityMiddleware.js";

export const financialSyncRoutes = Router();

financialSyncRoutes.post("/connections/:connectionId", syncRateLimitMiddleware, FinancialSyncController.syncConnection);
financialSyncRoutes.get("/accounts", FinancialSyncController.listAccounts);
financialSyncRoutes.get("/transactions", FinancialSyncController.listTransactions);
financialSyncRoutes.get("/dashboard-summary", FinancialSyncController.dashboardSummary);
