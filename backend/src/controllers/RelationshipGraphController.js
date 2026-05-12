import { RelationshipGraphService } from "../services/RelationshipGraphService.js";

export class RelationshipGraphController {
  static async read(req, res, next) {
    try {
      const data = await RelationshipGraphService.getGraph(req.user.id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
