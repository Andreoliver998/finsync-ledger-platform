import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { PluggyService } from "./PluggyService.js";

function getResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function toJson(value) {
  if (value === undefined || value === null) {
    return value === null ? null : undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeAccount(account) {
  const balance =
    toNumber(account?.balance) ??
    toNumber(account?.balance?.amount) ??
    toNumber(account?.currentBalance) ??
    toNumber(account?.availableBalance);

  return {
    pluggyAccountId: account.id,
    type: account.type || null,
    subtype: account.subtype || null,
    name: account.name || account.officialName || null,
    marketingName: account.marketingName || account.name || null,
    owner: account.owner || account.ownerName || null,
    number: account.number || account.accountNumber || null,
    balance,
    currencyCode: account.currencyCode || account.currency || "BRL",
    raw: toJson(account)
  };
}

function normalizeTransaction(transaction, bankAccountId) {
  const amount = toNumber(transaction.amount) ?? 0;
  const category =
    transaction.category ||
    transaction.categoryDescription ||
    transaction.merchant?.category ||
    transaction.paymentData?.payer?.name ||
    null;

  return {
    bankAccountId,
    pluggyTransactionId: transaction.id,
    description: transaction.description || transaction.descriptionRaw || transaction.merchant?.name || null,
    amount,
    currencyCode: transaction.currencyCode || transaction.currency || "BRL",
    date: toDate(transaction.date || transaction.postedDate || transaction.paymentDate),
    balance: toNumber(transaction.balance),
    category,
    status: transaction.status || null,
    type: transaction.type || (amount < 0 ? "DEBIT" : "CREDIT"),
    paymentData: toJson(transaction.paymentData ?? null),
    creditCardMetadata: toJson(transaction.creditCardMetadata ?? null),
    raw: toJson(transaction)
  };
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function dashboardMonthRange(query = {}) {
  if (query.startDate || query.endDate || query.period === "CUSTOM") {
    return {
      start: query.startDate ? new Date(query.startDate) : null,
      end: query.endDate ? new Date(new Date(query.endDate).getTime() + 24 * 60 * 60 * 1000) : null
    };
  }

  const month = Number(query.month);
  const year = Number(query.year);

  if (Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year)) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1)
    };
  }

  if (Number.isInteger(year)) {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1)
    };
  }

  if (query.period === "CURRENT_MONTH") {
    return currentMonthRange();
  }

  if (query.period === "CURRENT_YEAR") {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1)
    };
  }

  return { start: null, end: null };
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function isDebitTransaction(transaction) {
  return transaction.amount < 0 || transaction.type === "DEBIT" || transaction.type === "EXPENSE";
}

