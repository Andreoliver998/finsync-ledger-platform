import { prisma } from "../lib/prisma.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { MerchantAnalyticsService } from "./MerchantAnalyticsService.js";
import { RecurringTransactionDetector } from "./RecurringTransactionDetector.js";
import { PatternAnalysisService } from "./PatternAnalysisService.js";
import { FinancialInsightService } from "./FinancialInsightService.js";
import { UserFinancialProfileService } from "./UserFinancialProfileService.js";

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function endOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function startOfCurrentYear() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

function endOfCurrentYear() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function transactionSignedAmount(transaction) {
  return transaction.type === "DEBIT" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
}

function transactionCategory(transaction) {
  return transaction.userCategory || transaction.category || "Sem categoria";
}

function transactionOperationalSource(transaction) {
  return transaction.importBatch?.source || transaction.source || "CSV_IMPORT";
}

function transactionProvider(transaction) {
  return transaction.importBatch?.provider || transaction.provider || "MANUAL_UPLOAD";
}

function transactionFileName(transaction) {
  return transaction.importBatch?.fileName || null;
}

function periodRange(query = {}) {
  if (query.startDate || query.endDate || query.period === "CUSTOM") {
    return {
      start: query.startDate || null,
      end: query.endDate ? new Date(query.endDate.getTime() + 24 * 60 * 60 * 1000) : null
    };
  }

  if (query.month && query.year) {
    return {
      start: new Date(Date.UTC(Number(query.year), Number(query.month) - 1, 1)),
      end: new Date(Date.UTC(Number(query.year), Number(query.month), 1))
    };
  }

  if (query.year) {
    return {
      start: new Date(Date.UTC(Number(query.year), 0, 1)),
      end: new Date(Date.UTC(Number(query.year) + 1, 0, 1))
    };
  }

  if (query.period === "CURRENT_MONTH") {
    return { start: startOfCurrentMonth(), end: endOfCurrentMonth() };
  }

  if (query.period === "CURRENT_YEAR") {
    return { start: startOfCurrentYear(), end: endOfCurrentYear() };
  }

  return { start: null, end: null };
}

function matchesString(value, search) {
  return String(value || "").toLowerCase().includes(String(search || "").toLowerCase());
}

function buildConfidenceStats(transactions = []) {
  const stats = {
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    uncategorized: 0,
    needsReview: 0,
    averageConfidence: 0,
    utilizationRate: 0
  };

  if (!transactions.length) {
    return stats;
  }

  let totalConfidence = 0;

  for (const transaction of transactions) {
    totalConfidence += Number(transaction.confidenceScore || 0);

    if ((transaction.confidenceScore || 0) >= 0.85) {
      stats.highConfidence += 1;
    } else if ((transaction.confidenceScore || 0) >= 0.65) {
      stats.mediumConfidence += 1;
    } else {
      stats.lowConfidence += 1;
    }

    if (transaction.category === "Outros") {
      stats.uncategorized += 1;
    }

    if (transaction.needsReview) {
      stats.needsReview += 1;
    }
  }

  stats.averageConfidence = totalConfidence / transactions.length;
  stats.utilizationRate = ((transactions.length - stats.uncategorized) / transactions.length) * 100;
  return stats;
}

function normalizeTransaction(transaction) {
  const enrichment = CategoryClassifierService.classifyFull(transaction);
  const merchant = enrichment.merchantName
    || enrichment.counterpartyName
    || MerchantAnalyticsService.detectMerchant({
      ...transaction,
      counterpartyName: enrichment.counterpartyName || transaction.counterpartyName
    });

  return {
    ...transaction,
    signedAmount: transactionSignedAmount(transaction),
    category: enrichment.category || transactionCategory(transaction),
    source: transactionOperationalSource(transaction),
    provider: transactionProvider(transaction),
    fileName: transactionFileName(transaction),
    merchant,
    direction: enrichment.direction,
    merchantName: enrichment.merchantName || merchant,
    counterpartyName: enrichment.counterpartyName || transaction.counterpartyName || merchant,
    confidenceScore: enrichment.confidenceScore,
    confidenceLabel: enrichment.confidenceLabel,
    classificationReason: enrichment.classificationReason,
    explanation: enrichment.explanation,
    needsReview: enrichment.needsReview,
    operationType: enrichment.operationType
  };
}

