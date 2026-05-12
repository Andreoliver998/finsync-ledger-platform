import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { FinancialSearchService } from "./FinancialSearchService.js";
import { RecurrenceDetectionService } from "./RecurrenceDetectionService.js";
import { TransactionExplanationService } from "./TransactionExplanationService.js";
import { UserFinancialProfileService } from "./UserFinancialProfileService.js";
import { FinancialAIContextBuilder } from "./FinancialAIContextBuilder.js";
import { FinancialAINarrativeService } from "./FinancialAINarrativeService.js";
import { FinancialAIInsightService } from "./FinancialAIInsightService.js";

const ALLOWED_TYPES = ["person", "merchant", "bank", "paymentMethod", "category"];

export const financialProfileQuerySchema = z.object({
  type: z.enum(ALLOWED_TYPES),
  q: z.string().trim().min(1).max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function includesQuery(value, query) {
  return normalize(value).includes(query);
}

function monthKey(value) {
  return new Date(value).toISOString().slice(0, 7);
}

function monthLabel(value, locale = "pt-BR") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}

function formatCurrency(value, context = {}) {
  return UserFinancialProfileService.formatCurrency(value, context);
}

function formatDate(value, context = {}) {
  return UserFinancialProfileService.formatDate(value, context);
}

function safePreview(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return Object.fromEntries(Object.entries(raw).slice(0, 8));
}

function signedAmount(row) {
  return String(row.type || "").toUpperCase() === "DEBIT"
    ? -Math.abs(Number(row.amount || 0))
    : Math.abs(Number(row.amount || 0));
}

function normalizeLedgerTransaction(row) {
  const enrichment = CategoryClassifierService.classifyFull(row);
  const amount = signedAmount(row);
  return {
    id: row.id,
    date: row.date,
    createdAt: row.createdAt,
    amount,
    absoluteAmount: Math.abs(amount),
    type: row.type,
    direction: enrichment.direction || (amount < 0 ? "OUT" : "IN"),
    description: row.description,
    normalizedDescription: row.normalizedDescription,
    merchantName: enrichment.merchantName || row.counterpartyName || row.description,
    counterpartyName: enrichment.counterpartyName || row.counterpartyName || null,
    category: row.userCategory || row.category || enrichment.category || "Sem categoria",
    paymentMethod: row.paymentMethod || null,
    bank: row.bank || row.importBatch?.bank || null,
    accountName: row.accountName || row.importBatch?.accountName || null,
    tags: row.tags || [],
    status: row.status,
    operationType: enrichment.operationType || null,
    confidenceScore: enrichment.confidenceScore || 0,
    confidenceLabel: enrichment.confidenceLabel || "precisa revisar",
    classificationReason: enrichment.classificationReason || null,
    needsReview: Boolean(enrichment.needsReview),
    explanation: TransactionExplanationService.explain({
      ...row,
      amount,
      direction: enrichment.direction,
      paymentMethod: row.paymentMethod,
      merchantName: enrichment.merchantName,
      counterpartyName: enrichment.counterpartyName || row.counterpartyName,
      explanation: enrichment.explanation,
      needsReview: enrichment.needsReview
    }),
    rawPreview: safePreview(row.raw)
  };
}

function entityValue(transaction, type) {
  if (type === "person") {
    return transaction.counterpartyName || "";
  }
  if (type === "merchant") {
    return transaction.merchantName || transaction.description || "";
  }
  if (type === "bank") {
    return transaction.bank || "";
  }
  if (type === "paymentMethod") {
    return transaction.paymentMethod || transaction.operationType || "";
  }
  if (type === "category") {
    return transaction.category || "";
  }
  return "";
}

function matchesProfile(transaction, type, normalizedQuery) {
  const primary = entityValue(transaction, type);
  if (includesQuery(primary, normalizedQuery)) return true;

  if (type === "merchant") {
    return includesQuery(transaction.description, normalizedQuery);
  }
  if (type === "person") {
    return includesQuery(transaction.description, normalizedQuery);
  }
  return false;
}

function filterDateRange(row, startDate, endExclusive) {
  const date = new Date(row.date);
  if (startDate && date < startDate) return false;
  if (endExclusive && date >= endExclusive) return false;
  return true;
}

function relationshipSummary(type, normalizedName, matches, context) {
  const totalOut = matches.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.absoluteAmount, 0);
  const totalIn = matches.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.absoluteAmount, 0);

  if (type === "person") {
    return UserFinancialProfileService.buildMessage(context, {
      direct: `${normalizedName} apareceu ${matches.length} vezes no seu extrato, com ${formatCurrency(totalOut, context)} enviados e ${formatCurrency(totalIn, context)} recebidos.`,
      didactic: `${normalizedName} apareceu ${matches.length} vezes no período, com ${formatCurrency(totalOut, context)} de saídas e ${formatCurrency(totalIn, context)} de entradas.`,
      executive: `${normalizedName} acumulou ${matches.length} ocorrências, ${formatCurrency(totalOut, context)} enviados e ${formatCurrency(totalIn, context)} recebidos.`,
      consultive: `${normalizedName} concentrou ${matches.length} interações, com ${formatCurrency(totalOut, context)} enviados e ${formatCurrency(totalIn, context)} recebidos.`,
      neutral: `${normalizedName} apareceu ${matches.length} vezes no período, com ${formatCurrency(totalOut, context)} de saídas e ${formatCurrency(totalIn, context)} de entradas.`
    });
  }

  if (type === "merchant") {
    return UserFinancialProfileService.buildMessage(context, {
      direct: `${normalizedName} concentrou ${matches.length} compras e ${formatCurrency(totalOut, context)} em saídas.`,
      didactic: `${normalizedName} apareceu em ${matches.length} compras, totalizando ${formatCurrency(totalOut, context)}.`,
      executive: `${normalizedName} respondeu por ${matches.length} compras e ${formatCurrency(totalOut, context)} em saídas.`,
      consultive: `${normalizedName} concentrou ${matches.length} compras e ${formatCurrency(totalOut, context)} em gasto total.`,
      neutral: `${normalizedName} apareceu em ${matches.length} compras, totalizando ${formatCurrency(totalOut, context)}.`
    });
  }

  return UserFinancialProfileService.buildMessage(context, {
    direct: `${normalizedName} apareceu ${matches.length} vezes no recorte e movimentou ${formatCurrency(totalOut + totalIn, context)}.`,
    didactic: `${normalizedName} apareceu ${matches.length} vezes e movimentou ${formatCurrency(totalOut + totalIn, context)} no período.`,
    executive: `${normalizedName} acumulou ${matches.length} ocorrências e ${formatCurrency(totalOut + totalIn, context)} movimentados.`,
    consultive: `${normalizedName} concentrou ${matches.length} ocorrências e ${formatCurrency(totalOut + totalIn, context)} movimentados no recorte.`,
    neutral: `${normalizedName} apareceu ${matches.length} vezes e movimentou ${formatCurrency(totalOut + totalIn, context)} no período.`
  });
}

