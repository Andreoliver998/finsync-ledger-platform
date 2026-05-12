import { Router } from "express";
import { CardController } from "../controllers/CardController.js";

export const cardRoutes = Router();

cardRoutes.post("/", CardController.create);
cardRoutes.get("/", CardController.list);
cardRoutes.get("/:id", CardController.findById);
cardRoutes.put("/:id", CardController.update);
cardRoutes.delete("/:id", CardController.remove);
