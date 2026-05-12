import { z } from "zod";

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export const financialSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
  paymentMethod: z.string().trim().max(80).optional(),
  category: z.string().trim().max(120).optional(),
  source: z.string().trim().max(60).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional()
}).transform((query) => ({
  ...query,
  startDate: parseOptionalDate(query.startDate),
  endDate: parseOptionalDate(query.endDate)
}));
