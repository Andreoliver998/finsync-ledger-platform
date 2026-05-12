import { transactionSchema } from "../validators/transactionValidator.js";
import { TransactionService } from "../services/TransactionService.js";

export class TransactionController {
  static async create(req, res, next) {
    try {
      const data = transactionSchema.parse(req.body);
      const transaction = await TransactionService.create(req.user.id, data);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await TransactionService.list(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const transaction = await TransactionService.findById(req.user.id, req.params.id);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const data = transactionSchema.partial().parse(req.body);
      const transaction = await TransactionService.update(req.user.id, req.params.id, data);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await TransactionService.remove(req.user.id, req.params.id);
      res.json({ success: true, message: "Transação removida com sucesso." });
    } catch (error) {
      next(error);
    }
  }
}
