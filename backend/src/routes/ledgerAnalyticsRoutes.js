import { Router } from "express";
import { LedgerAnalyticsController } from "../controllers/LedgerAnalyticsController.js";

export const ledgerAnalyticsRoutes = Router();

ledgerAnalyticsRoutes.get("/overview", LedgerAnalyticsController.overview);
ledgerAnalyticsRoutes.get("/timeline", LedgerAnalyticsController.timeline);
ledgerAnalyticsRoutes.get("/categories", LedgerAnalyticsController.categories);
ledgerAnalyticsRoutes.get("/merchants", LedgerAnalyticsController.merchants);
ledgerAnalyticsRoutes.get("/payment-methods", LedgerAnalyticsController.paymentMethods);
ledgerAnalyticsRoutes.get("/reports", LedgerAnalyticsController.reports);
ledgerAnalyticsRoutes.get("/executive-summary", LedgerAnalyticsController.executiveSummary);
ledgerAnalyticsRoutes.get("/statement-reading", LedgerAnalyticsController.statementReading);
ledgerAnalyticsRoutes.get("/executive-report", LedgerAnalyticsController.executiveReport);
ledgerAnalyticsRoutes.get("/question-answers", LedgerAnalyticsController.questionAnswers);
ledgerAnalyticsRoutes.get("/rankings", LedgerAnalyticsController.rankings);
ledgerAnalyticsRoutes.get("/insights", LedgerAnalyticsController.insights);
ledgerAnalyticsRoutes.get("/card-usage", LedgerAnalyticsController.cardUsage);
ledgerAnalyticsRoutes.get("/import-quality", LedgerAnalyticsController.importQuality);
ledgerAnalyticsRoutes.get("/confidence", LedgerAnalyticsController.confidence);
