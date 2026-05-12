import { SummaryService } from "../services/SummaryService.js";

export class SummaryController {
  static async monthly(req, res, next) {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Informe month e year na query."
        });
      }

      const summary = await SummaryService.monthly(req.user.id, month, year);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