function summarizeTransactions(transactions = []) {
  const expenses = transactions.filter((item) => item.signedAmount < 0);
  const income = transactions.filter((item) => item.signedAmount > 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount), 0);
  const totalIncome = income.reduce((sum, item) => sum + Math.abs(item.signedAmount), 0);
  const biggestExpense = expenses.slice().sort((left, right) => Math.abs(right.signedAmount) - Math.abs(left.signedAmount))[0] || null;
  const biggestIncome = income.slice().sort((left, right) => Math.abs(right.signedAmount) - Math.abs(left.signedAmount))[0] || null;

  return {
    count: transactions.length,
    totalExpenses,
    totalIncome,
    netAmount: totalIncome - totalExpenses,
    biggestExpense: biggestExpense
      ? { ...biggestExpense, formattedAmount: formatCurrency(Math.abs(biggestExpense.signedAmount)) }
      : null,
    biggestIncome: biggestIncome
      ? { ...biggestIncome, formattedAmount: formatCurrency(Math.abs(biggestIncome.signedAmount)) }
      : null
  };
}

function buildRanking(items = [], labelKey) {
  const total = items.reduce((sum, item) => sum + Number(item.amount || item.expenses || item.totalAmount || 0), 0);
  return items.map((item) => {
    const amount = Number(item.amount || item.expenses || item.totalAmount || 0);
    return {
      ...item,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      [labelKey]: item[labelKey]
    };
  });
}

function detectProbableCardUsage(transactions = []) {
  const creditKeywords = /(CREDITO|CR[ÉE]DITO|FATURA|PARCELA|PARCELADO|VISA|MASTERCARD|ELO)/i;
  const debitKeywords = /(DEBITO|D[ÉE]BITO|DEB)/i;
  const billKeywords = /(FATURA CARTAO|PAGTO FATURA|PAGAMENTO FATURA|FATURA)/i;
  const installmentKeywords = /(\d{1,2}\/\d{1,2}|PARCELA|PARCELADO)/i;

  const purchases = [];
  const billPayments = [];
  const installments = [];
  let creditAmount = 0;
  let debitAmount = 0;

  for (const transaction of transactions.filter((item) => item.signedAmount < 0)) {
    const description = `${transaction.description || ""} ${transaction.normalizedDescription || ""}`;
    const paymentMethod = String(transaction.paymentMethod || "");
    const probableCredit = paymentMethod === "CREDIT" || creditKeywords.test(description);
    const probableDebit = paymentMethod === "DEBIT" || debitKeywords.test(description) || paymentMethod === "PIX";
    const probableBillPayment = billKeywords.test(description) || transaction.category === "Fatura / cartão";
    const probableInstallment = installmentKeywords.test(description);

    if (probableBillPayment) {
      billPayments.push(transaction);
    }

    if (probableInstallment) {
      installments.push(transaction);
    }

    if (probableCredit || probableDebit) {
      purchases.push({
        ...transaction,
        probableMethod: probableCredit ? "CREDIT" : "DEBIT"
      });
    }

    if (probableCredit) {
      creditAmount += Math.abs(transaction.signedAmount);
    } else if (probableDebit) {
      debitAmount += Math.abs(transaction.signedAmount);
    }
  }

  return {
    summary: {
      creditAmount,
      debitAmount,
      creditCount: purchases.filter((item) => item.probableMethod === "CREDIT").length,
      debitCount: purchases.filter((item) => item.probableMethod === "DEBIT").length,
      billPaymentCount: billPayments.length,
      installmentCount: installments.length
    },
    probableCreditPurchases: purchases.filter((item) => item.probableMethod === "CREDIT").slice(0, 100),
    probableDebitPurchases: purchases.filter((item) => item.probableMethod === "DEBIT").slice(0, 100),
    probableBillPayments: billPayments.slice(0, 100),
    probableInstallments: installments.slice(0, 100)
  };
}

