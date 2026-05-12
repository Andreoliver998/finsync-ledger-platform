import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export function errorMiddleware(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos.",
      errors: error.errors
    });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 && env.isProduction
    ? "Erro interno no servidor."
    : error.message || "Erro interno no servidor.";

  logger[statusCode >= 500 ? "error" : "warn"]("Erro tratado pela API.", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    stack: env.isProduction ? undefined : error.stack
  });

  return res.status(statusCode).json({
    success: false,
    message
  });
}
