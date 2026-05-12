import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { corsOptions } from "../config/cors.js";
import { logger } from "../lib/logger.js";

const PLUGGY_ORIGINS = [
  "https://cdn.pluggy.ai",
  "https://connect.pluggy.ai",
  "https://api.pluggy.ai",
  "https://sandbox.pluggy.ai"
];

const RATE_LIMIT_RESPONSE = {
  success: false,
  message: "Muitas tentativas. Aguarde alguns instantes e tente novamente."
};

function createRateLimiter({ windowMs, limit, message = RATE_LIMIT_RESPONSE.message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler(req, res) {
      logger.warn("Rate limit aplicado.", {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      res.status(429).json({
        success: false,
        message
      });
    }
  });
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".") || key === "__proto__" || key === "constructor" || key === "prototype") {
      delete value[key];
      continue;
    }

    value[key] = sanitizeValue(value[key]);
  }

  return value;
}

export function sanitizeRequestMiddleware(req, res, next) {
  sanitizeValue(req.body);
  sanitizeValue(req.query);
  sanitizeValue(req.params);
  next();
}

export function requestLoggerMiddleware(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("HTTP request finalizada.", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userId: req.user?.id
    });
  });

  next();
}

export const corsMiddleware = cors(corsOptions);

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "connect-src": ["'self'", env.frontendUrl, env.apiUrl, ...PLUGGY_ORIGINS],
      "font-src": ["'self'", "data:"],
      "frame-ancestors": ["'none'"],
      "frame-src": ["'self'", "https://connect.pluggy.ai", "https://cdn.pluggy.ai"],
      "img-src": ["'self'", "data:", "blob:", env.frontendUrl, ...PLUGGY_ORIGINS],
      "object-src": ["'none'"],
      "script-src": ["'self'", "https://cdn.pluggy.ai"],
      "style-src": ["'self'", "https://cdn.pluggy.ai"],
      "upgrade-insecure-requests": env.isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: env.isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "no-referrer" },
  xXssProtection: true
});

export const rateLimitMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100
});

export const authLoginRateLimitMiddleware = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 5,
  message: "Muitas tentativas de login. Aguarde 1 minuto e tente novamente."
});

export const authRegisterRateLimitMiddleware = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 3,
  message: "Muitas tentativas de cadastro. Aguarde 1 minuto e tente novamente."
});

export const openFinanceConnectTokenRateLimitMiddleware = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: "Muitas solicitações Open Finance. Aguarde alguns instantes."
});

export const syncRateLimitMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Muitas sincronizações solicitadas. Aguarde antes de tentar novamente."
});

export const webhookRateLimitMiddleware = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: "Webhook temporariamente limitado."
});
