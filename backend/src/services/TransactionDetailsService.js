import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { MerchantAnalyticsService } from "./MerchantAnalyticsService.js";
import { PaymentTypeClassifierService } from "./PaymentTypeClassifierService.js";
import { RecurrenceDetectionService } from "./RecurrenceDetectionService.js";
import { TransactionExplanationService } from "./TransactionExplanationService.js";
import { FinancialAIContextBuilder } from "./FinancialAIContextBuilder.js";
import { FinancialAINarrativeService } from "./FinancialAINarrativeService.js";
import { FinancialAIInsightService } from "./FinancialAIInsightService.js";

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}

function signedAmountFromLedger(item) {
  return String(item.type || "").toUpperCase() === "DEBIT"
    ? -Math.abs(Number(item.amount || 0))
    : Math.abs(Number(item.amount || 0));
}

function summarizeRaw(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const entries = Object.entries(raw)
    .slice(0, 8)
    .map(([key, value]) => {
      if (value === null || value === undefined) return [key, value];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return [key, value];
      }
      if (Array.isArray(value)) {
        return [key, `array(${value.length})`];
      }
      return [key, "object"];
    });

  return Object.fromEntries(entries);
}

function normalizeLedgerTransaction(item) {
  const enrichment = CategoryClassifierService.classifyFull(item);
  const merchant = enrichment.merchantName
    || enrichment.counterpartyName
    || MerchantAnalyticsService.detectMerchant({
      ...item,
      counterpartyName: enrichment.counterpartyName || item.counterpartyName
    });
  const signedAmount = signedAmountFromLedger(item);

  return {
    id: item.id,
    sourceType: "LEDGER",
    source: item.source || item.importBatch?.source || "CSV_IMPORT",
    provider: item.provider || item.importBatch?.provider || null,
    date: item.date,
    createdAt: item.createdAt,
    description: item.description,
    normalizedDescription: item.normalizedDescription,
    amount: signedAmount,
    absoluteAmount: Math.abs(signedAmount),
    currencyCode: item.currencyCode || "BRL",
    type: item.type,
    status: item.status,
    bank: item.bank || item.importBatch?.bank || null,
    accountName: item.accountName || item.importBatch?.accountName || null,
    category: enrichment.category || item.userCategory || item.category || "Sem categoria",
    paymentMethod: item.paymentMethod || null,
    tags: item.tags || [],
    merchant: merchant || null,
    merchantName: enrichment.merchantName || merchant || null,
    counterpartyName: enrichment.counterpartyName || item.counterpartyName || null,
    direction: enrichment.direction || (signedAmount >= 0 ? "IN" : "OUT"),
    confidenceScore: enrichment.confidenceScore ?? 0,
    confidenceLabel: enrichment.confidenceLabel || "precisa revisar",
    classificationReason: enrichment.classificationReason || null,
    operationType: enrichment.operationType || null,
    needsReview: Boolean(enrichment.needsReview || item.needsReview),
    explanation: item.explanation || enrichment.explanation || null,
    fileName: item.importBatch?.fileName || null,
    rawPreview: summarizeRaw(item.raw),
    rawAvailable: Boolean(item.raw),
    importBatchId: item.importBatchId || null
  };
}

function normalizeManualTransaction(item) {
  const signedAmount = String(item.type || "").toUpperCase() === "EXPENSE"
    ? -Math.abs(Number(item.amount || 0))
    : Math.abs(Number(item.amount || 0));
  const merchant = MerchantAnalyticsService.detectMerchant(item);

  return {
    id: item.id,
    sourceType: "MANUAL",
    source: item.source || "MANUAL",
    provider: null,
    date: item.date,
    createdAt: item.createdAt,
    description: item.description,
    normalizedDescription: null,
    amount: signedAmount,
    absoluteAmount: Math.abs(signedAmount),
    currencyCode: "BRL",
    type: signedAmount < 0 ? "DEBIT" : "CREDIT",
    status: item.status,
    bank: item.bank || null,
    accountName: item.card || null,
    category: item.category || "Sem categoria",
    paymentMethod: item.paymentMethod || null,
    tags: [],
    merchant: merchant || item.place || null,
    merchantName: merchant || item.place || null,
    counterpartyName: null,
    direction: signedAmount >= 0 ? "IN" : "OUT",
    confidenceScore: 1,
    confidenceLabel: "detectado",
    classificationReason: "Lançamento manual criado pelo usuário.",
    operationType: item.paymentMethod || null,
    needsReview: false,
    explanation: null,
    fileName: null,
    rawPreview: null,
    rawAvailable: false,
    importBatchId: null
  };
}

