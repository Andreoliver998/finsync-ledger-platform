import { prisma } from "../lib/prisma.js";

const cache = new Map();
const CACHE_TTL = 60 * 1000;

export class SummaryService {
  static invalidate(userId, month, year) {
    cache.delete(`${userId}:${year}:${month}`);
  }

  static async monthly(userId, month, year) {
    const key = `${userId}:${year}:${month}`;
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.data;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: start,
          lt: end
        }
      },
      include: {
        category: true,
        card: true
      }
    });

    const income = transactions
      .filter((item) => item.type === "INCOME")
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = transactions
      .filter((item) => item.type === "EXPENSE")
      .reduce((sum, item) => sum + item.amount, 0);

    const byCategory = {};

    for (const item of transactions) {
      const categoryName = item.category?.name || "Sem categoria";
      if (!byCategory[categoryName]) byCategory[categoryName] = 0;

      if (item.type === "EXPENSE") {
        byCategory[categoryName] += item.amount;
      }
    }

    const result = {
      month,
      year,
      income,
      expenses,
      balance: income - expenses,
      transactionsCount: transactions.length,
      byCategory
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL });
    return result;
  }
}
