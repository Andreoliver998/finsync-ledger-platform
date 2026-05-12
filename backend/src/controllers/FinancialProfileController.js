import { ZodError } from "zod";
import { FinancialProfileService } from "../services/FinancialProfileService.js";

export class FinancialProfileController {
  static async read(req, res, next) {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("[FinancialProfileController]", {
          userId: req.user?.id,
          type: req.query?.type,
          q: req.query?.q,
          startDate: req.query?.startDate,
          endDate: req.query?.endDate
        });
      }

      const data = await FinancialProfileService.getProfile(req.user.id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      if (error instanceof ZodError) {
        const hasTypeError = error.issues.some((issue) => issue.path.includes("type"));
        const hasQueryError = error.issues.some((issue) => issue.path.includes("q"));

        if (hasTypeError) {
          return res.status(400).json({
            success: false,
            message: "Tipo de perfil inválido. Use person, merchant, bank, paymentMethod ou category."
          });
        }

        if (hasQueryError) {
          return res.status(400).json({
            success: false,
            message: "Informe uma entidade válida para abrir o perfil financeiro."
          });
        }

        return res.status(400).json({
          success: false,
          message: "Parâmetros inválidos para o perfil financeiro."
        });
      }

      next(error);
    }
  }
}