function normalizeManualTransaction(transaction) {
  return {
    id: transaction.id,
    source: "MANUAL",
    type: transaction.type,
    description: transaction.description,
    amount: transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    currencyCode: "BRL",
    date: transaction.date,
    category: transaction.category,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    place: transaction.place,
    bank: transaction.bank,
    card: transaction.card,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
}

function normalizeOpenFinanceTransaction(transaction) {
  return {
    ...transaction,
    source: "OPEN_FINANCE",
    paymentMethod: null
  };
}

function normalizeLedgerTransaction(transaction) {
  return {
    id: transaction.id,
    source: "LEDGER",
    type: transaction.type,
    description: transaction.description,
    amount: transaction.type === "DEBIT" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    currencyCode: transaction.currencyCode || "BRL",
    date: transaction.date,
    category: transaction.userCategory || transaction.category,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    bank: transaction.bank,
    accountName: transaction.accountName,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
}

async function fetchAllTransactions(accountId) {
  const firstPage = await PluggyService.fetchTransactions(accountId, { page: 1, pageSize: 500 });
  const results = getResults(firstPage);
  const total = firstPage?.total;

  if (!total || results.length >= total) {
    return results;
  }

  let page = 2;
  const transactions = [...results];

  while (transactions.length < total) {
    const response = await PluggyService.fetchTransactions(accountId, { page, pageSize: 500 });
    const pageResults = getResults(response);

    if (pageResults.length === 0) {
      break;
    }

    transactions.push(...pageResults);
    page += 1;
  }

  return transactions;
}

export class FinancialSyncService {
  static async syncConnection({ userId, connectionId }) {
    const startedAt = new Date();
    let syncLog = null;

    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId }
    });

    if (!connection) {
      throw new HttpError(404, "Conexão bancária não encontrada.");
    }

    try {
      syncLog = await prisma.syncLog.create({
        data: {
          userId,
          connectionId,
          status: "RUNNING",
          startedAt
        }
      });

      const accountsPayload = await PluggyService.fetchAccounts(connection.itemId);
      const accounts = getResults(accountsPayload).filter((account) => account?.id);
      let transactionsCount = 0;

      for (const account of accounts) {
        const normalizedAccount = normalizeAccount(account);
        const existingAccount = await prisma.bankAccount.findUnique({
          where: { pluggyAccountId: normalizedAccount.pluggyAccountId },
          select: { userId: true }
        });

        if (existingAccount && existingAccount.userId !== userId) {
          throw new HttpError(403, "Conta bancária não pertence ao usuário autenticado.");
        }

        const savedAccount = await prisma.bankAccount.upsert({
          where: { pluggyAccountId: normalizedAccount.pluggyAccountId },
          create: {
            userId,
            connectionId,
            ...normalizedAccount
          },
          update: {
            type: normalizedAccount.type,
            subtype: normalizedAccount.subtype,
            name: normalizedAccount.name,
            marketingName: normalizedAccount.marketingName,
            owner: normalizedAccount.owner,
            number: normalizedAccount.number,
            balance: normalizedAccount.balance,
            currencyCode: normalizedAccount.currencyCode,
            raw: normalizedAccount.raw
          }
        });

        const transactions = await fetchAllTransactions(account.id);

        for (const transaction of transactions.filter((item) => item?.id)) {
          const normalizedTransaction = normalizeTransaction(transaction, savedAccount.id);
          const existingTransaction = await prisma.financialTransaction.findUnique({
            where: { pluggyTransactionId: normalizedTransaction.pluggyTransactionId },
            select: { userId: true }
          });

          if (existingTransaction && existingTransaction.userId !== userId) {
            throw new HttpError(403, "Transação bancária não pertence ao usuário autenticado.");
          }

          await prisma.financialTransaction.upsert({
            where: { pluggyTransactionId: normalizedTransaction.pluggyTransactionId },
            create: {
              userId,
              connectionId,
              ...normalizedTransaction
            },
            update: {
              bankAccountId: savedAccount.id,
              description: normalizedTransaction.description,
              amount: normalizedTransaction.amount,
              currencyCode: normalizedTransaction.currencyCode,
              date: normalizedTransaction.date,
              balance: normalizedTransaction.balance,
              category: normalizedTransaction.category,
              status: normalizedTransaction.status,
              type: normalizedTransaction.type,
              paymentData: normalizedTransaction.paymentData,
              creditCardMetadata: normalizedTransaction.creditCardMetadata,
              raw: normalizedTransaction.raw
            }
          });

          transactionsCount += 1;
        }
      }

      const finishedAt = new Date();

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "SUCCESS",
          accountsCount: accounts.length,
          transactionsCount,
          finishedAt
        }
      });

      return {
        accountsCount: accounts.length,
        transactionsCount,
        connectionId,
        syncedAt: finishedAt
      };
    } catch (error) {
      const safeMessage =
        error instanceof HttpError
          ? error.message
          : "Não foi possível sincronizar os dados Open Finance.";

      if (syncLog) {
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: "ERROR",
            message: safeMessage,
            finishedAt: new Date()
          }
        });
      }

      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, safeMessage);
    }
  }

  static listAccounts(userId) {
    return prisma.bankAccount.findMany({
      where: { userId },
      select: {
        id: true,
        connectionId: true,
        pluggyAccountId: true,
        type: true,
        subtype: true,
        name: true,
        marketingName: true,
        owner: true,
        number: true,
        balance: true,
        currencyCode: true,
        createdAt: true,
        updatedAt: true,
        connection: {
          select: { id: true, institution: true, provider: true, status: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  static listTransactions(userId, query = {}) {
    const take = Math.min(Number(query.limit || 100), 500);

    return prisma.financialTransaction.findMany({
      where: { userId },
      select: {
        id: true,
        connectionId: true,
        bankAccountId: true,
        pluggyTransactionId: true,
        description: true,
        amount: true,
        currencyCode: true,
        date: true,
        balance: true,
        category: true,
        status: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        bankAccount: {
          select: { id: true, name: true, marketingName: true, type: true }
        },
        connection: {
          select: { id: true, institution: true, provider: true }
        }
      },
      orderBy: { date: "desc" },
      take
    });
  }

  static async dashboardSummary(userId, query = {}) {
    const { start, end } = dashboardMonthRange(query);
    const source = query.source || "ALL";
    const includeManual = source === "ALL" || source === "MANUAL";
    const includeOpenFinance = source === "ALL" || source === "OPEN_FINANCE";
    const includeLedger = source === "ALL" || source === "LEDGER" || source === "CSV_IMPORT" || source === "ONEDRIVE_CSV";
    const categoryFilter = query.category || null;
    const bankFilter = query.bank || null;
    const paymentMethodFilter = query.paymentMethod || null;

    const openFinanceWhere = { userId };
    const manualWhere = { userId };
    const ledgerWhere = {
      userId,
      status: { not: "DISCARDED" }
    };

    if (categoryFilter) {
      openFinanceWhere.category = categoryFilter;
      manualWhere.category = categoryFilter;
      ledgerWhere.OR = [
        { category: categoryFilter },
        { userCategory: categoryFilter }
      ];
    }

    if (paymentMethodFilter) {
      manualWhere.paymentMethod = paymentMethodFilter;
      ledgerWhere.paymentMethod = paymentMethodFilter;
    }

    if (bankFilter) {
      manualWhere.bank = bankFilter;
      ledgerWhere.bank = bankFilter;
    }

    if (source === "CSV_IMPORT" || source === "ONEDRIVE_CSV") {
      ledgerWhere.source = source;
    }

    const [accounts, openFinanceTransactions, manualTransactions, ledgerTransactions, importBatches] = await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      includeOpenFinance && !paymentMethodFilter && !bankFilter
        ? prisma.financialTransaction.findMany({
        where: openFinanceWhere,
        select: {
          id: true,
          connectionId: true,
          bankAccountId: true,
          pluggyTransactionId: true,
          description: true,
          amount: true,
          currencyCode: true,
          date: true,
          balance: true,
          category: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          bankAccount: {
            select: { id: true, name: true, marketingName: true }
          },
          connection: {
            select: { id: true, institution: true }
          }
        },
        orderBy: { date: "desc" }
      })
        : [],
      includeManual
        ? prisma.manualTransaction.findMany({
            where: manualWhere,
            orderBy: { date: "desc" }
          })
        : [],
      includeLedger
        ? prisma.ledgerTransaction.findMany({
            where: ledgerWhere,
            orderBy: { date: "desc" }
          })
        : [],
      includeLedger
        ? prisma.importBatch.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
          })
        : []
    ]);

    const openFinanceItems = openFinanceTransactions.map(normalizeOpenFinanceTransaction);
    const manualItems = manualTransactions.map(normalizeManualTransaction);
    const ledgerItems = ledgerTransactions.map(normalizeLedgerTransaction);
    const transactions = [...openFinanceItems, ...manualItems, ...ledgerItems].sort((a, b) => b.date - a.date);
    const periodTransactions = start && end
      ? transactions.filter((transaction) => transaction.date >= start && transaction.date < end)
      : transactions;
    const openFinanceBalance = includeOpenFinance
      ? accounts.reduce((sum, account) => sum + (account.balance || 0), 0)
      : 0;
    const manualBalance = includeManual
      ? manualItems.reduce((sum, transaction) => sum + transaction.amount, 0)
      : 0;
    const ledgerBalance = includeLedger
      ? ledgerItems.reduce((sum, transaction) => sum + transaction.amount, 0)
      : 0;
    const totalBalance = openFinanceBalance + manualBalance + ledgerBalance;
    const monthIncome = periodTransactions
      .filter((transaction) => !isDebitTransaction(transaction))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const monthExpenses = periodTransactions
      .filter(isDebitTransaction)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const paymentMethodsMap = new Map();
    const expensesByCategoryMap = new Map();
    const monthlyFlowMap = new Map();

    for (const transaction of transactions) {
      if (isDebitTransaction(transaction)) {
        const category = transaction.category || "Sem categoria";
        expensesByCategoryMap.set(
          category,
          (expensesByCategoryMap.get(category) || 0) + Math.abs(transaction.amount)
        );
      }

      if (transaction.paymentMethod) {
        paymentMethodsMap.set(
          transaction.paymentMethod,
          (paymentMethodsMap.get(transaction.paymentMethod) || 0) + Math.abs(transaction.amount)
        );
      }

      const key = monthKey(transaction.date);
      const current = monthlyFlowMap.get(key) || { month: key, income: 0, expenses: 0 };

      if (isDebitTransaction(transaction)) {
        current.expenses += Math.abs(transaction.amount);
      } else {
        current.income += Math.abs(transaction.amount);
      }

      monthlyFlowMap.set(key, current);
    }

    const openFinanceMonthExpenses = openFinanceItems
      .filter((transaction) => !start || !end || (transaction.date >= start && transaction.date < end))
      .filter(isDebitTransaction)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const manualMonthExpenses = manualItems
      .filter((transaction) => !start || !end || (transaction.date >= start && transaction.date < end))
      .filter(isDebitTransaction)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const ledgerMonthExpenses = ledgerItems
      .filter((transaction) => !start || !end || (transaction.date >= start && transaction.date < end))
      .filter(isDebitTransaction)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const duplicatesAvoided = importBatches.reduce((sum, batch) => sum + (batch.duplicatedRows || 0), 0);

    return {
      totalBalance,
      monthIncome,
      monthExpenses,
      openFinanceMonthExpenses,
      manualMonthExpenses,
      ledgerMonthExpenses,
      connectedAccounts: accounts.length,
      manualTransactionsCount: manualItems.length,
      importedTransactionsCount: openFinanceItems.length,
      ledgerTransactionsCount: ledgerItems.length,
      processedFilesCount: importBatches.length,
      duplicatesAvoided,
      transactionsCount: transactions.length,
      expensesByCategory: Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({
        category,
        amount
      })),
      paymentMethods: Array.from(paymentMethodsMap.entries()).map(([paymentMethod, amount]) => ({
        paymentMethod,
        amount
      })),
      monthlyFlow: Array.from(monthlyFlowMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
      latestTransactions: transactions.slice(0, 10)
    };
  }
}
