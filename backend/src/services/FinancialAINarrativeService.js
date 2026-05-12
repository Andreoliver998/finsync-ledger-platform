import crypto from "node:crypto";
import { z } from "zod";
import { OpenAIClientService } from "./OpenAIClientService.js";

const CACHE_TTL_MS = 1000 * 60 * 30;
const aiCache = new Map();

function boundedText(maxLength) {
  return z.string().trim().min(1).transform((value) => value.slice(0, maxLength));
}

const findingSchema = z.object({
  title: boundedText(120),
  description: boundedText(280),
  type: boundedText(80).nullable().optional(),
  severity: z.enum(["info", "attention", "risk", "opportunity"]).default("info"),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.6),
  entity: boundedText(100).nullable().optional(),
  entityType: z.enum(["person", "merchant", "bank", "paymentMethod", "category"]).nullable().optional(),
  category: boundedText(100).nullable().optional(),
  paymentMethod: boundedText(80).nullable().optional(),
  transactionId: boundedText(40).nullable().optional(),
  relatedTransactions: z.array(z.object({
    id: boundedText(40)
  })).max(6).default([]),
  evidenceItems: z.array(z.object({
    label: boundedText(80),
    value: boundedText(160)
  })).max(8).default([]),
  suggestedAction: z.object({
    label: boundedText(80),
    route: z.enum(["FinancialProfile", "FinancialSearch", "TransactionDetails", "RelationshipGraph", "TransactionsTab"]).nullable().optional()
  }).nullable().optional(),
  navigationTarget: z.object({
    route: z.enum(["FinancialProfile", "FinancialSearch", "TransactionDetails", "RelationshipGraph", "TransactionsTab"]).nullable().optional()
  }).nullable().optional()
});

const analysisSchema = z.object({
  executiveSummary: boundedText(320),
  narrative: boundedText(900),
  mainFindings: z.array(findingSchema).max(8).default([]),
  recommendations: z.array(boundedText(180)).max(6).default([]),
  suggestedQuestions: z.array(boundedText(120)).max(6).default([]),
  confidence: z.number().min(0).max(1).default(0.7)
});

function now() {
  return Date.now();
}

function buildHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function getCache(cacheKey) {
  const entry = aiCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now()) {
    aiCache.delete(cacheKey);
    return null;
  }

  return entry.value;
}

function setCache(cacheKey, value) {
  aiCache.set(cacheKey, {
    value,
    expiresAt: now() + CACHE_TTL_MS
  });
}

function buildSystemPrompt(useCase) {
  return [
    "Você é o motor invisível de interpretação financeira do FinSync.",
    "Sua função é interpretar dados agregados reais, nunca inventar números, entidades, transações ou conclusões sem base.",
    "Você não é um chatbot e não deve escrever como conversa.",
    "Escreva em português do Brasil, com tom profissional, executivo e claro.",
    "Se os dados forem insuficientes, declare isso explicitamente.",
    "Responda SOMENTE em JSON válido.",
    "O JSON deve seguir exatamente estas chaves: executiveSummary string, narrative string, mainFindings array, recommendations array, suggestedQuestions array, confidence number.",
    "Cada item de mainFindings deve conter: title string, description string, severity info|attention|risk|opportunity, confidence number.",
    "Quando houver base no contexto, cada mainFinding pode incluir metadados acionáveis: type, priority, entity, entityType, category, paymentMethod, transactionId, relatedTransactions, evidenceItems, suggestedAction e navigationTarget.",
    "transactionId e relatedTransactions.id só podem usar IDs explicitamente presentes em relatedTransactions ou largestTransactions do contexto. Nunca invente IDs.",
    "Se não houver certeza sobre entity, category, paymentMethod ou transactionId, use null ou omita o campo.",
    "navigationTarget.route deve ser uma destas rotas: FinancialProfile, FinancialSearch, TransactionDetails, RelationshipGraph, TransactionsTab.",
    "Limites: executiveSummary até 320 caracteres, narrative até 900, recomendações até 180 cada, perguntas até 120 cada.",
    "Não use markdown, texto antes/depois do JSON, nem nomes de campos diferentes.",
    `Use case: ${useCase}.`
  ].join(" ");
}

function buildUserPrompt(useCase, context) {
  return [
    `Gere uma análise financeira automática para o caso "${useCase}".`,
    "Use apenas o contexto abaixo.",
    "Priorize interpretação, síntese, comportamento, concentração, recorrência, risco e oportunidade.",
    "Evite jargão desnecessário.",
    "Contexto JSON:",
    JSON.stringify(context)
  ].join("\n\n");
}

export class FinancialAINarrativeService {
  static async generate({ useCase, userId, context, fallback }) {
    const contextHash = buildHash({ useCase, userId, context });
    const cacheKey = `ai:${userId}:${useCase}:${contextHash}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true, contextHash };
    }

    const aiResult = await OpenAIClientService.generateStructuredObject({
      schema: analysisSchema,
      systemPrompt: buildSystemPrompt(useCase),
      userPrompt: buildUserPrompt(useCase, context)
    });

    const finalResult = aiResult
      ? {
          ...aiResult,
          provider: "openai",
          cached: false
        }
      : {
          ...fallback,
          provider: "fallback",
          cached: false
        };

    setCache(cacheKey, finalResult);
    return { ...finalResult, contextHash };
  }
}