function buildImportQuality(importBatches = [], ledgerTransactions = []) {
  const byBatchId = new Map();

  for (const transaction of ledgerTransactions) {
    const key = transaction.importBatchId || "NO_BATCH";
    const current = byBatchId.get(key) || {
      confirmed: 0,
      reviewed: 0,
      discarded: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      uncategorized: 0
    };

    if (transaction.status === "DISCARDED") {
      current.discarded += 1;
    } else if (transaction.status === "REVIEWED" || transaction.reconciliationStatus === "POSSIBLE_DUPLICATE") {
      current.reviewed += 1;
    } else {
      current.confirmed += 1;
    }

    if ((transaction.confidenceScore || 0) >= 0.85) {
      current.highConfidence += 1;
    } else if ((transaction.confidenceScore || 0) >= 0.65) {
      current.mediumConfidence += 1;
    } else {
      current.lowConfidence += 1;
    }

    if (transaction.category === "Outros") {
      current.uncategorized += 1;
    }

    byBatchId.set(key, current);
  }

  const files = importBatches.map((batch) => {
    const status = byBatchId.get(batch.id) || {
      confirmed: 0,
      reviewed: 0,
      discarded: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      uncategorized: 0
    };
    const linesRead = batch.totalRows || 0;
    const imported = batch.importedRows || 0;
    const duplicates = batch.duplicatedRows || 0;
    const errors = batch.errorRows || 0;
    const discarded = status.discarded;
    const review = status.reviewed;
    const confirmed = status.confirmed;
    const utilizationRate = linesRead > 0 ? ((imported - discarded) / linesRead) * 100 : 0;

    return {
      id: batch.id,
      fileName: batch.fileName,
      source: batch.source,
      provider: batch.provider,
      linesRead,
      importedRows: imported,
      duplicatedRows: duplicates,
      errorRows: errors,
      reviewedRows: review,
      confirmedRows: confirmed,
      discardedRows: discarded,
      highConfidence: status.highConfidence,
      mediumConfidence: status.mediumConfidence,
      lowConfidence: status.lowConfidence,
      uncategorized: status.uncategorized,
      utilizationRate,
      createdAt: batch.createdAt
    };
  });

  const totals = files.reduce((acc, item) => {
    acc.linesRead += item.linesRead;
    acc.importedRows += item.importedRows;
    acc.duplicatedRows += item.duplicatedRows;
    acc.errorRows += item.errorRows;
    acc.reviewedRows += item.reviewedRows;
    acc.confirmedRows += item.confirmedRows;
    acc.discardedRows += item.discardedRows;
    acc.highConfidence += item.highConfidence;
    acc.mediumConfidence += item.mediumConfidence;
    acc.lowConfidence += item.lowConfidence;
    acc.uncategorized += item.uncategorized;
    return acc;
  }, {
    linesRead: 0,
    importedRows: 0,
    duplicatedRows: 0,
    errorRows: 0,
    reviewedRows: 0,
    confirmedRows: 0,
    discardedRows: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    uncategorized: 0
  });

  return {
    totals: {
      ...totals,
      utilizationRate: totals.linesRead > 0 ? ((totals.importedRows - totals.discardedRows) / totals.linesRead) * 100 : 0
    },
    files: files.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  };
}

