import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";

export class AuthService {
  static async register(data) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
      throw new HttpError(409, "Já existe um usuário cadastrado com este e-mail.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    const token = signToken({ sub: user.id });

    return { user, token };
  }

  static async login(data) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordValid) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    const token = signToken({ sub: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };
  }
}
