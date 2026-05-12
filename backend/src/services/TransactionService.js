import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { SummaryService } from "./SummaryService.js";

export class TransactionService {
  static async create(userId, data) {
    const date = new Date(data.transactionDate);
    const tx = await prisma.transaction.create({
      data: { ...data, userId, transactionDate: date }
    });
    SummaryService.invalidate(userId, date.getMonth() + 1, date.getFullYear());
    return tx;
  }

  static async list(userId, filters = {}) {
    const where = { userId };

    if (filters.type) where.type = filters.type;
    if (filters.cardId) where.cardId = filters.cardId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { card: true, category: true },
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async findById(userId, id) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { card: true, category: true }
    });

    if (!transaction) throw new HttpError(404, "Transação não encontrada.");

    return transaction;
  }

  static async update(userId, id, data) {
    const existing = await this.findById(userId, id);

    const payload = {
      ...data,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined
    };

    const updated = await prisma.transaction.update({ where: { id }, data: payload });

    const affectedDate = payload.transactionDate ?? existing.transactionDate;
    SummaryService.invalidate(userId, affectedDate.getMonth() + 1, affectedDate.getFullYear());

    return updated;
  }

  static async remove(userId, id) {
    const existing = await this.findById(userId, id);
    const d = existing.transactionDate;
    SummaryService.invalidate(userId, d.getMonth() + 1, d.getFullYear());
    return prisma.transaction.delete({ where: { id } });
  }
}
