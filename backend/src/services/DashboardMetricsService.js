import { prisma } from "../lib/prisma.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { LedgerAnalyticsService } from "./LedgerAnalyticsService.js";
import { RecurrenceDetectionService } from "./RecurrenceDetectionService.js";
import { TransactionExplanationService } from "./TransactionExplanationService.js";

function monthRange(year, month) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1)
  };
}

function last6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: d.toISOString().slice(0, 7),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
    };
  });
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function isDebit(t) {
  return t.amount < 0 || t.type === "DEBIT" || t.type === "EXPENSE";
}

function ledgerCategory(item) {
  return item.userCategory || item.category || null;
}

function normalizeLedger(t) {
  return {
    id: t.id,
    source: "LEDGER",
    date: new Date(t.date),
    description: t.description,
    normalizedDescription: t.normalizedDescription,
    amount: t.type === "DEBIT" ? -Math.abs(t.amount) : Math.abs(t.amount),
    type: t.type,
    category: ledgerCategory(t),
    paymentMethod: t.paymentMethod,
    bank: t.bank,
    accountName: t.accountName,
    status: t.status,
    importBatchId: t.importBatchId,
    createdAt: t.createdAt
  };
}

function normalizeManual(t) {
  return {
    id: t.id,
    source: "MANUAL",
    date: new Date(t.date),
    description: t.description,
    amount: t.type === "EXPENSE" ? -Math.abs(t.amount) : Math.abs(t.amount),
    type: t.type === "EXPENSE" ? "DEBIT" : "CREDIT",
    category: t.category,
    paymentMethod: t.paymentMethod,
    bank: t.bank,
    status: t.status,
    createdAt: t.createdAt
  };
}

export class DashboardMetricsService {
  static async getExtendedMetrics(userId, query = {}) {
    const now = new Date();
    const qMonth = Number(query.month) || now.getMonth() + 1;
    const qYear = Number(query.year) || now.getFullYear();
    const { start, end } = monthRange(qYear, qMonth);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonths = last6Months();

    const [manualTransactions, ledgerTransactions, importBatches, oneDriveConn] =
      await Promise.all([
        prisma.manualTransaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
        prisma.ledgerTransaction.findMany({
          where: {
            userId,
            status: { not: "DISCARDED" }
          },
          orderBy: { date: "desc" }
        }),
        prisma.importBatch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.oneDriveConnection.findFirst({ where: { userId } })
      ]);

    const allTx = [
      ...manualTransactions.map(normalizeManual),
      ...ledgerTransactions.map(normalizeLedger)
    ].sort((a, b) => b.date - a.date);

    const periodTx = allTx.filter((t) => t.date >= start && t.date < end);

    // Daily movement — last 30 days
    const cutoff30 = new Date(now);
    cutoff30.setDate(cutoff30.getDate() - 30);
    const dailyMap = new Map();
    for (const t of allTx.filter((t) => t.date >= cutoff30)) {
      const key = dayKey(t.date);
      const cur = dailyMap.get(key) || { date: key, income: 0, expenses: 0, net: 0 };
      if (isDebit(t)) cur.expenses += Math.abs(t.amount);
      else cur.income += Math.abs(t.amount);
      cur.net = cur.income - cur.expenses;
      dailyMap.set(key, cur);
    }
    const dailyMovement = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 6-month trend
    const monthlyTrend = sixMonths.map(({ key, start: ms, end: me }) => {
      const mTx = allTx.filter((t) => t.date >= ms && t.date < me);
      const income = mTx.filter((t) => !isDebit(t)).reduce((s, t) => s + Math.abs(t.amount), 0);
      const expenses = mTx.filter(isDebit).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { month: key, income, expenses, net: income - expenses, count: mTx.length };
    });

    // Transaction type breakdown via tag detection
    const typeMap = new Map();
    for (const t of periodTx) {
      const tags = CategoryClassifierService.detectTags(t.description || "");
      const tag = tags[0] || (isDebit(t) ? "outros_saida" : "outros_entrada");
      typeMap.set(tag, (typeMap.get(tag) || 0) + Math.abs(t.amount));
    }
    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Category breakdown (expenses only)
    const catMap = new Map();
    for (const t of periodTx.filter(isDebit)) {
      const cat = t.category || CategoryClassifierService.classify(t) || "Outros";
      catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(t.amount));
    }
    const topCategories = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Biggest transactions in period
    const periodExpenses = periodTx.filter(isDebit).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const periodIncomes = periodTx.filter((t) => !isDebit(t)).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const biggestExpense = periodExpenses[0]
      ? { description: periodExpenses[0].description, amount: Math.abs(periodExpenses[0].amount), date: periodExpenses[0].date, category: periodExpenses[0].category }
      : null;
    const biggestIncome = periodIncomes[0]
      ? { description: periodIncomes[0].description, amount: Math.abs(periodIncomes[0].amount), date: periodIncomes[0].date, category: periodIncomes[0].category }
      : null;

