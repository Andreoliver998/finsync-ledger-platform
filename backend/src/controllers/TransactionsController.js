import { objectIdParamSchema } from "../validators/ledgerImportValidator.js";
import { TransactionDetailsService } from "../services/TransactionDetailsService.js";

export class TransactionsController {
  static async getTransactionById(req, res, next) {
    try {
      const { id } = objectIdParamSchema.parse({ id: req.params.transactionId });
      const data = await TransactionDetailsService.getTransactionById(req.user.id, id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
