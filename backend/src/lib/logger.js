import { env } from "../config/env.js";

// Substrings que, se presentes no nome normalizado da chave, indicam dado sensível.
// Usar contains em vez de exact-match garante cobertura de chaves compostas como
// "microsoftClientSecret", "tokenEncryptionSecret", "refreshToken", etc.
const SENSITIVE_SUBSTRINGS = [
  "token",
  "secret",
  "password",
  "passwordhash",
  "apikey",
  "authorization",
  "cookie",
  "databaseurl",
  "jwtsecret"
];

function normalizeKey(key) {
  return String(key).replace(/[-_\s]/g, "").toLowerCase();
}

function isSensitiveKey(key) {
  const normalized = normalizeKey(key);
  return SENSITIVE_SUBSTRINGS.some((sub) => normalized.includes(sub));
}

function redact(value) {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        isSensitiveKey(key) ? "[REDACTED]" : redact(entryValue)
      ])
    );
  }

  return value;
}

function write(level, message, meta) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {})
  };

  if (env.isProduction) {
    console[level === "error" ? "error" : "log"](JSON.stringify(payload));
    return;
  }

  console[level === "error" ? "error" : "log"](payload);
}

export const logger = {
  debug(message, meta) {
    if (!env.isProduction && env.logLevel === "debug") {
      write("debug", message, meta);
    }
  },
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  }
};