function normalizeFinancialTransaction(item) {
  const signedAmount = Number(item.amount || 0);
  const paymentMethod = item.paymentData?.method || item.paymentData?.type || null;
  const counterparty = item.paymentData?.receiver || item.paymentData?.sender || item.paymentData?.merchant || null;

  return {
    id: item.id,
    sourceType: "FINANCIAL",
    source: "OPEN_FINANCE",
    provider: item.connection?.provider || null,
    date: item.date,
    createdAt: item.createdAt,
    description: item.description || "Transação Open Finance",
    normalizedDescription: null,
    amount: signedAmount,
    absoluteAmount: Math.abs(signedAmount),
    currencyCode: item.currencyCode || "BRL",
    type: signedAmount < 0 ? "DEBIT" : "CREDIT",
    status: item.status || null,
    bank: item.connection?.institution || item.bankAccount?.marketingName || item.bankAccount?.name || null,
    accountName: item.bankAccount?.name || null,
    category: item.category || "Sem categoria",
    paymentMethod,
    tags: [],
    merchant: counterparty || item.description || null,
    merchantName: counterparty || item.description || null,
    counterpartyName: counterparty,
    direction: signedAmount >= 0 ? "IN" : "OUT",
    confidenceScore: 0.78,
    confidenceLabel: "provável",
    classificationReason: "Transação sincronizada de Open Finance.",
    operationType: paymentMethod,
    needsReview: false,
    explanation: null,
    fileName: null,
    rawPreview: summarizeRaw(item.raw || item.paymentData || item.creditCardMetadata),
    rawAvailable: Boolean(item.raw || item.paymentData || item.creditCardMetadata),
    importBatchId: null
  };
}

function normalizeLegacyTransaction(item) {
  const signedAmount = String(item.type || "").toUpperCase() === "EXPENSE"
    ? -Math.abs(Number(item.amount || 0))
    : Math.abs(Number(item.amount || 0));

  return {
    id: item.id,
    sourceType: "LEGACY",
    source: "TRANSACTION",
    provider: null,
    date: item.transactionDate,
    createdAt: item.createdAt,
    description: item.description,
    normalizedDescription: null,
    amount: signedAmount,
    absoluteAmount: Math.abs(signedAmount),
    currencyCode: "BRL",
    type: signedAmount < 0 ? "DEBIT" : "CREDIT",
    status: null,
    bank: null,
    accountName: item.card?.name || null,
    category: item.category?.name || "Sem categoria",
    paymentMethod: item.paymentMethod || null,
    tags: [],
    merchant: item.description,
    merchantName: item.description,
    counterpartyName: null,
    direction: signedAmount >= 0 ? "IN" : "OUT",
    confidenceScore: 1,
    confidenceLabel: "detectado",
    classificationReason: "Transação do módulo legado.",
    operationType: item.paymentMethod || null,
    needsReview: false,
    explanation: null,
    fileName: null,
    rawPreview: null,
    rawAvailable: false,
    importBatchId: null
  };
}

function sameMonth(date) {
  const value = new Date(date);
  return {
    start: new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)),
    end: new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1))
  };
}

function plusDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

function buildCounterpartyKey(transaction) {
  return transaction.counterpartyName || transaction.merchantName || transaction.merchant || transaction.description || "";
}

