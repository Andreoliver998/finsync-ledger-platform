import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const OPENAI_REQUEST_TIMEOUT_MS = 30000;
let clientInstance = null;

function getClient() {
  if (!env.openaiApiKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: env.openaiApiKey,
      timeout: OPENAI_REQUEST_TIMEOUT_MS
    });
  }

  return clientInstance;
}

function compactPrompt(value, maxLength = 24000) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 64)}\n\n[truncated:${text.length - maxLength + 64}]`;
}

function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new Error("Resposta vazia da OpenAI.");
  }

  return JSON.parse(String(rawText).trim());
}

export class OpenAIClientService {
  static isEnabled() {
    return Boolean(env.openaiApiKey);
  }

  static async generateStructuredObject({
    schema,
    systemPrompt,
    userPrompt,
    model = env.openaiModel,
    maxPromptLength = 24000
  }) {
    if (!schema || typeof schema.parse !== "function") {
      throw new Error("Schema Zod inválido para geração estruturada.");
    }

    const client = getClient();
    if (!client) {
      return null;
    }

    try {
      const response = await client.responses.create({
        model,
        truncation: "auto",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: compactPrompt(systemPrompt, 8000)
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: compactPrompt(userPrompt, maxPromptLength)
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        }
      });

      const parsed = parseJsonResponse(response.output_text);
      return schema.parse(parsed);
    } catch (error) {
      logger.warn("Falha ao gerar resposta estruturada com OpenAI.", {
        message: error?.message,
        model
      });
      return null;
    }
  }
}
