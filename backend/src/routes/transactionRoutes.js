import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController.js";
import { TransactionsController } from "../controllers/TransactionsController.js";

export const transactionRoutes = Router();

transactionRoutes.post("/", TransactionController.create);
transactionRoutes.get("/", TransactionController.list);
transactionRoutes.get("/:transactionId", TransactionsController.getTransactionById);
transactionRoutes.put("/:id", TransactionController.update);
transactionRoutes.delete("/:id", TransactionController.remove);
