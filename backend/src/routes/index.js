import { Router } from "express";
import { env } from "../config/env.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authRoutes } from "./authRoutes.js";
import { cardRoutes } from "./cardRoutes.js";
import { categoryRoutes } from "./categoryRoutes.js";
import { transactionRoutes } from "./transactionRoutes.js";
import { summaryRoutes } from "./summaryRoutes.js";
import { manualTransactionRoutes } from "./manualTransactionRoutes.js";
import { openFinanceRoutes } from "./openFinanceRoutes.js";
import { openFinanceWebhookRoutes } from "./openFinanceWebhookRoutes.js";
import { financialSyncRoutes } from "./financialSyncRoutes.js";
import { ledgerImportRoutes } from "./ledgerImportRoutes.js";
import { oneDriveRoutes } from "./oneDriveRoutes.js";
import { OneDriveController } from "../controllers/OneDriveController.js";
import {
  alertRoutes,
  financialAiRoutes,
  goalRoutes,
  investmentRoutes,
  reportRoutes,
  settingsRoutes
} from "./betaModuleRoutes.js";
import { dashboardMetricsRoutes } from "./dashboardMetricsRoutes.js";

export const routes = Router();

routes.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: env.nodeEnv
  });
});

routes.use("/auth", authRoutes);
routes.get("/onedrive/callback", OneDriveController.callback);
routes.use("/cards", authMiddleware, cardRoutes);
routes.use("/categories", authMiddleware, categoryRoutes);
routes.use("/transactions", authMiddleware, transactionRoutes);
routes.use("/manual-transactions", authMiddleware, manualTransactionRoutes);
routes.use("/summary", authMiddleware, summaryRoutes);
routes.use("/open-finance/webhook", openFinanceWebhookRoutes);
routes.use("/open-finance", authMiddleware, openFinanceRoutes);
routes.use("/sync", authMiddleware, financialSyncRoutes);
routes.use("/ledger", authMiddleware, ledgerImportRoutes);
routes.use("/onedrive", authMiddleware, oneDriveRoutes);
routes.use("/settings", authMiddleware, settingsRoutes);
routes.use("/goals", authMiddleware, goalRoutes);
routes.use("/alerts", authMiddleware, alertRoutes);
routes.use("/investments", authMiddleware, investmentRoutes);
routes.use("/reports", authMiddleware, reportRoutes);
routes.use("/financial-ai", authMiddleware, financialAiRoutes);
routes.use("/dashboard", authMiddleware, dashboardMetricsRoutes);
