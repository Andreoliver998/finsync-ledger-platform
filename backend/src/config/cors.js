import { env } from "./env.js";
import { logger } from "../lib/logger.js";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Authorization", "Content-Type", "X-Requested-With"];

function isPrivateNetworkHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isAllowedDevelopmentOrigin(origin) {
  if (env.isProduction) {
    return false;
  }

  try {
    const url = new URL(origin);
    return ["5174", "5173", "3000"].includes(url.port) && isPrivateNetworkHost(url.hostname);
  } catch {
    return false;
  }
}

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsAllowedOrigins.includes(origin) || isAllowedDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    logger.warn("Origem bloqueada pelo CORS.", { origin });
    return callback(new Error("Origem não permitida pelo CORS."));
  },
  credentials: true,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  optionsSuccessStatus: 204,
  maxAge: env.isProduction ? 600 : 0
};
