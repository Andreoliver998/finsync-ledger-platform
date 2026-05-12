import { z } from "zod";

export const cardSchema = z.object({
  name: z.string().min(2),
  bank: z.string().optional(),
  brand: z.string().optional(),
  lastFour: z.string().max(4).optional(),
  limit: z.number().nonnegative().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional()
});
