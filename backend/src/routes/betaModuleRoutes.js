import { Router } from "express";
import { BetaModuleController } from "../controllers/BetaModuleController.js";

export const settingsRoutes = Router();
settingsRoutes.get("/", BetaModuleController.getSettings);
settingsRoutes.put("/", BetaModuleController.updateSettings);

export const goalRoutes = Router();
goalRoutes.get("/", BetaModuleController.listGoals);
goalRoutes.post("/", BetaModuleController.createGoal);
goalRoutes.put("/:id", BetaModuleController.updateGoal);
goalRoutes.delete("/:id", BetaModuleController.removeGoal);

export const alertRoutes = Router();
alertRoutes.get("/", BetaModuleController.listAlerts);
alertRoutes.post("/", BetaModuleController.createAlert);
alertRoutes.put("/:id", BetaModuleController.updateAlert);
alertRoutes.delete("/:id", BetaModuleController.removeAlert);

export const investmentRoutes = Router();
investmentRoutes.get("/", BetaModuleController.listInvestments);
investmentRoutes.post("/", BetaModuleController.createInvestment);
investmentRoutes.put("/:id", BetaModuleController.updateInvestment);
investmentRoutes.delete("/:id", BetaModuleController.removeInvestment);

export const reportRoutes = Router();
reportRoutes.get("/", BetaModuleController.reports);

export const financialAiRoutes = Router();
financialAiRoutes.get("/insights", BetaModuleController.financialAi);
