import { Router } from "express";
import { OneDriveController } from "../controllers/OneDriveController.js";

export const oneDriveRoutes = Router();

oneDriveRoutes.get("/auth-url", OneDriveController.authUrl);
oneDriveRoutes.get("/status", OneDriveController.status);
oneDriveRoutes.post("/disconnect", OneDriveController.disconnect);
oneDriveRoutes.post("/sync", OneDriveController.sync);
oneDriveRoutes.get("/files", OneDriveController.files);
