import {
  ledgerCsvConfirmSchema,
  ledgerCsvPreviewSchema,
  ledgerImportListQuerySchema,
  ledgerReconciliationResolveSchema,
  ledgerReconciliationReviewQuerySchema,
  ledgerTransactionPatchSchema,
  ledgerTransactionListQuerySchema,
  objectIdParamSchema
} from "../validators/ledgerImportValidator.js";
import { financialSearchQuerySchema } from "../validators/financialSearchValidator.js";
import { LedgerImportService } from "../services/LedgerImportService.js";
import { ReconciliationService } from "../services/ReconciliationService.js";
import { FinancialSearchService } from "../services/FinancialSearchService.js";

export class LedgerImportController {
  static async preview(req, res, next) {
    try {
      const payload = ledgerCsvPreviewSchema.parse(req.body);
      const result = await LedgerImportService.preview(req.user.id, payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req, res, next) {
    try {
      const payload = ledgerCsvConfirmSchema.parse(req.body);
      const result = await LedgerImportService.confirm(req.user.id, payload);
      res.status(201).json({
        success: true,
        message: "Importação confirmada com sucesso.",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listImports(req, res, next) {
    try {
      const query = ledgerImportListQuerySchema.parse(req.query);
      const result = await LedgerImportService.listImports(req.user.id, query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async findImportById(req, res, next) {
    try {
      const { id } = objectIdParamSchema.parse(req.params);
      const result = await LedgerImportService.findImportById(req.user.id, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listTransactions(req, res, next) {
    try {
      const query = ledgerTransactionListQuerySchema.parse(req.query);
      const result = await LedgerImportService.listTransactions(req.user.id, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async search(req, res, next) {
    try {
      const query = financialSearchQuerySchema.parse(req.query);
      const result = await FinancialSearchService.search(query.q, query, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async removeImport(req, res, next) {
    try {
      const { id } = objectIdParamSchema.parse(req.params);
      await LedgerImportService.removeImport(req.user.id, id);
      res.json({ success: true, message: "Importação removida com sucesso." });
    } catch (error) {
      next(error);
    }
  }

  static async updateTransaction(req, res, next) {
    try {
      const { id } = objectIdParamSchema.parse(req.params);
      const payload = ledgerTransactionPatchSchema.parse(req.body);
      const result = await ReconciliationService.updateTransaction(req.user.id, id, payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async reviewQueue(req, res, next) {
    try {
      const query = ledgerReconciliationReviewQuerySchema.parse(req.query);
      const result = await ReconciliationService.listReviewQueue(req.user.id, query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resolveReview(req, res, next) {
    try {
      const { id } = objectIdParamSchema.parse(req.params);
      const payload = ledgerReconciliationResolveSchema.parse(req.body);
      const result = await ReconciliationService.resolveReview(req.user.id, id, payload);
      res.json({
        success: true,
        message: payload.action === "DISCARD" ? "Duplicata descartada com sucesso." : "Transação confirmada com sucesso.",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