function buildExecutiveNarrative({
  profileContext,
  period,
  summary,
  categories,
  merchants,
  recurring,
  anomalies,
  paymentMethods
}) {
  if (!summary.count) {
    return "Ainda não há transações suficientes para explicar o fluxo financeiro deste período.";
  }

  const fmt = (value) => UserFinancialProfileService.formatCurrency(value, profileContext);
  const start = period.start ? UserFinancialProfileService.formatDate(period.start, profileContext) : "o início do histórico";
  const end = period.end ? UserFinancialProfileService.formatDate(period.end, profileContext) : "o fim do histórico";

  return UserFinancialProfileService.buildMessage(profileContext, {
    direct: [
      `entre ${start} e ${end}, analisei ${summary.count} transações do seu extrato.`,
      `Entraram ${fmt(summary.totalIncome)} e saíram ${fmt(summary.totalExpenses)}, com saldo líquido de ${fmt(summary.netAmount)}.`,
      categories[0] ? `Seu maior gasto ficou em ${categories[0].category}, com ${fmt(categories[0].amount)}.` : null,
      merchants[0] ? `${merchants[0].merchant} foi a contraparte mais frequente, com ${merchants[0].count} movimentações.` : null,
      recurring.length ? `Detectei ${recurring.length} recorrências, com destaque para ${recurring[0].merchant}.` : "Não detectei recorrências fortes neste filtro.",
      anomalies.length ? `Também surgiram ${anomalies.length} gastos fora do padrão para revisar.` : "Não encontrei gastos anômalos relevantes neste recorte.",
      paymentMethods[0] ? `O método de pagamento mais usado foi ${paymentMethods[0].paymentMethod}.` : null
    ].filter(Boolean).join(" "),
    didactic: [
      `Entre ${start} e ${end}, foram analisadas ${summary.count} transações.`,
      `Entraram ${fmt(summary.totalIncome)} e saíram ${fmt(summary.totalExpenses)}, com saldo líquido de ${fmt(summary.netAmount)}.`,
      categories[0] ? `A principal categoria de saída foi ${categories[0].category}, com ${fmt(categories[0].amount)}.` : null,
      merchants[0] ? `O relacionamento mais frequente apareceu com ${merchants[0].merchant}, em ${merchants[0].count} movimentações.` : null,
      recurring.length ? `Foram detectadas ${recurring.length} recorrências, com destaque para ${recurring[0].merchant}.` : "Não houve recorrências fortes suficientes para destacar neste filtro.",
      anomalies.length ? `Também surgiram ${anomalies.length} gastos fora do padrão que merecem revisão.` : "Não foram encontrados gastos anômalos relevantes neste recorte.",
      paymentMethods[0] ? `O método de pagamento mais usado foi ${paymentMethods[0].paymentMethod}.` : null
    ].filter(Boolean).join(" "),
    executive: [
      `${summary.count} transações foram analisadas entre ${start} e ${end}.`,
      `${fmt(summary.totalIncome)} em entradas e ${fmt(summary.totalExpenses)} em saídas, com saldo líquido de ${fmt(summary.netAmount)}.`,
      categories[0] ? `${categories[0].category} liderou as despesas com ${fmt(categories[0].amount)}.` : null,
      anomalies.length ? `${anomalies.length} desvios de padrão exigem atenção.` : null
    ].filter(Boolean).join(" "),
    consultive: [
      `Entre ${start} e ${end}, foram analisadas ${summary.count} transações do extrato.`,
      `Entraram ${fmt(summary.totalIncome)} e saíram ${fmt(summary.totalExpenses)}, com saldo líquido de ${fmt(summary.netAmount)}.`,
      categories[0] ? `A principal categoria de saída foi ${categories[0].category}, com ${fmt(categories[0].amount)}.` : null,
      merchants[0] ? `${merchants[0].merchant} apareceu como contraparte mais frequente, em ${merchants[0].count} movimentações.` : null,
      recurring.length ? `Foram detectadas ${recurring.length} recorrências, com destaque para ${recurring[0].merchant}.` : "Não houve recorrências fortes suficientes para destacar neste filtro.",
      anomalies.length ? `Também surgiram ${anomalies.length} gastos fora do padrão que merecem revisão.` : "Não foram encontrados gastos anômalos relevantes neste recorte.",
      paymentMethods[0] ? `O método de pagamento mais usado foi ${paymentMethods[0].paymentMethod}.` : null
    ].filter(Boolean).join(" "),
    neutral: [
      `Entre ${start} e ${end}, foram analisadas ${summary.count} transações.`,
      `Entraram ${fmt(summary.totalIncome)} e saíram ${fmt(summary.totalExpenses)}, com saldo líquido de ${fmt(summary.netAmount)}.`,
      categories[0] ? `A principal categoria de saída foi ${categories[0].category}, com ${fmt(categories[0].amount)}.` : null,
      merchants[0] ? `O relacionamento mais frequente apareceu com ${merchants[0].merchant}, em ${merchants[0].count} movimentações.` : null,
      recurring.length ? `Foram detectadas ${recurring.length} recorrências, com destaque para ${recurring[0].merchant}.` : "Não houve recorrências fortes suficientes para destacar neste filtro.",
      anomalies.length ? `Também surgiram ${anomalies.length} gastos fora do padrão que merecem revisão.` : "Não foram encontrados gastos anômalos relevantes neste recorte.",
      paymentMethods[0] ? `O método de pagamento mais usado foi ${paymentMethods[0].paymentMethod}.` : null
    ].filter(Boolean).join(" ")
  });
}

