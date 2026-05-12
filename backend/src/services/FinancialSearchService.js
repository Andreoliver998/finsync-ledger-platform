import { prisma } from "../lib/prisma.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { MerchantExtractionService } from "./MerchantExtractionService.js";
import { RecurrenceDetectionService } from "./RecurrenceDetectionService.js";
import { TransactionExplanationService } from "./TransactionExplanationService.js";
import { FinancialAIContextBuilder } from "./FinancialAIContextBuilder.js";
import { FinancialAINarrativeService } from "./FinancialAINarrativeService.js";
import { FinancialAIInsightService } from "./FinancialAIInsightService.js";

const ENTITY_TYPES = {
  PERSON: "PERSON",
  MERCHANT: "MERCHANT",
  MARKETPLACE: "MARKETPLACE",
  BANK: "BANK",
  PAYMENT_METHOD: "PAYMENT_METHOD",
  CATEGORY: "CATEGORY",
  UNKNOWN: "UNKNOWN"
};

const MARKETPLACE_KEYWORDS = ["AMAZON", "MERCADO LIVRE", "SHOPEE", "IFOOD", "UBER", "AMERICANAS", "MAGALU", "SHEIN"];
const BANK_KEYWORDS = ["ITAU", "BANCO DO BRASIL", "BB", "CAIXA", "NUBANK", "PICPAY", "BRADESCO", "SANTANDER", "INTER", "C6"];
const PAYMENT_METHOD_KEYWORDS = ["PIX", "TED", "DOC", "BOLETO", "CREDITO", "CRÉDITO", "DEBITO", "DÉBITO", "TRANSFERENCIA", "TRANSFERÊNCIA"];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function sanitizeQuery(value) {
  return normalize(value).slice(0, 80);
}

function isDateInRange(value, startDate, endDate) {
  const current = new Date(value);
  if (startDate && current < startDate) {
    return false;
  }
  if (endDate && current >= endDate) {
    return false;
  }
  return true;
}

function makeEndExclusive(endDate) {
  if (!endDate) {
    return null;
  }
  return new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
}

function buildMonthKey(value) {
  return new Date(value).toISOString().slice(0, 7);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch {
    return "";
  }
}

function includesQuery(haystack, query) {
  return normalize(haystack).includes(query);
}

function signedAmountFromFinancial(transaction) {
  const normalizedType = normalize(transaction.type);
  if (normalizedType === "DEBIT" || normalizedType === "EXPENSE") {
    return -Math.abs(Number(transaction.amount || 0));
  }
  return Math.abs(Number(transaction.amount || 0));
}

function normalizeLedgerTransaction(transaction) {
  const enrichment = CategoryClassifierService.classifyFull(transaction);
  return {
    id: transaction.id,
    sourceType: "LEDGER",
    source: transaction.source || "CSV_IMPORT",
    sourcePriority: 3,
    sourceFileName: transaction.importBatch?.fileName || null,
    date: transaction.date,
    amount: transaction.type === "DEBIT" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    absoluteAmount: Math.abs(transaction.amount || 0),
    type: transaction.type,
    direction: enrichment.direction || (transaction.type === "DEBIT" ? "OUT" : "IN"),
    description: transaction.description,
    normalizedDescription: transaction.normalizedDescription,
    merchantName: enrichment.merchantName || null,
    counterpartyName: enrichment.counterpartyName || transaction.counterpartyName || null,
    category: transaction.userCategory || transaction.category || enrichment.category,
    paymentMethod: transaction.paymentMethod || enrichment.paymentMethod,
    bank: transaction.bank || transaction.importBatch?.bank || null,
    accountName: transaction.accountName || transaction.importBatch?.accountName || null,
    tags: Array.from(new Set([...(transaction.tags || []), ...(enrichment.tags || [])])),
    raw: transaction.raw,
    status: transaction.status,
    provider: transaction.provider || transaction.importBatch?.provider || null,
    explanation: TransactionExplanationService.explain({
      ...transaction,
      merchant: enrichment.merchantName,
      merchantName: enrichment.merchantName,
      counterpartyName: enrichment.counterpartyName || transaction.counterpartyName,
      direction: enrichment.direction,
      paymentMethod: transaction.paymentMethod || enrichment.paymentMethod,
      needsReview: enrichment.needsReview,
      explanation: enrichment.explanation
    }),
    entityName: enrichment.counterpartyName || enrichment.merchantName || transaction.counterpartyName || transaction.description
  };
}

