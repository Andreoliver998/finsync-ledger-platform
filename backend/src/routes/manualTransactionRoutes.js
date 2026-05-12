import { Router } from "express";
import { ManualTransactionController } from "../controllers/ManualTransactionController.js";

export const manualTransactionRoutes = Router();

manualTransactionRoutes.post("/", ManualTransactionController.create);
manualTransactionRoutes.get("/", ManualTransactionController.list);
manualTransactionRoutes.get("/:id", ManualTransactionController.findById);
manualTransactionRoutes.put("/:id", ManualTransactionController.update);
manualTransactionRoutes.delete("/:id", ManualTransactionController.remove);