export class LedgerAnalyticsService {
  static async getLedgerTransactions(userId, query = {}, options = {}) {
    const includeDiscarded = Boolean(options.includeDiscarded);
    const range = periodRange(query);
    const baseWhere = {
      userId,
      ...(includeDiscarded ? {} : { status: { not: "DISCARDED" } })
    };

    const rows = await prisma.ledgerTransaction.findMany({
      where: baseWhere,
      include: {
        importBatch: {
          select: {
            id: true,
            fileName: true,
            source: true,
            provider: true,
            bank: true,
            accountName: true,
            totalRows: true,
            importedRows: true,
            duplicatedRows: true,
            errorRows: true,
            createdAt: true
          }
        }
      },
      orderBy: { date: "desc" },
      take: Math.min(Number(query.limit || 10000), 10000)
    });

    return rows
      .map(normalizeTransaction)
      .filter((transaction) => {
        if (!includeDiscarded && transaction.status === "DISCARDED") {
          return false;
        }
        if (range.start && new Date(transaction.date) < range.start) {
          return false;
        }
        if (range.end && new Date(transaction.date) >= range.end) {
          return false;
        }
        if (query.source && transaction.source !== query.source) {
          return false;
        }
        if (query.provider && transaction.provider !== query.provider) {
          return false;
        }
        if (query.category && !matchesString(transaction.category, query.category)) {
          return false;
        }
        if (query.paymentMethod && transaction.paymentMethod !== query.paymentMethod) {
          return false;
        }
        if (query.bank && !matchesString(transaction.bank, query.bank)) {
          return false;
        }
        if (query.status && transaction.status !== query.status) {
          return false;
        }
        if (query.importBatchId && transaction.importBatchId !== query.importBatchId) {
          return false;
        }
        if (query.fileName && !matchesString(transaction.fileName, query.fileName)) {
          return false;
        }
        if (query.search) {
          const haystack = [
            transaction.description,
            transaction.normalizedDescription,
            transaction.category,
            transaction.merchant,
            transaction.counterpartyName,
            transaction.explanation,
            transaction.fileName,
            transaction.bank,
            transaction.paymentMethod
          ];
          if (!haystack.some((item) => matchesString(item, query.search))) {
            return false;
          }
        }
        if (query.type && transaction.type !== query.type) {
          return false;
        }
        if (query.minAmount !== undefined && Math.abs(transaction.signedAmount) < Number(query.minAmount)) {
          return false;
        }
        if (query.maxAmount !== undefined && Math.abs(transaction.signedAmount) > Number(query.maxAmount)) {
          return false;
        }
        return true;
      });
  }