function buildRelatedBreakdown(items = [], keySelector) {
  const map = new Map();

  for (const item of items) {
    const key = String(keySelector(item) || "").trim();
    if (!key) continue;
    const current = map.get(key) || { name: key, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Math.abs(Number(item.amount || 0));
    map.set(key, current);
  }

  return Array.from(map.values())
    .sort((left, right) => right.amount - left.amount || right.count - left.count)
    .slice(0, 8);
}

function buildTimelineContext(target, surrounding = [], monthly = []) {
  const previousTransactions = surrounding
    .filter((item) => new Date(item.date) < new Date(target.date))
    .slice(0, 4);
  const nextTransactions = surrounding
    .filter((item) => new Date(item.date) > new Date(target.date))
    .slice(0, 4);
  const monthExpenses = monthly
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const monthIncome = monthly
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    date: target.date,
    previousTransactions,
    nextTransactions,
    monthTransactionCount: monthly.length,
    monthExpenses,
    monthIncome
  };
}

function buildFinancialImpact(target, monthly = []) {
  const monthlyExpenses = monthly
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const monthlyIncome = monthly
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const denominator = target.amount < 0 ? monthlyExpenses : monthlyIncome;

  return {
    signedAmount: target.amount,
    absoluteAmount: target.absoluteAmount,
    direction: target.direction,
    shareOfMonthPercent: denominator > 0 ? (target.absoluteAmount / denominator) * 100 : 0,
    monthIncome: monthlyIncome,
    monthExpenses: monthlyExpenses
  };
}

