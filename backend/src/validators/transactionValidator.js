import { z } from "zod";

export const transactionSchema = z.object({
  cardId: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().min(2),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  paymentMethod: z.enum(["CREDIT_CARD", "DEBIT_CARD", "PIX", "CASH", "BANK_TRANSFER", "OTHER"]).optional(),
  transactionDate: z.string().datetime({ offset: true }),
  installments: z.number().int().positive().optional(),
  currentInstallment: z.number().int().positive().optional(),
  notes: z.string().optional()
});
