import { registerSchema, loginSchema } from "../validators/authValidator.js";
import { AuthService } from "../services/AuthService.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res) {
    return res.json({ success: true, data: req.user });
  }

  static async logout(req, res) {
    return res.json({
      success: true,
      message: "Logout registrado. Remova o token no cliente."
    });
  }
}
