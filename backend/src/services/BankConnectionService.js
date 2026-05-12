import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

export class BankConnectionService {
  static async createOrUpdateConnection({ userId, provider, itemId, institution, status }) {
    if (!userId || !provider || !itemId) {
      throw new HttpError(400, "userId, provider e itemId são obrigatórios.");
    }

    const existingConnection = await prisma.bankConnection.findUnique({
      where: { itemId }
    });

    if (existingConnection && existingConnection.userId !== userId) {
      throw new HttpError(403, "Conexão bancária não pertence ao usuário autenticado.");
    }

    const data = {
      userId,
      provider,
      itemId,
      institution: institution || null,
      status: status || "PENDING"
    };

    if (existingConnection) {
      return prisma.bankConnection.update({
        where: { itemId },
        data: {
          provider: data.provider,
          institution: data.institution,
          status: data.status
        }
      });
    }

    return prisma.bankConnection.create({ data });
  }

  static listUserConnections(userId) {
    return prisma.bankConnection.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            bankAccounts: true,
            financialTransactions: true,
            syncLogs: true
          }
        },
        syncLogs: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            status: true,
            message: true,
            accountsCount: true,
            transactionsCount: true,
            startedAt: true,
            finishedAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async findUserConnection(userId, itemId) {
    const connection = await prisma.bankConnection.findFirst({
      where: { userId, itemId }
    });

    if (!connection) {
      throw new HttpError(404, "Conexão bancária não encontrada para este usuário.");
    }

    return connection;
  }

  static async markConnectionStatus(itemId, status) {
    if (!itemId || !status) {
      throw new HttpError(400, "itemId e status são obrigatórios.");
    }

    const connection = await prisma.bankConnection.findUnique({
      where: { itemId }
    });

    if (!connection) {
      return null;
    }

    return prisma.bankConnection.update({
      where: { itemId },
      data: { status }
    });
  }
}
