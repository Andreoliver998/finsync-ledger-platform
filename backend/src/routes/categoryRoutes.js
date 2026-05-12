import { Router } from "express";
import { CategoryController } from "../controllers/CategoryController.js";

export const categoryRoutes = Router();

categoryRoutes.post("/", CategoryController.create);
categoryRoutes.get("/", CategoryController.list);
categoryRoutes.put("/:id", CategoryController.update);
categoryRoutes.delete("/:id", CategoryController.remove);