function buildTotals(matches = []) {
  const totalIn = matches.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.absoluteAmount, 0);
  const totalOut = matches.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.absoluteAmount, 0);
  const largest = matches.slice().sort((a, b) => b.absoluteAmount - a.absoluteAmount)[0] || null;
  return {
    totalMoved: totalIn + totalOut,
    totalIn,
    totalOut,
    transactionCount: matches.length,
    averageAmount: matches.length ? (totalIn + totalOut) / matches.length : 0,
    largestTransaction: largest ? {
      id: largest.id,
      date: largest.date,
      amount: largest.absoluteAmount,
      direction: largest.direction,
      description: largest.description,
      category: largest.category,
      paymentMethod: largest.paymentMethod
    } : null,
    firstSeenAt: matches.length ? matches[matches.length - 1].date : null,
    lastSeenAt: matches.length ? matches[0].date : null
  };
}

function aggregateBy(matches = [], keySelector, amountField = "absoluteAmount", limit = 10, labelField = "name") {
  const map = new Map();
  for (const item of matches) {
    const key = String(keySelector(item) || "").trim() || "Não identificado";
    const current = map.get(key) || { [labelField]: key, count: 0, totalAmount: 0 };
    current.count += 1;
    current.totalAmount += Number(item[amountField] || 0);
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount || b.count - a.count).slice(0, limit);
}

