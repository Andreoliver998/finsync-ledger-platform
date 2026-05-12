import { z } from "zod";

export const manualTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  date: z.string().datetime({ offset: true }),
  description: z.string().min(2),
  category: z.string().trim().min(1).optional(),
  paymentMethod: z
    .enum(["CREDIT", "DEBIT", "PIX", "CASH", "BOLETO", "SAVINGS", "TRANSFER", "OTHER"])
    .optional(),
  place: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
  bank: z.string().trim().min(1).optional(),
  card: z.string().trim().min(1).optional(),
  installments: z.number().int().positive().optional(),
  isRecurring: z.boolean().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["PAID", "PENDING", "SCHEDULED"]).optional()
});

export const manualTransactionUpdateSchema = manualTransactionSchema.partial();