function normalizeManualTransaction(transaction) {
  const synthesized = {
    description: transaction.description,
    normalizedDescription: transaction.description,
    type: transaction.type === "EXPENSE" ? "DEBIT" : "CREDIT",
    amount: transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    paymentMethod: transaction.paymentMethod,
    category: transaction.category,
    bank: transaction.bank,
    counterpartyName: transaction.place || null,
    notes: transaction.notes
  };
  const enrichment = CategoryClassifierService.classifyFull(synthesized);

  return {
    id: transaction.id,
    sourceType: "MANUAL",
    source: "MANUAL",
    sourcePriority: 2,
    sourceFileName: null,
    date: transaction.date,
    amount: synthesized.amount,
    absoluteAmount: Math.abs(transaction.amount || 0),
    type: synthesized.type,
    direction: enrichment.direction || (synthesized.amount < 0 ? "OUT" : "IN"),
    description: transaction.description,
    normalizedDescription: transaction.description,
    merchantName: enrichment.merchantName || null,
    counterpartyName: enrichment.counterpartyName || transaction.place || null,
    category: transaction.category || enrichment.category,
    paymentMethod: transaction.paymentMethod || enrichment.paymentMethod,
    bank: transaction.bank || null,
    accountName: null,
    tags: enrichment.tags || [],
    raw: { notes: transaction.notes, place: transaction.place },
    status: transaction.status,
    provider: null,
    explanation: TransactionExplanationService.explain({
      ...synthesized,
      date: transaction.date,
      merchant: enrichment.merchantName,
      merchantName: enrichment.merchantName,
      counterpartyName: enrichment.counterpartyName || transaction.place,
      direction: enrichment.direction,
      needsReview: enrichment.needsReview,
      explanation: enrichment.explanation
    }),
    entityName: enrichment.counterpartyName || enrichment.merchantName || transaction.place || transaction.description
  };
}

function normalizeFinancialTransaction(transaction) {
  const normalized = {
    description: transaction.description || "",
    normalizedDescription: transaction.description || "",
    type: normalize(transaction.type) === "DEBIT" ? "DEBIT" : "CREDIT",
    amount: signedAmountFromFinancial(transaction),
    paymentMethod: transaction.paymentData?.type || transaction.paymentData?.method || null,
    category: transaction.category,
    bank: null,
    counterpartyName: transaction.raw?.merchant?.name || transaction.raw?.counterparty?.name || null,
    raw: transaction.raw
  };
  const enrichment = CategoryClassifierService.classifyFull(normalized);

  return {
    id: transaction.id,
    sourceType: "FINANCIAL",
    source: "OPEN_FINANCE",
    sourcePriority: 1,
    sourceFileName: null,
    date: transaction.date,
    amount: normalized.amount,
    absoluteAmount: Math.abs(transaction.amount || 0),
    type: normalized.type,
    direction: enrichment.direction || (normalized.amount < 0 ? "OUT" : "IN"),
    description: transaction.description,
    normalizedDescription: transaction.description,
    merchantName: enrichment.merchantName || null,
    counterpartyName: enrichment.counterpartyName || normalized.counterpartyName,
    category: transaction.category || enrichment.category,
    paymentMethod: normalized.paymentMethod || enrichment.paymentMethod,
    bank: null,
    accountName: null,
    tags: enrichment.tags || [],
    raw: transaction.raw,
    status: transaction.status,
    provider: "OPEN_FINANCE",
    explanation: TransactionExplanationService.explain({
      ...normalized,
      date: transaction.date,
      merchant: enrichment.merchantName,
      merchantName: enrichment.merchantName,
      counterpartyName: enrichment.counterpartyName || normalized.counterpartyName,
      direction: enrichment.direction,
      needsReview: enrichment.needsReview,
      explanation: enrichment.explanation
    }),
    entityName: enrichment.counterpartyName || enrichment.merchantName || normalized.counterpartyName || transaction.description
  };
}

