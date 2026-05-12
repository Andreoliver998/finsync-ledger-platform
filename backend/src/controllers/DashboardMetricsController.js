import { DashboardMetricsService } from "../services/DashboardMetricsService.js";

export class DashboardMetricsController {
  static async extendedMetrics(req, res, next) {
    try {
      const data = await DashboardMetricsService.getExtendedMetrics(req.user.id, req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async allTransactions(req, res, next) {
    try {
      const data = await DashboardMetricsService.getAllTransactions(req.user.id, req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
