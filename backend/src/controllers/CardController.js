import { cardSchema } from "../validators/cardValidator.js";
import { CardService } from "../services/CardService.js";

export class CardController {
  static async create(req, res, next) {
    try {
      const data = cardSchema.parse(req.body);
      const card = await CardService.create(req.user.id, data);
      res.status(201).json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const cards = await CardService.list(req.user.id);
      res.json({ success: true, data: cards });
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const card = await CardService.findById(req.user.id, req.params.id);
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const data = cardSchema.partial().parse(req.body);
      const card = await CardService.update(req.user.id, req.params.id, data);
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await CardService.remove(req.user.id, req.params.id);
      res.json({ success: true, message: "Cartão desativado com sucesso." });
    } catch (error) {
      next(error);
    }
  }
}
