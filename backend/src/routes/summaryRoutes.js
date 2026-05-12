import { Router } from "express";
import { SummaryController } from "../controllers/SummaryController.js";

export const summaryRoutes = Router();

summaryRoutes.get("/monthly", SummaryController.monthly);
