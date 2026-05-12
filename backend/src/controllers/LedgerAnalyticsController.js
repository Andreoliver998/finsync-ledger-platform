import { LedgerAnalyticsService } from "../services/LedgerAnalyticsService.js";
import { StatementInterpreterService } from "../services/StatementInterpreterService.js";
import { ledgerAnalyticsQuerySchema } from "../validators/ledgerAnalyticsValidator.js";

export class LedgerAnalyticsController {
  static async overview(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.overview(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async timeline(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.timeline(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async categories(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.categories(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async merchants(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.merchants(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async paymentMethods(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.paymentMethods(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async reports(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.reports(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async insights(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.insights(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async executiveSummary(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.executiveSummary(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async cardUsage(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await LedgerAnalyticsService.cardUsage(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async importQuality(req, res, next) {
    try {
      const data = await LedgerAnalyticsService.importQuality(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async statementReading(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.statementReading(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async executiveReport(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.executiveReport(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async questionAnswers(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.questionAnswers(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async rankings(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.rankings(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async confidence(req, res, next) {
    try {
      const query = ledgerAnalyticsQuerySchema.parse(req.query);
      const data = await StatementInterpreterService.confidence(req.user.id, query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