    // Anomaly detection (> 2.5x average expense, > R$ 200)
    const avgExpense =
      periodExpenses.length
        ? periodExpenses.reduce((s, t) => s + Math.abs(t.amount), 0) / periodExpenses.length
        : 0;
    const anomalies = periodExpenses
      .filter((t) => Math.abs(t.amount) > avgExpense * 2.5 && Math.abs(t.amount) > 200)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        description: t.description,
        amount: Math.abs(t.amount),
        date: t.date,
        category: t.category,
        deviation: avgExpense > 0 ? Math.round((Math.abs(t.amount) / avgExpense - 1) * 100) : 0
      }));

    // KPIs
    const todayBatches = importBatches.filter((b) => new Date(b.createdAt) >= todayStart);
    const totalDuplicatesAvoided = importBatches.reduce((s, b) => s + (b.duplicatedRows || 0), 0);
    const pendingCount = allTx.filter((t) => t.status === "PENDING").length;
    const reconciledCount = ledgerTransactions.filter((t) => t.status === "CONFIRMED").length;
    const lastImport = importBatches[0] || null;

    // Bank breakdown (CSV sources)
    const bankMap = new Map();
    for (const t of ledgerTransactions) {
      if (t.bank) {
        const cur = bankMap.get(t.bank) || { bank: t.bank, count: 0, total: 0 };
        cur.count += 1;
        cur.total += Math.abs(t.amount);
        bankMap.set(t.bank, cur);
      }
    }

    return {
      period: { month: qMonth, year: qYear },
      kpis: {
        totalTransactions: allTx.length,
        periodTransactions: periodTx.length,
        totalImportedFiles: importBatches.length,
        filesImportedToday: todayBatches.length,
        pendingTransactions: pendingCount,
        reconciledTransactions: reconciledCount,
        totalDuplicatesAvoided,
        lastSyncAt: oneDriveConn?.lastSyncAt || null,
        lastImportAt: lastImport?.createdAt || null,
        lastImportFile: lastImport?.fileName || null
      },
      biggestExpense,
      biggestIncome,
      anomalies,
      topCategories,
      typeBreakdown,
      dailyMovement,
      monthlyTrend,
      bankBreakdown: Array.from(bankMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 8),
      recentImports: importBatches.slice(0, 5).map((b) => ({
        id: b.id,
        fileName: b.fileName,
        bank: b.bank,
        status: b.status,
        importedRows: b.importedRows,
        duplicatedRows: b.duplicatedRows,
        totalRows: b.totalRows,
        createdAt: b.createdAt
      }))
    };
  }

  static async getAllTransactions(userId, query = {}) {
    const take = Math.min(Number(query.limit || 200), 5000);
    const skip = Math.max(Number(query.offset || 0), 0);

    const ledgerTransactions = await LedgerAnalyticsService.getLedgerTransactions(userId, query, {
      includeDiscarded: query.status === "DISCARDED"
    });

    const manualTransactions = await prisma.manualTransaction.findMany({
      where: { userId },
      orderBy: { date: "desc" }
    });

    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;
    const endExclusive = endDate ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000) : null;

    const normalizedManual = manualTransactions
      .map((transaction) => ({
        id: transaction.id,
        source: "MANUAL",
        date: transaction.date,
        description: transaction.description,
        amount: transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
        type: transaction.type === "EXPENSE" ? "DEBIT" : "CREDIT",
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        bank: transaction.bank,
        status: transaction.status,
        place: transaction.place,
        fileName: null,
        createdAt: transaction.createdAt
      }))
      .filter((transaction) => {
        if (query.source && query.source !== "MANUAL") {
          return false;
        }
        if (startDate && new Date(transaction.date) < startDate) {
          return false;
        }
        if (endExclusive && new Date(transaction.date) >= endExclusive) {
          return false;
        }
        if (query.month && String(new Date(transaction.date).getMonth() + 1) !== String(query.month)) {
          return false;
        }
        if (query.year && String(new Date(transaction.date).getFullYear()) !== String(query.year)) {
          return false;
        }
        if (query.category && !String(transaction.category || "").toLowerCase().includes(String(query.category).toLowerCase())) {
          return false;
        }
        if (query.paymentMethod && transaction.paymentMethod !== query.paymentMethod) {
          return false;
        }
        if (query.bank && !String(transaction.bank || "").toLowerCase().includes(String(query.bank).toLowerCase())) {
          return false;
        }
        if (query.status && transaction.status !== query.status) {
          return false;
        }
        if (query.search) {
          const q = String(query.search).toLowerCase();
          const hit = [transaction.description, transaction.category, transaction.bank, transaction.place].some((item) =>
            String(item || "").toLowerCase().includes(q)
          );
          if (!hit) {
            return false;
          }
        }
        if (query.type && transaction.type !== query.type) {
          return false;
        }
        if (query.minAmount !== undefined && Math.abs(transaction.amount) < Number(query.minAmount)) {
          return false;
        }
        if (query.maxAmount !== undefined && Math.abs(transaction.amount) > Number(query.maxAmount)) {
          return false;
        }
        return true;
      });

    const normalizedLedger = ledgerTransactions.map((transaction) => ({
      id: transaction.id,
      source: transaction.source,
      provider: transaction.provider,
      date: transaction.date,
      description: transaction.description,
      normalizedDescription: transaction.normalizedDescription,
      amount: transaction.signedAmount,
      type: transaction.type,
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      bank: transaction.bank,
      accountName: transaction.accountName,
      status: transaction.status,
      balanceAfter: transaction.balanceAfter,
      importBatchId: transaction.importBatchId,
      fileName: transaction.fileName,
      reconciliationStatus: transaction.reconciliationStatus,
      merchant: transaction.merchant,
      merchantName: transaction.merchantName,
      counterpartyName: transaction.counterpartyName,
      direction: transaction.direction,
      confidenceScore: transaction.confidenceScore,
      confidenceLabel: transaction.confidenceLabel,
      classificationReason: transaction.classificationReason,
      explanation: transaction.explanation,
      needsReview: transaction.needsReview,
      createdAt: transaction.createdAt
    }));

    const recurringIndex = RecurrenceDetectionService.buildTransactionIndex(
      RecurrenceDetectionService.detect(ledgerTransactions)
    );
    const explainedLedger = normalizedLedger.map((transaction) => ({
      ...transaction,
      explanation: TransactionExplanationService.explain(transaction, { recurringIndex })
    }));

    const combined = [...normalizedManual, ...explainedLedger].sort((left, right) => new Date(right.date) - new Date(left.date));
    const paged = combined.slice(skip, skip + take);
    const income = combined.filter((item) => item.amount > 0);
    const expenses = combined.filter((item) => item.amount < 0);
    const biggestExpense = expenses.slice().sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0] || null;
    const biggestIncome = income.slice().sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0] || null;

    return {
      transactions: paged,
      total: combined.length,
      hasMore: skip + take < combined.length,
      summary: {
        totalTransactions: combined.length,
        totalAmount: combined.reduce((sum, item) => sum + item.amount, 0),
        income: income.reduce((sum, item) => sum + item.amount, 0),
        expenses: expenses.reduce((sum, item) => sum + Math.abs(item.amount), 0),
        biggestExpense,
        biggestIncome
      }
    };
  }
}
