import {
  manualTransactionSchema,
  manualTransactionUpdateSchema
} from "../validators/manualTransactionValidator.js";
import { ManualTransactionService } from "../services/ManualTransactionService.js";

export class ManualTransactionController {
  static async create(req, res, next) {
    try {
      const data = manualTransactionSchema.parse(req.body);
      const transaction = await ManualTransactionService.create(req.user.id, data);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await ManualTransactionService.list(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const transaction = await ManualTransactionService.findById(req.user.id, req.params.id);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const data = manualTransactionUpdateSchema.parse(req.body);
      const transaction = await ManualTransactionService.update(req.user.id, req.params.id, data);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await ManualTransactionService.remove(req.user.id, req.params.id);
      res.json({ success: true, message: "Lançamento manual removido com sucesso." });
    } catch (error) {
      next(error);
    }
  }
}