function buildMonthlyTimeline(matches = [], locale = "pt-BR") {
  const map = new Map();
  for (const item of matches) {
    const key = monthKey(item.date);
    const current = map.get(key) || { month: key, label: monthLabel(key, locale), totalIn: 0, totalOut: 0, totalMoved: 0, count: 0 };
    current.count += 1;
    current.totalMoved += item.absoluteAmount;
    if (item.amount > 0) current.totalIn += item.absoluteAmount;
    else current.totalOut += item.absoluteAmount;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function buildRiskSignals(matches = [], totals = {}, type) {
  const risks = [];
  if (totals.largestTransaction && totals.totalMoved > 0 && (totals.largestTransaction.amount / totals.totalMoved) > 0.35) {
    risks.push({
      level: "warning",
      title: "Concentração elevada",
      message: "Uma transação individual concentra parcela relevante do relacionamento financeiro."
    });
  }
  if (type === "person" && totals.totalOut > totals.totalIn * 2 && totals.totalIn > 0) {
    risks.push({
      level: "info",
      title: "Saída predominante",
      message: "As saídas para essa pessoa superam com folga as entradas recebidas no recorte."
    });
  }
  if (type === "merchant" && matches.filter((item) => item.paymentMethod === "CREDIT").length >= 3) {
    risks.push({
      level: "info",
      title: "Uso recorrente de crédito",
      message: "Há recorrência de compras no crédito com essa contraparte."
    });
  }
  if (!risks.length) {
    risks.push({
      level: "success",
      title: "Leitura estável",
      message: "Não surgiram sinais fortes de risco imediato neste relacionamento."
    });
  }
  return risks.slice(0, 5);
}

const RELATED_ENTITY_EXTRACTORS = {
  person: {
    merchant:      (t) => (t.merchantName && normalize(t.merchantName) !== normalize(t.counterpartyName || "")) ? t.merchantName : null,
    paymentMethod: (t) => t.paymentMethod || t.operationType,
    category:      (t) => t.category && t.category !== "Sem categoria" ? t.category : null,
    bank:          (t) => t.bank
  },
  merchant: {
    person:        (t) => t.counterpartyName,
    paymentMethod: (t) => t.paymentMethod || t.operationType,
    category:      (t) => t.category && t.category !== "Sem categoria" ? t.category : null,
    bank:          (t) => t.bank
  },
  bank: {
    merchant:      (t) => t.merchantName,
    paymentMethod: (t) => t.paymentMethod || t.operationType,
    category:      (t) => t.category && t.category !== "Sem categoria" ? t.category : null,
    person:        (t) => t.counterpartyName
  },
  paymentMethod: {
    merchant:      (t) => t.merchantName,
    category:      (t) => t.category && t.category !== "Sem categoria" ? t.category : null,
    person:        (t) => t.counterpartyName,
    bank:          (t) => t.bank
  },
  category: {
    merchant:      (t) => t.merchantName,
    paymentMethod: (t) => t.paymentMethod || t.operationType,
    person:        (t) => t.counterpartyName,
    bank:          (t) => t.bank
  }
};

function computeTemporalScore(lastSeenDate) {
  if (!lastSeenDate) return 0.1;
  const daysAgo = (Date.now() - new Date(lastSeenDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo < 30) return 1.0;
  if (daysAgo < 90) return 0.6;
  if (daysAgo < 180) return 0.3;
  return 0.1;
}

function buildRelatedProfiles(matches, type, normalizedQuery, totals, recurrenceSignals) {
  if (!matches.length) return [];
  const extractors = RELATED_ENTITY_EXTRACTORS[type] || {};
  const recurrenceMerchants = new Set(
    recurrenceSignals
      .map((s) => normalize(s.merchant || s.merchantName || ""))
      .filter(Boolean)
  );
  const totalMovedBase = totals.totalMoved || 1;
  const totalCountBase = matches.length || 1;
  const result = [];

  for (const [relType, extractor] of Object.entries(extractors)) {
    const entityMap = new Map();

    for (const t of matches) {
      const raw = extractor(t);
      if (!raw || typeof raw !== "string") continue;
      const name = raw.trim().slice(0, 80);
      if (!name || name.length < 2) continue;
      if (normalize(name) === normalizedQuery) continue;

      const existing = entityMap.get(name) || {
        name,
        type: relType,
        transactionCount: 0,
        totalMoved: 0,
        lastSeenAt: null
      };
      existing.transactionCount += 1;
      existing.totalMoved += t.absoluteAmount;
      if (!existing.lastSeenAt || new Date(t.date) > new Date(existing.lastSeenAt)) {
        existing.lastSeenAt = t.date;
      }
      entityMap.set(name, existing);
    }

    const typeEntities = Array.from(entityMap.values())
      .sort((a, b) => b.totalMoved - a.totalMoved || b.transactionCount - a.transactionCount)
      .slice(0, 5);

    for (const entity of typeEntities) {
      const frequencyScore = Math.min(1, (entity.transactionCount / totalCountBase) * 4);
      const amountScore = Math.min(1, entity.totalMoved / totalMovedBase);
      const recurrenceScore = recurrenceMerchants.has(normalize(entity.name)) ? 1 : 0;
      const temporalScore = computeTemporalScore(entity.lastSeenAt);
      const strength = Math.min(
        1,
        0.35 * frequencyScore + 0.30 * amountScore + 0.20 * recurrenceScore + 0.15 * temporalScore
      );
      result.push({
        name: entity.name,
        type: relType,
        relationshipStrength: Math.round(strength * 100) / 100,
        transactionCount: entity.transactionCount,
        totalMoved: Math.round(entity.totalMoved * 100) / 100,
        lastSeenAt: entity.lastSeenAt
      });
    }
  }

  return result
    .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
    .slice(0, 15);
}

function buildInsights(profile, totals, paymentMethods, categories, recurrenceSignals, context) {
  const items = [];
  if (categories[0]) {
    items.push({
      title: "Categoria dominante",
      message: `${categories[0].name} lidera o perfil com ${formatCurrency(categories[0].totalAmount, context)}.`
    });
  }
  if (paymentMethods[0]) {
    items.push({
      title: "Método dominante",
      message: `${paymentMethods[0].name} foi o método mais usado, com ${paymentMethods[0].count} ocorrências.`
    });
  }
  if (recurrenceSignals[0]) {
    items.push({
      title: "Recorrência detectada",
      message: `${recurrenceSignals[0].merchant || profile.name} aparece com padrão ${String(recurrenceSignals[0].frequency || "").toLowerCase() || "recorrente"}.`
    });
  }
  if (totals.largestTransaction) {
    items.push({
      title: "Maior movimentação",
      message: `${totals.largestTransaction.description} registrou ${formatCurrency(totals.largestTransaction.amount, context)} em ${formatDate(totals.largestTransaction.date, context)}.`
    });
  }
  return items.slice(0, 6);
}

function buildNarrative(profile, totals, paymentMethods, categories, timeline, recurrenceSignals, context) {
  const peakMonth = timeline.slice().sort((a, b) => b.totalMoved - a.totalMoved)[0];
  const parts = [
    profile.relationshipSummary,
    categories[0] ? `A categoria mais relevante foi ${categories[0].name}.` : null,
    paymentMethods[0] ? `${paymentMethods[0].name} foi o método mais presente no relacionamento.` : null,
    peakMonth ? `${peakMonth.label} concentrou o maior volume, com ${formatCurrency(peakMonth.totalMoved, context)}.` : null,
    recurrenceSignals.length ? `Também surgiram ${recurrenceSignals.length} sinais de recorrência.` : null
  ];
  return parts.filter(Boolean).join(" ");
}

export class FinancialProfileService {
  static async getProfile(userId, query) {
    const parsed = financialProfileQuerySchema.parse(query);
    const context = await UserFinancialProfileService.getContext(userId);
    const normalizedQuery = normalize(parsed.q);
    const startDate = parsed.startDate ? new Date(parsed.startDate) : null;
    const endExclusive = parsed.endDate ? new Date(new Date(parsed.endDate).getTime() + 24 * 60 * 60 * 1000) : null;

    const rows = await prisma.ledgerTransaction.findMany({
      where: {
        userId,
        status: { not: "DISCARDED" }
      },
      include: {
        importBatch: {
          select: {
            fileName: true,
            bank: true,
            accountName: true,
            provider: true
          }
        }
      },
      orderBy: { date: "desc" },
      take: 6000
    });

    const normalized = rows
      .filter((row) => filterDateRange(row, startDate, endExclusive))
      .map(normalizeLedgerTransaction);

    const matches = normalized.filter((item) => matchesProfile(item, parsed.type, normalizedQuery));
    const classification = FinancialSearchService.classifyEntity(matches, normalizedQuery);
    const totals = buildTotals(matches);
    const paymentMethods = aggregateBy(matches, (item) => item.paymentMethod || item.operationType || "Não identificado");
    const categories = aggregateBy(matches, (item) => item.category || "Sem categoria");
    const monthlyTimeline = buildMonthlyTimeline(matches, context.profile?.locale || "pt-BR");
    const recurrenceSignals = RecurrenceDetectionService.detect(
      matches.map((item) => ({
        id: item.id,
        date: item.date,
        description: item.description,
        signedAmount: item.amount,
        paymentMethod: item.paymentMethod,
        category: item.category,
        merchant: item.merchantName || item.counterpartyName || item.description,
        merchantName: item.merchantName,
        counterpartyName: item.counterpartyName,
        confidenceLabel: item.confidenceLabel
      }))
    ).slice(0, 10);

    const confidence = matches.length
      ? Math.min(1, matches.filter((item) => item.confidenceScore >= 0.7).length / matches.length)
      : 0;

    const profile = {
      type: parsed.type,
      name: parsed.q.trim(),
      normalizedName: normalizedQuery,
      classification,
      confidence,
      relationshipSummary: relationshipSummary(parsed.type, parsed.q.trim(), matches, context)
    };

    const relatedTransactions = matches.slice(0, 60).map((item) => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      absoluteAmount: item.absoluteAmount,
      description: item.description,
      category: item.category,
      paymentMethod: item.paymentMethod,
      merchantName: item.merchantName,
      counterpartyName: item.counterpartyName,
      sourceType: "LEDGER",
      explanation: item.explanation,
      currencyCode: "BRL",
      rawPreview: item.rawPreview
    }));

    const riskSignals = buildRiskSignals(matches, totals, parsed.type);
    const insights = buildInsights(profile, totals, paymentMethods, categories, recurrenceSignals, context);
    const narrative = buildNarrative(profile, totals, paymentMethods, categories, monthlyTimeline, recurrenceSignals, context);
    const relatedProfiles = buildRelatedProfiles(matches, parsed.type, normalizedQuery, totals, recurrenceSignals);

    const baseResponse = {
      profile,
      totals,
      paymentMethods,
      categories,
      monthlyTimeline,
      relatedTransactions,
      recurrenceSignals,
      riskSignals,
      insights,
      narrative,
      relatedProfiles
    };

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "financial-profile",
      userId,
      context: FinancialAIContextBuilder.buildProfileContext(parsed, baseResponse),
      fallback: {
        executiveSummary: profile.relationshipSummary || narrative,
        narrative,
        mainFindings: [
          totals?.transactionCount ? { title: "Volume de relacionamento", description: `${profile.name} apareceu em ${totals.transactionCount} transações no recorte.`, severity: "info", confidence: profile.confidence || 0.7 } : null,
          recurrenceSignals[0] ? { title: "Recorrência detectada", description: `${recurrenceSignals[0].merchant || profile.name} mantém padrão ${recurrenceSignals[0].frequency === "MONTHLY" ? "mensal" : "recorrente"}.`, severity: "opportunity", confidence: 0.68 } : null,
          riskSignals[0] ? { title: riskSignals[0].title || "Sinal relevante", description: riskSignals[0].message || riskSignals[0].description || "Há um sinal importante neste relacionamento.", severity: "attention", confidence: 0.7 } : null
        ].filter(Boolean),
        recommendations: [
          relatedProfiles[0] ? `Compare ${profile.name} com ${relatedProfiles[0].name} para validar concentração relacional.` : null,
          paymentMethods[0] ? `Revise a predominância de ${paymentMethods[0].label || paymentMethods[0].paymentMethod || "método principal"} nesta relação.` : null
        ].filter(Boolean),
        suggestedQuestions: [
          `Qual foi a maior transação com ${profile.name}?`,
          `${profile.name} aparece mais como entrada ou saída?`,
          `Há recorrência relevante ligada a ${profile.name}?`
        ],
        confidence: Number(profile.confidence || 0.72)
      }
    });

    return FinancialAIInsightService.applyToProfile(baseResponse, aiResult);
  }
}
