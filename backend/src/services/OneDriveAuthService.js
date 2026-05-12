import crypto from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { decryptSecret, encryptSecret } from "../utils/secureToken.js";

const GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me";
const DEFAULT_FOLDER_PATH = "/FinSync-Ledger/Entrada";

function getScopes() {
  return env.microsoftScopes.split(/\s+/).filter(Boolean);
}

function getMicrosoftAuthBase() {
  // Usa env.microsoftTenantId que já tem fallback "common" para App Registrations
  // configurados como "Todos os utilizadores de contas Microsoft".
  const tenant = env.microsoftTenantId;
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
}

function encodeState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

function decodeState(state) {
  const [body, signature] = String(state || "").split(".");

  if (!body || !signature) {
    throw new HttpError(400, "Parâmetro state inválido.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(body)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new HttpError(400, "State inválido ou adulterado.");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

  if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
    throw new HttpError(400, "State expirado ou inválido.");
  }

  return payload;
}

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    client_id: env.microsoftClientId,
    client_secret: env.microsoftClientSecret,
    code,
    redirect_uri: env.microsoftRedirectUri,
    grant_type: "authorization_code",
    scope: getScopes().join(" ")
  });

  const response = await fetch(`${getMicrosoftAuthBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new HttpError(502, "Falha ao trocar authorization code por tokens Microsoft.");
  }

  return response.json();
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: env.microsoftClientId,
    client_secret: env.microsoftClientSecret,
    refresh_token: refreshToken,
    redirect_uri: env.microsoftRedirectUri,
    grant_type: "refresh_token",
    scope: getScopes().join(" ")
  });

  const response = await fetch(`${getMicrosoftAuthBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new HttpError(401, "Não foi possível renovar o token Microsoft.");
  }

  return response.json();
}

async function fetchMicrosoftProfile(accessToken) {
  const response = await fetch(GRAPH_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new HttpError(502, "Não foi possível obter o perfil Microsoft do usuário.");
  }

  return response.json();
}

function toExpiryDate(expiresInSeconds) {
  return expiresInSeconds
    ? new Date(Date.now() + Number(expiresInSeconds) * 1000)
    : null;
}

export class OneDriveAuthService {
  static buildAuthUrl(userId) {
    if (!env.microsoftClientId || !env.microsoftClientSecret || !env.microsoftRedirectUri) {
      throw new HttpError(500, "Integração Microsoft não configurada no backend.");
    }

    const state = encodeState({
      userId,
      nonce: crypto.randomUUID(),
      exp: Date.now() + 10 * 60 * 1000
    });

    const url = new URL(`${getMicrosoftAuthBase()}/authorize`);
    url.searchParams.set("client_id", env.microsoftClientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", env.microsoftRedirectUri);
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", getScopes().join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    logger.debug("OneDrive auth URL gerada.", { userId });

    return {
      authUrl: url.toString()
    };
  }

  static async handleCallback({ code, state }) {
    const payload = decodeState(state);
    const tokenPayload = await exchangeCodeForTokens(code);
    const accessToken = tokenPayload.access_token;
    const refreshToken = tokenPayload.refresh_token;
    const profile = await fetchMicrosoftProfile(accessToken);

    await prisma.oneDriveConnection.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        microsoftUserId: profile.id || null,
        displayName: profile.displayName || null,
        email: profile.mail || profile.userPrincipalName || null,
        accessToken: encryptSecret(accessToken),
        refreshToken: encryptSecret(refreshToken),
        expiresAt: toExpiryDate(tokenPayload.expires_in),
        status: "CONNECTED",
        folderPath: DEFAULT_FOLDER_PATH
      },
      update: {
        microsoftUserId: profile.id || null,
        displayName: profile.displayName || null,
        email: profile.mail || profile.userPrincipalName || null,
        accessToken: encryptSecret(accessToken),
        refreshToken: encryptSecret(refreshToken),
        expiresAt: toExpiryDate(tokenPayload.expires_in),
        status: "CONNECTED"
      }
    });

    return {
      redirectUrl: `${env.frontendUrl}/onedrive?onedrive=connected`
    };
  }

  static async getConnection(userId) {
    const connection = await prisma.oneDriveConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      throw new HttpError(404, "Conta OneDrive não conectada.");
    }

    return connection;
  }

  static async getValidAccessToken(userId) {
    const connection = await this.getConnection(userId);

    if (!connection.accessToken) {
      throw new HttpError(401, "Conexão OneDrive sem token ativo.");
    }

    const expiresSoon = !connection.expiresAt || connection.expiresAt.getTime() <= Date.now() + 60 * 1000;

    if (!expiresSoon) {
      return {
        accessToken: decryptSecret(connection.accessToken),
        connection
      };
    }

    if (!connection.refreshToken) {
      await prisma.oneDriveConnection.update({
        where: { userId },
        data: { status: "EXPIRED" }
      });

      throw new HttpError(401, "A conexão OneDrive expirou e requer nova autenticação.");
    }

    try {
      const refreshed = await refreshAccessToken(decryptSecret(connection.refreshToken));
      const updated = await prisma.oneDriveConnection.update({
        where: { userId },
        data: {
          accessToken: encryptSecret(refreshed.access_token),
          refreshToken: refreshed.refresh_token
            ? encryptSecret(refreshed.refresh_token)
            : connection.refreshToken,
          expiresAt: toExpiryDate(refreshed.expires_in),
          status: "CONNECTED"
        }
      });

      return {
        accessToken: refreshed.access_token,
        connection: updated
      };
    } catch (error) {
      await prisma.oneDriveConnection.update({
        where: { userId },
        data: { status: "EXPIRED" }
      });

      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(401, "Falha ao renovar a conexão OneDrive.");
    }
  }

  static async disconnect(userId) {
    const existing = await prisma.oneDriveConnection.findUnique({ where: { userId } });

    if (!existing) {
      return { disconnected: true };
    }

    await prisma.oneDriveConnection.delete({
      where: { userId }
    });

    return { disconnected: true };
  }
}
