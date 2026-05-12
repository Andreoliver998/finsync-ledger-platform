import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  authLoginRateLimitMiddleware,
  authRegisterRateLimitMiddleware
} from "../middlewares/securityMiddleware.js";

export const authRoutes = Router();

authRoutes.post("/register", authRegisterRateLimitMiddleware, AuthController.register);
authRoutes.post("/login", authLoginRateLimitMiddleware, AuthController.login);
authRoutes.get("/me", authMiddleware, AuthController.me);
authRoutes.post("/logout", authMiddleware, AuthController.logout);
