import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { OneDriveAuthService } from "../services/OneDriveAuthService.js";
import { OneDriveFileService } from "../services/OneDriveFileService.js";
import { OneDriveSyncService } from "../services/OneDriveSyncService.js";

export class OneDriveController {
  static async authUrl(req, res, next) {
    try {
      const data = OneDriveAuthService.buildAuthUrl(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async callback(req, res, next) {
    try {
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");

      if (!code || !state) {
        throw new HttpError(400, "Callback Microsoft inválido.");
      }

      const result = await OneDriveAuthService.handleCallback({ code, state });
      res.redirect(result.redirectUrl);
    } catch (error) {
      res.redirect(`${env.frontendUrl}/onedrive?onedrive=error`);
    }
  }

  static async status(req, res, next) {
    try {
      const data = await OneDriveSyncService.status(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async disconnect(req, res, next) {
    try {
      const data = await OneDriveSyncService.disconnect(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async sync(req, res, next) {
    try {
      const data = await OneDriveSyncService.sync(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async files(req, res, next) {
    try {
      const data = await OneDriveFileService.listCsvFiles(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