function buildSearchHaystack(transaction) {
  return [
    transaction.description,
    transaction.normalizedDescription,
    transaction.merchantName,
    transaction.counterpartyName,
    transaction.category,
    transaction.paymentMethod,
    transaction.bank,
    transaction.sourceFileName,
    Array.isArray(transaction.tags) ? transaction.tags.join(" ") : "",
    safeJsonStringify(transaction.raw)
  ]
    .filter(Boolean)
    .join(" ");
}

function transactionMatchesFilters(transaction, filters = {}) {
  if (filters.type && transaction.type !== filters.type) {
    return false;
  }
  if (filters.paymentMethod && normalize(transaction.paymentMethod) !== normalize(filters.paymentMethod)) {
    return false;
  }
  if (filters.category && !includesQuery(transaction.category, normalize(filters.category))) {
    return false;
  }
  if (filters.source && normalize(transaction.source) !== normalize(filters.source)) {
    return false;
  }
  if (filters.minAmount !== undefined && transaction.absoluteAmount < Number(filters.minAmount)) {
    return false;
  }
  if (filters.maxAmount !== undefined && transaction.absoluteAmount > Number(filters.maxAmount)) {
    return false;
  }
  if (!isDateInRange(transaction.date, filters.startDate, filters.endDateExclusive)) {
    return false;
  }
  return true;
}

function determineMatchField(transaction, query) {
  const candidates = [
    ["description", transaction.description],
    ["normalizedDescription", transaction.normalizedDescription],
    ["merchantName", transaction.merchantName],
    ["counterpartyName", transaction.counterpartyName],
    ["category", transaction.category],
    ["paymentMethod", transaction.paymentMethod],
    ["bank", transaction.bank],
    ["sourceFileName", transaction.sourceFileName],
    ["tags", Array.isArray(transaction.tags) ? transaction.tags.join(" ") : ""],
    ["raw", safeJsonStringify(transaction.raw)]
  ];

  return candidates.find(([, value]) => includesQuery(value, query))?.[0] || "description";
}

