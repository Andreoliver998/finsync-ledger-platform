import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const backendRootPath = path.resolve(path.dirname(currentFilePath), "../..");

dotenv.config({ path: path.join(backendRootPath, ".env") });

const LOCAL_FRONTEND_URL = "http://localhost:5174";
const LOCAL_API_URL = "http://localhost:3334";
const PRODUCTION_FRONTEND_URL = process.env.FRONTEND_URL || LOCAL_FRONTEND_URL;
const PRODUCTION_API_URL = process.env.API_URL || LOCAL_API_URL;
const REQUIRED_ALWAYS = ["JWT_SECRET", "DATABASE_URL"];

const KNOWN_WEAK_JWT_SECRETS = new Set([
  "troque_essa_chave_por_uma_chave_forte",
  "changeme",
  "secret",
  "password",
  "jwt_secret",
  "your_jwt_secret",
  "supersecret",
  "mysecret",
  "12345678901234567890123456789012"
]);

function getNodeEnv() {
  return process.env.NODE_ENV || "development";
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function requireEnvironmentVariables() {
  const required = [...REQUIRED_ALWAYS];

  if (parseBoolean(process.env.ENABLE_PLUGGY, true)) {
    if (getNodeEnv() === "production") {
      required.push("PLUGGY_CLIENT_ID", "PLUGGY_CLIENT_SECRET");
    }
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}.`);
  }
}

function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return; // requireEnvironmentVariables() já captura ausência
  }

  if (KNOWN_WEAK_JWT_SECRETS.has(jwtSecret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET está usando um valor placeholder inseguro. " +
      "Gere uma chave aleatória forte: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
  }
}

function buildAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const developmentOrigins = [
    LOCAL_FRONTEND_URL,
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ];

  const productionOrigins = [PRODUCTION_FRONTEND_URL];
  const baseOrigins = getNodeEnv() === "production" ? productionOrigins : developmentOrigins;

  return Array.from(new Set([...baseOrigins, ...configuredOrigins]));
}

requireEnvironmentVariables();
validateJwtSecret();

export const env = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3334),
  nodeEnv: getNodeEnv(),
  isProduction: getNodeEnv() === "production",
  appName: process.env.APP_NAME || "FinSync",
  apiUrl: process.env.API_URL || (getNodeEnv() === "production" ? PRODUCTION_API_URL : LOCAL_API_URL),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  jwtIssuer: process.env.JWT_ISSUER || "finsync-api",
  jwtAudience: process.env.JWT_AUDIENCE || "finsync-web",
  frontendUrl: process.env.FRONTEND_URL || (getNodeEnv() === "production" ? PRODUCTION_FRONTEND_URL : LOCAL_FRONTEND_URL),
  corsAllowedOrigins: buildAllowedOrigins(),
  enablePluggy: parseBoolean(process.env.ENABLE_PLUGGY, false),
  openFinanceProvider: process.env.OPEN_FINANCE_PROVIDER || "disabled",
  pluggyClientId: process.env.PLUGGY_CLIENT_ID || "",
  pluggyClientSecret: process.env.PLUGGY_CLIENT_SECRET || "",
  pluggyWebhookUrl: process.env.PLUGGY_WEBHOOK_URL || `${PRODUCTION_API_URL}/api/open-finance/webhook/pluggy`,
  pluggyOauthRedirectUrl: process.env.PLUGGY_OAUTH_REDIRECT_URL || `${PRODUCTION_FRONTEND_URL}/open-finance/callback`,
  pluggyIncludeSandbox: parseBoolean(process.env.PLUGGY_INCLUDE_SANDBOX, getNodeEnv() !== "production"),
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID || "",
  microsoftTenantId: process.env.MICROSOFT_TENANT_ID || "common",
  microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  microsoftRedirectUri: process.env.MICROSOFT_REDIRECT_URI || `${LOCAL_API_URL}/api/onedrive/callback`,
  microsoftScopes: process.env.MICROSOFT_SCOPES || "offline_access Files.Read User.Read",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  tokenEncryptionSecret: process.env.TOKEN_ENCRYPTION_SECRET || process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL || (getNodeEnv() === "production" ? "info" : "debug")
};
