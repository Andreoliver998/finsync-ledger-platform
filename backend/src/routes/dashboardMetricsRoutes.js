import { Router } from "express";
import { DashboardMetricsController } from "../controllers/DashboardMetricsController.js";

export const dashboardMetricsRoutes = Router();

dashboardMetricsRoutes.get("/metrics", DashboardMetricsController.extendedMetrics);
dashboardMetricsRoutes.get("/all-transactions", DashboardMetricsController.allTransactions);