export class TransactionDetailsService {
  static async getTransactionById(userId, transactionId) {
    if (!isObjectId(transactionId)) {
      throw new HttpError(400, "Identificador inválido.");
    }

    const [ledger, manual, financial, legacy] = await Promise.all([
      prisma.ledgerTransaction.findFirst({
        where: { id: transactionId, userId },
        include: { importBatch: true }
      }),
      prisma.manualTransaction.findFirst({ where: { id: transactionId, userId } }),
      prisma.financialTransaction.findFirst({
        where: { id: transactionId, userId },
        include: { connection: true, bankAccount: true }
      }),
      prisma.transaction.findFirst({
        where: { id: transactionId, userId },
        include: { card: true, category: true }
      })
    ]);

    let sourceType = "";
    let target = null;

    if (ledger) {
      sourceType = "LEDGER";
      target = normalizeLedgerTransaction(ledger);
    } else if (manual) {
      sourceType = "MANUAL";
      target = normalizeManualTransaction(manual);
    } else if (financial) {
      sourceType = "FINANCIAL";
      target = normalizeFinancialTransaction(financial);
    } else if (legacy) {
      sourceType = "LEGACY";
      target = normalizeLegacyTransaction(legacy);
    }

    if (!target) {
      throw new HttpError(404, "Transação não encontrada.");
    }

    const counterpartyKey = buildCounterpartyKey(target);
    const { start: monthStart, end: monthEnd } = sameMonth(target.date);
    const surroundingStart = plusDays(target.date, -7);
    const surroundingEnd = plusDays(target.date, 8);

    let sourceTransactions = [];

    if (sourceType === "LEDGER") {
      const rows = await prisma.ledgerTransaction.findMany({
        where: {
          userId,
          status: { not: "DISCARDED" },
          date: { gte: plusDays(target.date, -365), lte: plusDays(target.date, 30) }
        },
        include: { importBatch: true },
        orderBy: { date: "desc" }
      });
      sourceTransactions = rows.map(normalizeLedgerTransaction);
    } else if (sourceType === "MANUAL") {
      const rows = await prisma.manualTransaction.findMany({
        where: {
          userId,
          date: { gte: plusDays(target.date, -365), lte: plusDays(target.date, 30) }
        },
        orderBy: { date: "desc" }
      });
      sourceTransactions = rows.map(normalizeManualTransaction);
    } else if (sourceType === "FINANCIAL") {
      const rows = await prisma.financialTransaction.findMany({
        where: {
          userId,
          date: { gte: plusDays(target.date, -365), lte: plusDays(target.date, 30) }
        },
        include: { connection: true, bankAccount: true },
        orderBy: { date: "desc" }
      });
      sourceTransactions = rows.map(normalizeFinancialTransaction);
    } else {
      const rows = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: { gte: plusDays(target.date, -365), lte: plusDays(target.date, 30) }
        },
        include: { card: true, category: true },
        orderBy: { transactionDate: "desc" }
      });
      sourceTransactions = rows.map(normalizeLegacyTransaction);
    }

    const recurrenceGroups = RecurrenceDetectionService.detect(sourceTransactions);
    const recurringIndex = RecurrenceDetectionService.buildTransactionIndex(recurrenceGroups);
    const recurrenceGroup = recurringIndex.get(target.id) || null;
    const humanExplanation = TransactionExplanationService.explain(target, { recurringIndex });

    const relatedTransactions = sourceTransactions
      .filter((item) => item.id !== target.id)
      .filter((item) => {
        if (counterpartyKey && buildCounterpartyKey(item).toLowerCase() === counterpartyKey.toLowerCase()) return true;
        if (target.category && item.category === target.category) return true;
        if (target.paymentMethod && item.paymentMethod === target.paymentMethod) return true;
        return false;
      })
      .slice(0, 10);

    const timelineSample = sourceTransactions
      .filter((item) => new Date(item.date) >= surroundingStart && new Date(item.date) <= surroundingEnd)
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    const monthlyTransactions = sourceTransactions.filter((item) => {
      const date = new Date(item.date);
      return date >= monthStart && date < monthEnd;
    });

    const baseResponse = {
      transaction: target,
      humanExplanation,
      relatedTransactions,
      relatedPeople: buildRelatedBreakdown(relatedTransactions, (item) => item.counterpartyName),
      relatedMerchants: buildRelatedBreakdown(relatedTransactions, (item) => item.merchantName || item.merchant),
      timelineContext: buildTimelineContext(target, timelineSample, monthlyTransactions),
      recurrenceContext: {
        detected: Boolean(recurrenceGroup),
        frequency: recurrenceGroup?.frequency || null,
        kind: recurrenceGroup?.kind || null,
        merchant: recurrenceGroup?.merchant || target.merchantName || target.counterpartyName || null,
        transactions: (recurrenceGroup?.transactions || []).slice(0, 12)
      },
      financialImpact: buildFinancialImpact(target, monthlyTransactions),
      confidence: {
        score: Number(target.confidenceScore || 0),
        label: target.confidenceLabel || "precisa revisar",
        needsReview: Boolean(target.needsReview),
        classificationReason: target.classificationReason || null
      }
    };

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "transaction-details",
      userId,
      context: FinancialAIContextBuilder.buildTransactionContext(baseResponse),
      fallback: {
        executiveSummary: humanExplanation,
        narrative: humanExplanation,
        mainFindings: [
          target?.category ? { title: "Categoria associada", description: `A transação foi classificada em ${target.category}.`, severity: "info", confidence: Number(target.confidenceScore || 0.7) } : null,
          recurrenceGroup ? { title: "Padrão recorrente", description: `${recurrenceGroup.merchant || target.description} participa de um padrão ${recurrenceGroup.frequency || "recorrente"}.`, severity: "opportunity", confidence: 0.72 } : null,
          relatedTransactions[0] ? { title: "Contexto relacional", description: `Há ${relatedTransactions.length} transações relacionadas por contraparte, categoria ou método.`, severity: "attention", confidence: 0.68 } : null
        ].filter(Boolean),
        recommendations: [
          recurrenceGroup ? "Compare esta transação com as demais ocorrências do mesmo padrão." : null,
          relatedTransactions.length ? "Revise as transações relacionadas para confirmar contexto e relevância." : null
        ].filter(Boolean),
        suggestedQuestions: [
          "Essa transação faz parte de uma rotina?",
          "Qual foi o impacto dela no mês?",
          "Existem transações semelhantes com a mesma contraparte?"
        ],
        confidence: Number(target.confidenceScore || 0.71)
      }
    });

    return FinancialAIInsightService.applyToTransaction(baseResponse, aiResult);
  }
}
