import { categorySchema } from "../validators/categoryValidator.js";
import { CategoryService } from "../services/CategoryService.js";

export class CategoryController {
  static async create(req, res, next) {
    try {
      const data = categorySchema.parse(req.body);
      const category = await CategoryService.create(req.user.id, data);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const categories = await CategoryService.list(req.user.id);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const data = categorySchema.partial().parse(req.body);
      const category = await CategoryService.update(req.user.id, req.params.id, data);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await CategoryService.remove(req.user.id, req.params.id);
      res.json({ success: true, message: "Categoria removida com sucesso." });
    } catch (error) {
      next(error);
    }
  }
}
