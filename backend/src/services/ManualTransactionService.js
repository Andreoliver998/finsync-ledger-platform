import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

function parseDate(value) {
  return value ? new Date(value) : undefined;
}

function getMonthRange(month, year) {
  if (!month || !year) {
    return null;
  }

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return {
    gte: new Date(yearNumber, monthNumber - 1, 1),
    lt: new Date(yearNumber, monthNumber, 1)
  };
}

function buildWhere(userId, filters = {}) {
  const where = { userId };
  const monthRange = getMonthRange(filters.month, filters.year);

  if (monthRange) {
    where.date = monthRange;
  } else if (filters.year) {
    const yearNumber = Number(filters.year);
    if (Number.isInteger(yearNumber)) {
      where.date = {
        gte: new Date(yearNumber, 0, 1),
        lt: new Date(yearNumber + 1, 0, 1)
      };
    }
  }

  if (filters.category) where.category = filters.category;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  return where;
}

function toCreatePayload(userId, data) {
  return {
    userId,
    type: data.type,
    amount: data.amount,
    date: parseDate(data.date),
    description: data.description,
    category: data.category || null,
    paymentMethod: data.paymentMethod || "OTHER",
    place: data.place || null,
    notes: data.notes || null,
    bank: data.bank || null,
    card: data.card || null,
    installments: data.installments || null,
    isRecurring: Boolean(data.isRecurring),
    dueDate: parseDate(data.dueDate),
    status: data.status || "PAID",
    source: "MANUAL"
  };
}

function toUpdatePayload(data) {
  const payload = { ...data };

  if (data.date) {
    payload.date = parseDate(data.date);
  }

  if (data.dueDate) {
    payload.dueDate = parseDate(data.dueDate);
  }

  return payload;
}

export class ManualTransactionService {
  static create(userId, data) {
    return prisma.manualTransaction.create({
      data: toCreatePayload(userId, data)
    });
  }

  static async list(userId, filters = {}) {
    const where = buildWhere(userId, filters);
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.manualTransaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit
      }),
      prisma.manualTransaction.count({ where })
    ]);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async findById(userId, id) {
    const transaction = await prisma.manualTransaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      throw new HttpError(404, "Lançamento manual não encontrado.");
    }

    return transaction;
  }

  static async update(userId, id, data) {
    await this.findById(userId, id);

    return prisma.manualTransaction.update({
      where: { id },
      data: toUpdatePayload(data)
    });
  }

  static async remove(userId, id) {
    await this.findById(userId, id);

    return prisma.manualTransaction.delete({
      where: { id }
    });
  }
}