function monthName(monthKey) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`));
}

export class FinancialSearchService {
  static async search(query, filters = {}, userId) {
    const sanitizedQuery = sanitizeQuery(query);
    const effectiveFilters = {
      ...filters,
      endDateExclusive: makeEndExclusive(filters.endDate)
    };

    const [ledgerRows, manualRows, financialRows] = await Promise.all([
      prisma.ledgerTransaction.findMany({
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
        take: 5000
      }),
      prisma.manualTransaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 3000
      }),
      prisma.financialTransaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 3000
      })
    ]);

    const normalized = [
      ...ledgerRows.map(normalizeLedgerTransaction),
      ...manualRows.map(normalizeManualTransaction),
      ...financialRows.map(normalizeFinancialTransaction)
    ]
      .filter((transaction) => transactionMatchesFilters(transaction, effectiveFilters))
      .map((transaction) => ({
        ...transaction,
        searchHaystack: buildSearchHaystack(transaction)
      }))
      .filter((transaction) => includesQuery(transaction.searchHaystack, sanitizedQuery))
      .map((transaction) => ({
        ...transaction,
        matchedField: determineMatchField(transaction, sanitizedQuery)
      }))
      .sort((left, right) => {
        if (left.sourcePriority !== right.sourcePriority) {
          return right.sourcePriority - left.sourcePriority;
        }
        return new Date(right.date) - new Date(left.date);
      });

    const entityType = this.classifyEntity(normalized, sanitizedQuery);
    const summary = this.buildEntitySummary(normalized);
    const timeline = this.buildTimeline(normalized);
    const paymentBreakdown = this.buildPaymentBreakdown(normalized);
    const relationship = this.buildRelationshipSummary(normalized);
    const recurring = RecurrenceDetectionService.detect(
      normalized.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        signedAmount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        category: transaction.category,
        merchant: transaction.merchantName || transaction.counterpartyName || transaction.entityName,
        merchantName: transaction.merchantName,
        counterpartyName: transaction.counterpartyName,
        confidenceLabel: "detectado"
      }))
    );

    const largestTransaction = normalized.slice().sort((a, b) => b.absoluteAmount - a.absoluteAmount)[0] || null;
    const averageTicket = summary.totalTransactions ? summary.totalSpent / Math.max(summary.totalPurchases, 1) : 0;

    const response = {
      query,
      entityType,
      entity: {
        normalizedQuery: sanitizedQuery,
        label: query.trim(),
        sourcePriority: normalized[0]?.sourceType || null
      },
      summary: {
        ...summary,
        averageTicket,
        largestTransaction: largestTransaction ? {
          id: largestTransaction.id,
          sourceType: largestTransaction.sourceType,
          date: largestTransaction.date,
          amount: largestTransaction.absoluteAmount,
          direction: largestTransaction.direction,
          description: largestTransaction.description,
          paymentMethod: largestTransaction.paymentMethod,
          category: largestTransaction.category
        } : null
      },
      breakdown: {
        byPaymentMethod: paymentBreakdown.byPaymentMethod,
        byMonth: timeline.byMonth,
        byCategory: paymentBreakdown.byCategory,
        byDirection: paymentBreakdown.byDirection
      },
      timeline,
      relationship,
      recurring: recurring.slice(0, 10),
      transactions: normalized.slice(0, 200).map((transaction) => ({
        id: transaction.id,
        sourceType: transaction.sourceType,
        source: transaction.source,
        sourceFileName: transaction.sourceFileName,
        date: transaction.date,
        amount: transaction.amount,
        absoluteAmount: transaction.absoluteAmount,
        type: transaction.type,
        direction: transaction.direction,
        description: transaction.description,
        normalizedDescription: transaction.normalizedDescription,
        merchantName: transaction.merchantName,
        counterpartyName: transaction.counterpartyName,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        bank: transaction.bank,
        tags: transaction.tags,
        explanation: transaction.explanation,
        matchedField: transaction.matchedField,
        rawPreview: transaction.raw && typeof transaction.raw === "object"
          ? Object.fromEntries(Object.entries(transaction.raw).slice(0, 8))
          : transaction.raw
      })),
      humanExplanation: this.buildHumanExplanation(
        { query, entityType },
        { summary, timeline, paymentBreakdown, relationship, recurring }
      ),
      actions: [
        {
          label: "Ver relatório completo dessa pessoa",
          type: "OPEN_SEARCH",
          enabled: entityType === ENTITY_TYPES.PERSON
        },
        {
          label: "Ver todas as compras nesse estabelecimento",
          type: "OPEN_SEARCH",
          enabled: entityType === ENTITY_TYPES.MERCHANT || entityType === ENTITY_TYPES.MARKETPLACE
        },
        {
          label: "Ver recorrências relacionadas",
          type: "OPEN_RELATED_RECURRING",
          enabled: recurring.length > 0
        },
        {
          label: "Exportar resultado",
          type: "EXPORT",
          enabled: normalized.length > 0
        }
      ]
    };

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "financial-search",
      userId,
      context: FinancialAIContextBuilder.buildSearchContext(filters, response),
      fallback: {
        executiveSummary: response.humanExplanation,
        narrative: response.humanExplanation,
        mainFindings: [
          summary.totalTransactions ? { title: "Resultado encontrado", description: `${query.trim()} apareceu em ${summary.totalTransactions} transações.`, severity: "info", confidence: 0.72 } : null,
          recurring[0] ? { title: "Recorrência ligada à busca", description: `${recurring[0].merchant || query.trim()} apresenta padrão recorrente no histórico.`, severity: "opportunity", confidence: 0.67 } : null,
          largestTransaction ? { title: "Maior movimentação", description: `${largestTransaction.description} foi a maior ocorrência vinculada ao termo buscado.`, severity: "attention", confidence: 0.69 } : null
        ].filter(Boolean),
        recommendations: [
          entityType === ENTITY_TYPES.PERSON ? "Abra o dossiê financeiro dessa pessoa para investigar a relação completa." : null,
          entityType === ENTITY_TYPES.MERCHANT || entityType === ENTITY_TYPES.MARKETPLACE ? "Analise a concentração de gastos nesse estabelecimento ao longo do período." : null,
          recurring.length ? "Revise os padrões recorrentes relacionados ao termo buscado." : null
        ].filter(Boolean),
        suggestedQuestions: [
          `Quem mais se relaciona com ${query.trim()}?`,
          `${query.trim()} aparece com maior frequência em qual período?`,
          `O fluxo ligado a ${query.trim()} é mais de entrada ou saída?`
        ],
        confidence: 0.71
      }
    });

    return FinancialAIInsightService.applyToSearch(response, aiResult);
  }

  static classifyEntity(matches = [], normalizedQuery = "") {
    if (PAYMENT_METHOD_KEYWORDS.some((keyword) => normalizedQuery.includes(normalize(keyword)))) {
      return ENTITY_TYPES.PAYMENT_METHOD;
    }
    if (BANK_KEYWORDS.some((keyword) => normalizedQuery.includes(normalize(keyword)))) {
      return ENTITY_TYPES.BANK;
    }
    if (MARKETPLACE_KEYWORDS.some((keyword) => normalizedQuery.includes(normalize(keyword)))) {
      return ENTITY_TYPES.MARKETPLACE;
    }

    const pixMatches = matches.filter((item) => normalize(item.paymentMethod) === "PIX");
    const outPurchases = matches.filter((item) => item.direction === "OUT" && ["DEBIT", "CREDIT"].includes(normalize(item.paymentMethod)));
    const bankMatches = matches.filter((item) => BANK_KEYWORDS.some((keyword) => includesQuery(item.bank, normalize(keyword))));
    const personNameLike = /^[A-ZÀ-ÿ][A-ZÀ-ÿ]+(?:\s+[A-ZÀ-ÿ][A-ZÀ-ÿ]+){0,3}$/i.test(normalizedQuery);
    const categoryMatches = matches.filter((item) => includesQuery(item.category, normalizedQuery));

    if (categoryMatches.length && categoryMatches.length >= Math.ceil(matches.length / 2)) {
      return ENTITY_TYPES.CATEGORY;
    }
    if (bankMatches.length && bankMatches.length >= Math.ceil(matches.length / 2)) {
      return ENTITY_TYPES.BANK;
    }
    if (pixMatches.length && personNameLike) {
      return ENTITY_TYPES.PERSON;
    }
    if (outPurchases.length && outPurchases.length >= Math.ceil(matches.length / 2)) {
      return ENTITY_TYPES.MERCHANT;
    }
    if (pixMatches.length) {
      return ENTITY_TYPES.PERSON;
    }
    return ENTITY_TYPES.UNKNOWN;
  }

  static buildEntitySummary(matches = []) {
    const income = matches.filter((item) => item.amount > 0);
    const expenses = matches.filter((item) => item.amount < 0);
    const pixSent = matches.filter((item) => normalize(item.paymentMethod) === "PIX" && item.direction === "OUT");
    const pixReceived = matches.filter((item) => normalize(item.paymentMethod) === "PIX" && item.direction === "IN");
    const debitPurchases = matches.filter((item) => normalize(item.paymentMethod) === "DEBIT" && item.direction === "OUT");
    const creditPurchases = matches.filter((item) => normalize(item.paymentMethod) === "CREDIT" && item.direction === "OUT");
    const boletoPayments = matches.filter((item) => normalize(item.paymentMethod) === "BOLETO");
    const transfers = matches.filter((item) => ["TED", "DOC", "TRANSFER"].includes(normalize(item.paymentMethod)));

    return {
      totalTransactions: matches.length,
      totalSpent: expenses.reduce((sum, item) => sum + item.absoluteAmount, 0),
      totalReceived: income.reduce((sum, item) => sum + item.absoluteAmount, 0),
      totalSent: matches.filter((item) => item.direction === "OUT").reduce((sum, item) => sum + item.absoluteAmount, 0),
      pixSent: pixSent.reduce((sum, item) => sum + item.absoluteAmount, 0),
      pixReceived: pixReceived.reduce((sum, item) => sum + item.absoluteAmount, 0),
      debitPurchases: debitPurchases.length,
      creditPurchases: creditPurchases.length,
      boletoPayments: boletoPayments.length,
      transfers: transfers.length,
      totalPurchases: expenses.length,
      firstDate: matches.length ? matches[matches.length - 1].date : null,
      lastDate: matches.length ? matches[0].date : null
    };
  }

  static buildTimeline(matches = []) {
    const monthMap = new Map();

    for (const item of matches) {
      const key = buildMonthKey(item.date);
      const current = monthMap.get(key) || {
        month: key,
        label: monthName(key),
        totalMoved: 0,
        totalSent: 0,
        totalReceived: 0,
        count: 0
      };
      current.totalMoved += item.absoluteAmount;
      current.count += 1;
      if (item.amount > 0) {
        current.totalReceived += item.absoluteAmount;
      } else {
        current.totalSent += item.absoluteAmount;
      }
      monthMap.set(key, current);
    }

    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return {
      byMonth,
      peakMonth: byMonth.slice().sort((a, b) => b.totalMoved - a.totalMoved)[0] || null,
      firstDate: matches.length ? matches[matches.length - 1].date : null,
      lastDate: matches.length ? matches[0].date : null
    };
  }

  static buildPaymentBreakdown(matches = []) {
    const paymentMap = new Map();
    const categoryMap = new Map();
    const directionMap = new Map();

    for (const item of matches) {
      const paymentKey = item.paymentMethod || "UNSPECIFIED";
      const currentPayment = paymentMap.get(paymentKey) || { paymentMethod: paymentKey, count: 0, totalAmount: 0 };
      currentPayment.count += 1;
      currentPayment.totalAmount += item.absoluteAmount;
      paymentMap.set(paymentKey, currentPayment);

      const categoryKey = item.category || "Sem categoria";
      const currentCategory = categoryMap.get(categoryKey) || { category: categoryKey, count: 0, amount: 0 };
      currentCategory.count += 1;
      currentCategory.amount += item.absoluteAmount;
      categoryMap.set(categoryKey, currentCategory);

      const directionKey = item.direction === "IN" ? "RECEIVED" : "SENT";
      const currentDirection = directionMap.get(directionKey) || { direction: directionKey, count: 0, amount: 0 };
      currentDirection.count += 1;
      currentDirection.amount += item.absoluteAmount;
      directionMap.set(directionKey, currentDirection);
    }

    return {
      byPaymentMethod: Array.from(paymentMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      byCategory: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 12),
      byDirection: Array.from(directionMap.values()).sort((a, b) => b.amount - a.amount)
    };
  }

  static buildRelationshipSummary(matches = []) {
    const frequentCounterparties = new Map();
    const highestValues = matches.slice().sort((a, b) => b.absoluteAmount - a.absoluteAmount).slice(0, 10);
    const purchaseMonths = new Map();

    for (const item of matches) {
      const counterparty = item.counterpartyName || item.merchantName || item.bank || "Desconhecido";
      const current = frequentCounterparties.get(counterparty) || { name: counterparty, count: 0, amount: 0 };
      current.count += 1;
      current.amount += item.absoluteAmount;
      frequentCounterparties.set(counterparty, current);

      const month = buildMonthKey(item.date);
      const monthCurrent = purchaseMonths.get(month) || { month, label: monthName(month), count: 0, amount: 0 };
      monthCurrent.count += 1;
      monthCurrent.amount += item.absoluteAmount;
      purchaseMonths.set(month, monthCurrent);
    }

    return {
      frequentCounterparties: Array.from(frequentCounterparties.values()).sort((a, b) => b.count - a.count).slice(0, 8),
      highestValues: highestValues.map((item) => ({
        id: item.id,
        date: item.date,
        amount: item.absoluteAmount,
        description: item.description,
        paymentMethod: item.paymentMethod,
        direction: item.direction
      })),
      busiestMonths: Array.from(purchaseMonths.values()).sort((a, b) => b.amount - a.amount).slice(0, 6)
    };
  }

  static buildHumanExplanation(entity = {}, payload = {}) {
    const { summary = {}, timeline = {}, paymentBreakdown = {}, relationship = {}, recurring = [] } = payload;
    const label = entity.query;

    if (!summary.totalTransactions) {
      return `Nenhuma transação foi encontrada para "${label}" dentro dos filtros informados.`;
    }

    if (entity.entityType === ENTITY_TYPES.PERSON) {
      return `A busca por ${label} encontrou ${summary.totalTransactions} transações. Você enviou ${formatCurrency(summary.totalSent)} e recebeu ${formatCurrency(summary.totalReceived)}. ${summary.pixSent ? `Houve ${formatCurrency(summary.pixSent)} em PIX enviados.` : ""} ${summary.pixReceived ? `Também houve ${formatCurrency(summary.pixReceived)} em PIX recebidos.` : ""} ${relationship.highestValues[0] ? `A maior movimentação foi ${formatCurrency(relationship.highestValues[0].amount)} em ${formatDate(relationship.highestValues[0].date)}.` : ""} ${recurring.length ? `Existem ${recurring.length} padrões recorrentes relacionados.` : ""}`.replace(/\s+/g, " ").trim();
    }

    if (entity.entityType === ENTITY_TYPES.MERCHANT || entity.entityType === ENTITY_TYPES.MARKETPLACE) {
      const topMethod = paymentBreakdown.byPaymentMethod?.[0];
      const peakMonth = timeline.peakMonth;
      return `A busca por ${label} encontrou ${summary.totalTransactions} transações de compra, com gasto total de ${formatCurrency(summary.totalSpent)}. ${topMethod ? `O método mais usado foi ${topMethod.paymentMethod}, com ${topMethod.count} ocorrências.` : ""} ${peakMonth ? `${peakMonth.label} foi o mês de maior movimentação, com ${formatCurrency(peakMonth.totalMoved)}.` : ""} ${recurring.length ? `Há ${recurring.length} recorrências associadas a esse estabelecimento.` : ""}`.replace(/\s+/g, " ").trim();
    }

    if (entity.entityType === ENTITY_TYPES.PAYMENT_METHOD) {
      return `A busca por ${label} encontrou ${summary.totalTransactions} transações. Foram ${formatCurrency(summary.pixSent)} enviados e ${formatCurrency(summary.pixReceived)} recebidos em PIX. ${timeline.peakMonth ? `${timeline.peakMonth.label} concentrou o maior volume, com ${formatCurrency(timeline.peakMonth.totalMoved)}.` : ""} ${relationship.frequentCounterparties[0] ? `${relationship.frequentCounterparties[0].name} foi a contraparte mais frequente.` : ""}`.replace(/\s+/g, " ").trim();
    }

    return `A busca por ${label} encontrou ${summary.totalTransactions} transações, com ${formatCurrency(summary.totalSpent)} em saídas e ${formatCurrency(summary.totalReceived)} em entradas. ${timeline.peakMonth ? `${timeline.peakMonth.label} foi o período de maior movimentação.` : ""} ${relationship.highestValues[0] ? `O maior valor individual foi ${formatCurrency(relationship.highestValues[0].amount)}.` : ""}`.replace(/\s+/g, " ").trim();
  }
}
