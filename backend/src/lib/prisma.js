import { PrismaClient } from "@prisma/client";

// Em produção, apenas erros; em dev, warnings + erros. Queries nunca são logadas
// para evitar exposição acidental de dados sensíveis em logs.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"]
});