  static categoriesFromTransactions(transactions = []) {
    const totals = new Map();
    const expenseTransactions = transactions.filter((item) => item.signedAmount < 0);
    const totalExpenses = expenseTransactions.reduce((sum, item) => sum + Math.abs(item.signedAmount), 0);

    for (const transaction of expenseTransactions) {
      const category = transaction.category || "Sem categoria";
      const current = totals.get(category) || { category, amount: 0, count: 0 };
      current.amount += Math.abs(transaction.signedAmount);
      current.count += 1;
      totals.set(category, current);
    }

    return Array.from(totals.values())
      .map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
      }))
      .sort((left, right) => right.amount - left.amount);
  }

  static paymentMethodsFromTransactions(transactions = []) {
    const totals = new Map();
    for (const transaction of transactions) {
      const key = transaction.paymentMethod || "UNSPECIFIED";
      const current = totals.get(key) || { paymentMethod: key, amount: 0, count: 0 };
      current.amount += Math.abs(transaction.signedAmount);
      current.count += 1;
      totals.set(key, current);
    }
    return Array.from(totals.values()).sort((left, right) => right.count - left.count);
  }

  static topIncomesFromTransactions(transactions = []) {
    return transactions
      .filter((item) => item.signedAmount > 0)
      .slice()
      .sort((left, right) => Math.abs(right.signedAmount) - Math.abs(left.signedAmount))
      .slice(0, 10);
  }

  static async overview(userId, query = {}) {
    const [transactions, importBatches] = await Promise.all([
      this.getLedgerTransactions(userId, query),
      prisma.importBatch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    ]);

    const summary = summarizeTransactions(transactions);
    const categories = this.categoriesFromTransactions(transactions);
    const merchants = MerchantAnalyticsService.rank(transactions);
    const paymentMethods = this.paymentMethodsFromTransactions(transactions);
    const annualTimeline = PatternAnalysisService.annualTimeline(transactions);
    const monthlyTimeline = PatternAnalysisService.monthlyTimeline(transactions);
    const highestExpenseMonth = monthlyTimeline.slice().sort((left, right) => right.expenses - left.expenses)[0] || null;
    const analyzedPeriod = {
      start: transactions.length ? transactions[transactions.length - 1].date : null,
      end: transactions.length ? transactions[0].date : null
    };

    return {
      filters: query,
      analyzedPeriod,
      totalCsvImported: importBatches.length,
      totalImportedTransactions: transactions.length,
      totalExpenses: summary.totalExpenses,
      totalIncome: summary.totalIncome,
      netAmount: summary.netAmount,
      biggestExpense: summary.biggestExpense,
      biggestIncome: summary.biggestIncome,
      topCategories: buildRanking(categories.slice(0, 5), "category"),
      topMerchants: buildRanking(merchants.slice(0, 5), "merchant"),
      mostUsedPaymentMethod: paymentMethods[0] || null,
      annualCounts: annualTimeline.map((item) => ({ year: item.year, count: item.count })),
      highestExpenseMonth: highestExpenseMonth
        ? { ...highestExpenseMonth, formattedExpenses: formatCurrency(highestExpenseMonth.expenses) }
        : null,
      classificationQuality: buildConfidenceStats(transactions)
    };
  }

  static async timeline(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query);
    return {
      annual: PatternAnalysisService.annualTimeline(transactions),
      monthly: PatternAnalysisService.monthlyTimeline(transactions)
    };
  }

  static async categories(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query);
    return this.categoriesFromTransactions(transactions);
  }

  static async merchants(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query);
    return buildRanking(MerchantAnalyticsService.rank(transactions), "merchant");
  }

  static async paymentMethods(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query);
    return this.paymentMethodsFromTransactions(transactions);
  }

  static async executiveSummary(userId, query = {}) {
    const [transactions, profileContext] = await Promise.all([
      this.getLedgerTransactions(userId, query),
      UserFinancialProfileService.getContext(userId)
    ]);
    const summary = summarizeTransactions(transactions);
    const categories = this.categoriesFromTransactions(transactions).slice(0, 5);
    const merchants = buildRanking(MerchantAnalyticsService.rank(transactions).slice(0, 10), "merchant");
    const recurring = RecurringTransactionDetector.detect(transactions);
    const anomalies = PatternAnalysisService.detectAnomalies(transactions);
    const paymentMethods = this.paymentMethodsFromTransactions(transactions).slice(0, 5);
    const quality = buildConfidenceStats(transactions);
    const period = {
      start: transactions.length ? transactions[transactions.length - 1].date : null,
      end: transactions.length ? transactions[0].date : null
    };

    return {
      period,
      transactionsCount: summary.count,
      totalReceived: summary.totalIncome,
      totalSpent: summary.totalExpenses,
      netAmount: summary.netAmount,
      mainCategories: categories,
      biggestExpenses: transactions
        .filter((item) => item.signedAmount < 0)
        .slice()
        .sort((left, right) => Math.abs(right.signedAmount) - Math.abs(left.signedAmount))
        .slice(0, 10),
      mainMerchants: merchants,
      paymentMethods,
      recurring,
      subscriptions: recurring.filter((item) => item.kind === "SUBSCRIPTION").slice(0, 10),
      anomalies,
      quality,
      narrative: buildExecutiveNarrative({
        profileContext,
        period,
        summary,
        categories,
        merchants,
        recurring,
        anomalies,
        paymentMethods
      }),
      attentionPoints: [
        ...(quality.uncategorized ? [`${quality.uncategorized} transações ainda caíram em Outros.`] : []),
        ...(quality.needsReview ? [`${quality.needsReview} transações pedem revisão manual.`] : []),
        ...(anomalies.length ? [`${anomalies.length} gastos destoam da média histórica.`] : [])
      ]
    };
  }

  static async reports(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query, { includeDiscarded: true });
    const activeTransactions = transactions.filter((item) => item.status !== "DISCARDED");
    const categories = this.categoriesFromTransactions(activeTransactions);
    const merchants = buildRanking(MerchantAnalyticsService.rank(activeTransactions), "merchant");
    const paymentMethods = this.paymentMethodsFromTransactions(activeTransactions);
    const monthly = PatternAnalysisService.monthlyTimeline(activeTransactions);
    const annual = PatternAnalysisService.annualTimeline(activeTransactions);
    const recurring = RecurringTransactionDetector.detect(activeTransactions);
    const anomalies = PatternAnalysisService.detectAnomalies(activeTransactions);
    const importFiles = buildImportQuality(
      await prisma.importBatch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      transactions
    ).files;
    const topPurchases = activeTransactions
      .filter((item) => item.signedAmount < 0)
      .slice()
      .sort((left, right) => Math.abs(right.signedAmount) - Math.abs(left.signedAmount))
      .slice(0, 10);
    const topIncome = this.topIncomesFromTransactions(activeTransactions);
    const summary = summarizeTransactions(activeTransactions);
    const executiveSummary = await this.executiveSummary(userId, query);

    return {
      filters: query,
      period: {
        start: activeTransactions.length ? activeTransactions[activeTransactions.length - 1].date : null,
        end: activeTransactions.length ? activeTransactions[0].date : null
      },
      totals: summary,
      transactionsCount: activeTransactions.length,
      general: await this.overview(userId, query),
      executiveSummary,
      monthly,
      annual,
      byCategory: categories,
      byMerchant: merchants,
      byPaymentMethod: paymentMethods,
      byImportFile: importFiles,
      topPurchases,
      topIncome,
      recurring,
      subscriptions: recurring.filter((item) => item.kind === "SUBSCRIPTION"),
      salaries: recurring.filter((item) => item.kind === "SALARY"),
      anomalies,
      moneyOutflow: categories,
      moneyInflow: buildRanking(
        MerchantAnalyticsService.rank(activeTransactions.filter((item) => item.signedAmount > 0)),
        "merchant"
      ),
      classificationQuality: buildConfidenceStats(activeTransactions)
    };
  }

  static async insights(userId, query = {}) {
    const [transactions, overview, executiveSummary, profileContext] = await Promise.all([
      this.getLedgerTransactions(userId, query),
      this.overview(userId, query),
      this.executiveSummary(userId, query),
      UserFinancialProfileService.getContext(userId)
    ]);
    const recurringTransactions = RecurringTransactionDetector.detect(transactions);
    const categoryGrowth = PatternAnalysisService.categoryGrowth(transactions);
    const topMerchants = buildRanking(MerchantAnalyticsService.rank(transactions).slice(0, 10), "merchant");
    const topCategories = this.categoriesFromTransactions(transactions).slice(0, 10);
    const annualTimeline = PatternAnalysisService.annualTimeline(transactions);
    const probableCardUsage = detectProbableCardUsage(transactions);
    const paymentMethods = this.paymentMethodsFromTransactions(transactions);
    const anomalies = PatternAnalysisService.detectAnomalies(transactions);

    return {
      generatedAt: new Date(),
      healthScore: Math.max(0, Math.min(100, Math.round(
        52
        + (overview.netAmount >= 0 ? 12 : -8)
        + Math.min(18, recurringTransactions.length * 2)
        + Math.round((executiveSummary.quality.averageConfidence || 0) * 12)
      ))),
      overview,
      executiveSummary,
      recurringTransactions,
      categoryGrowth,
      topMerchants,
      topCategories,
      profile: profileContext.profile,
      paymentMethods,
      anomalies,
      annualTimeline,
      probableCardUsage,
      insights: FinancialInsightService.build({
        profileContext,
        overview,
        executiveSummary,
        recurringTransactions,
        categoryGrowth,
        topMerchants,
        topCategories,
        annualTimeline,
        probableCardUsage,
        paymentMethods,
        anomalies
      })
    };
  }

  static async cardUsage(userId, query = {}) {
    const transactions = await this.getLedgerTransactions(userId, query);
    return detectProbableCardUsage(transactions);
  }

  static async importQuality(userId) {
    const [importBatches, ledgerTransactions] = await Promise.all([
      prisma.importBatch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.ledgerTransaction.findMany({ where: { userId } })
    ]);

    return buildImportQuality(importBatches, ledgerTransactions.map(normalizeTransaction));
  }
}
