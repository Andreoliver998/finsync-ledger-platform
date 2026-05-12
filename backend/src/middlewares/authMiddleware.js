import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "../utils/httpError.js";
import { prisma } from "../lib/prisma.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Token de autenticação não informado.");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload?.sub || typeof payload.sub !== "string") {
      throw new HttpError(401, "Token inválido.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      throw new HttpError(401, "Usuário não encontrado ou token inválido.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new HttpError(401, "Sessão inválida ou expirada."));
  }
}
