import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

export class CardService {
  static create(userId, data) {
    return prisma.card.create({ data: { ...data, userId } });
  }

  static list(userId) {
    return prisma.card.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }

  static async findById(userId, id) {
    const card = await prisma.card.findFirst({ where: { id, userId } });
    if (!card) throw new HttpError(404, "Cartão não encontrado.");
    return card;
  }

  static async update(userId, id, data) {
    await this.findById(userId, id);
    return prisma.card.update({ where: { id }, data });
  }

  static async remove(userId, id) {
    await this.findById(userId, id);
    return prisma.card.update({ where: { id }, data: { isActive: false } });
  }
}
