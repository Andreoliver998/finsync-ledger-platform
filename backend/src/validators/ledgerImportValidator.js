import { z } from "zod";
import { getSupportedMappingFields } from "../utils/csvColumnDetector.js";

const mappingObject = Object.fromEntries(
  getSupportedMappingFields().map((field) => [field, z.string().trim().min(1).optional()])
);

export const ledgerCsvPreviewSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileId: z.string().trim().min(1).max(255).optional(),
  fileContent: z.string().min(1).max(5_000_000),
  source: z.string().trim().default("CSV_UPLOAD"),
  provider: z.enum(["MANUAL_UPLOAD", "ONEDRIVE"]).default("MANUAL_UPLOAD"),
  bank: z.string().trim().max(120).optional(),
  accountName: z.string().trim().max(120).optional(),
  mapping: z.object(mappingObject).partial().optional()
});

export const ledgerCsvConfirmSchema = ledgerCsvPreviewSchema.extend({
  selectedRowIndexes: z.array(z.number().int().min(0)).optional()
});

export const ledgerImportListQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional()
}).passthrough();

export const ledgerTransactionListQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  bank: z.string().trim().max(120).optional(),
  source: z.string().trim().max(40).optional(),
  category: z.string().trim().max(80).optional(),
  paymentMethod: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().positive().max(500).optional()
}).passthrough();

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido.")
});

const ledgerStatusSchema = z.enum(["CONFIRMED", "REVIEWED", "PENDING", "DISCARDED"]);

export const ledgerTransactionPatchSchema = z.object({
  category: z.string().trim().min(1).max(120).nullable().optional(),
  userCategory: z.string().trim().min(1).max(120).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: ledgerStatusSchema.optional(),
  reviewedAt: z.coerce.date().nullable().optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "Informe ao menos um campo para atualização."
});

export const ledgerReconciliationReviewQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional()
}).passthrough();

export const ledgerReconciliationResolveSchema = z.object({
  action: z.enum(["CONFIRM", "DISCARD"]),
  notes: z.string().trim().max(2000).optional()
});
