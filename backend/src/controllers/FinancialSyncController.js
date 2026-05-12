import { z } from "zod";
import { FinancialSyncService } from "../services/FinancialSyncService.js";

const objectIdParamSchema = z.object({
  connectionId: z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido.")
});

const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional()
}).passthrough();

const dashboardSummaryQuerySchema = z.object({
  period: z.enum(["ALL", "CURRENT_MONTH", "CURRENT_YEAR", "CUSTOM"]).optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  source: z.enum(["ALL", "MANUAL", "OPEN_FINANCE", "CSV_IMPORT", "ONEDRIVE_CSV", "LEDGER"]).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  bank: z.string().trim().min(1).max(120).optional(),
  paymentMethod: z.string().trim().min(1).max(40).optional()
}).passthrough();

export class FinancialSyncController {
  static async syncConnection(req, res, next) {
    try {
      const { connectionId } = objectIdParamSchema.parse(req.params);
      const result = await FinancialSyncService.syncConnection({
        userId: req.user.id,
        connectionId
      });

      res.json({
        success: true,
        message: "Sincronização concluída com sucesso.",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAccounts(req, res, next) {
    try {
      const accounts = await FinancialSyncService.listAccounts(req.user.id);
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async listTransactions(req, res, next) {
    try {
      const query = listTransactionsQuerySchema.parse(req.query);
      const transactions = await FinancialSyncService.listTransactions(req.user.id, query);
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async dashboardSummary(req, res, next) {
    try {
      const query = dashboardSummaryQuerySchema.parse(req.query);
      const summary = await FinancialSyncService.dashboardSummary(req.user.id, query);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
