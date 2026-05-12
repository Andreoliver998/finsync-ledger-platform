import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

export class CategoryService {
  static create(userId, data) {
    return prisma.category.create({ data: { ...data, userId } });
  }

  static list(userId) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    });
  }

  static async update(userId, id, data) {
    const category = await prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new HttpError(404, "Categoria não encontrada.");
    return prisma.category.update({ where: { id }, data });
  }

  static async remove(userId, id) {
    const category = await prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new HttpError(404, "Categoria não encontrada.");

    await prisma.transaction.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: null }
    });

    return prisma.category.delete({ where: { id } });
  }
}
