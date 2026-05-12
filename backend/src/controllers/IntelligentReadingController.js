import { StatementInterpreterService } from "../services/StatementInterpreterService.js";
import { ledgerAnalyticsQuerySchema } from "../validators/ledgerAnalyticsValidator.js";

export class IntelligentReadingController {
  static async read(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.intelligentReading(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
