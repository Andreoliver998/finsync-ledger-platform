import { z } from "zod";

const ledgerAnalyticsPeriodSchema = z.enum(["ALL", "CURRENT_MONTH", "CURRENT_YEAR", "CUSTOM"]).optional();

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export const ledgerAnalyticsQuerySchema = z.object({
  period: ledgerAnalyticsPeriodSchema,
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  source: z.string().trim().max(40).optional(),
  provider: z.string().trim().max(40).optional(),
  category: z.string().trim().max(120).optional(),
  paymentMethod: z.string().trim().max(80).optional(),
  bank: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  importBatchId: z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido.").optional(),
  fileName: z.string().trim().max(255).optional(),
  search: z.string().trim().max(255).optional(),
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional()
}).passthrough().transform((query) => ({
  ...query,
  startDate: parseOptionalDate(query.startDate),
  endDate: parseOptionalDate(query.endDate)
}));
