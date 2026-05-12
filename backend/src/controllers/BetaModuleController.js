import {
  alertRuleSchema,
  appSettingsSchema,
  financialGoalSchema,
  investmentPositionSchema
} from "../validators/betaModuleValidator.js";
import { BetaModuleService } from "../services/BetaModuleService.js";

export class BetaModuleController {
  static async getSettings(req, res, next) {
    try {
      const settings = await BetaModuleService.getSettings(req.user.id);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const data = appSettingsSchema.parse(req.body);
      const settings = await BetaModuleService.updateSettings(req.user.id, data);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async listGoals(req, res, next) {
    try {
      const goals = await BetaModuleService.listGoals(req.user.id);
      res.json({ success: true, data: goals });
    } catch (error) {
      next(error);
    }
  }

  static async createGoal(req, res, next) {
    try {
      const data = financialGoalSchema.parse(req.body);
      const goal = await BetaModuleService.createGoal(req.user.id, data);
      res.status(201).json({ success: true, data: goal });
    } catch (error) {
      next(error);
    }
  }

  static async updateGoal(req, res, next) {
    try {
      const data = financialGoalSchema.partial().parse(req.body);
      const goal = await BetaModuleService.updateGoal(req.user.id, req.params.id, data);
      res.json({ success: true, data: goal });
    } catch (error) {
      next(error);
    }
  }

  static async removeGoal(req, res, next) {
    try {
      await BetaModuleService.removeGoal(req.user.id, req.params.id);
      res.json({ success: true, message: "Meta removida com sucesso." });
    } catch (error) {
      next(error);
    }
  }

  static async listAlerts(req, res, next) {
    try {
      const alerts = await BetaModuleService.listAlerts(req.user.id);
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  static async createAlert(req, res, next) {
    try {
      const data = alertRuleSchema.parse(req.body);
      const alert = await BetaModuleService.createAlert(req.user.id, data);
      res.status(201).json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  static async updateAlert(req, res, next) {
    try {
      const data = alertRuleSchema.partial().parse(req.body);
      const alert = await BetaModuleService.updateAlert(req.user.id, req.params.id, data);
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  static async removeAlert(req, res, next) {
    try {
      await BetaModuleService.removeAlert(req.user.id, req.params.id);
      res.json({ success: true, message: "Alerta removido com sucesso." });
    } catch (error) {
      next(error);
    }
  }

  static async listInvestments(req, res, next) {
    try {
      const investments = await BetaModuleService.listInvestments(req.user.id);
      res.json({ success: true, data: investments });
    } catch (error) {
      next(error);
    }
  }

  static async createInvestment(req, res, next) {
    try {
      const data = investmentPositionSchema.parse(req.body);
      const investment = await BetaModuleService.createInvestment(req.user.id, data);
      res.status(201).json({ success: true, data: investment });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvestment(req, res, next) {
    try {
      const data = investmentPositionSchema.partial().parse(req.body);
      const investment = await BetaModuleService.updateInvestment(req.user.id, req.params.id, data);
      res.json({ success: true, data: investment });
    } catch (error) {
      next(error);
    }
  }

  static async removeInvestment(req, res, next) {
    try {
      await BetaModuleService.removeInvestment(req.user.id, req.params.id);
      res.json({ success: true, message: "Investimento removido com sucesso." });
    } catch (error) {
      next(error);
    }
  }

  static async reports(req, res, next) {
    try {
      const report = await BetaModuleService.reports(req.user.id, req.query);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async financialAi(req, res, next) {
    try {
      const insights = await BetaModuleService.financialAi(req.user.id, req.query);
      res.json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  }
}
