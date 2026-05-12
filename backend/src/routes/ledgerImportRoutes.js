import { Router } from "express";
import { LedgerImportController } from "../controllers/LedgerImportController.js";
import { ledgerAnalyticsRoutes } from "./ledgerAnalyticsRoutes.js";
import { IntelligentReadingController } from "../controllers/IntelligentReadingController.js";
import { FinancialProfileController } from "../controllers/FinancialProfileController.js";
import { RelationshipGraphController } from "../controllers/RelationshipGraphController.js";

export const ledgerImportRoutes = Router();

ledgerImportRoutes.use("/analytics", ledgerAnalyticsRoutes);

ledgerImportRoutes.post("/imports/csv/preview", LedgerImportController.preview);
ledgerImportRoutes.post("/imports/csv/confirm", LedgerImportController.confirm);
ledgerImportRoutes.get("/imports", LedgerImportController.listImports);
ledgerImportRoutes.get("/imports/:id", LedgerImportController.findImportById);
ledgerImportRoutes.get("/search", LedgerImportController.search);
ledgerImportRoutes.get("/intelligent-reading", IntelligentReadingController.read);
ledgerImportRoutes.get("/financial-profile", FinancialProfileController.read);
ledgerImportRoutes.get("/relationship-graph", RelationshipGraphController.read);
ledgerImportRoutes.get("/transactions", LedgerImportController.listTransactions);
ledgerImportRoutes.patch("/transactions/:id", LedgerImportController.updateTransaction);
ledgerImportRoutes.get("/reconciliation/review", LedgerImportController.reviewQueue);
ledgerImportRoutes.post("/reconciliation/:id/resolve", LedgerImportController.resolveReview);
ledgerImportRoutes.delete("/imports/:id", LedgerImportController.removeImport);
