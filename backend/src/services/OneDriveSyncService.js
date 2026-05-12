import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { LedgerImportService } from "./LedgerImportService.js";
import { OneDriveAuthService } from "./OneDriveAuthService.js";
import { OneDriveFileService } from "./OneDriveFileService.js";

export class OneDriveSyncService {
  static async status(userId) {
    const connection = await prisma.oneDriveConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return {
        connected: false,
        provider: "ONEDRIVE",
        mode: "OAUTH_READY",
        folderPath: OneDriveFileService.getDefaultFolders().inbox,
        folders: OneDriveFileService.getDefaultFolders(),
        lastSyncAt: null
      };
    }

    return {
      connected: connection.status === "CONNECTED",
      provider: "ONEDRIVE",
      mode: "OAUTH_READY",
      microsoftUserId: connection.microsoftUserId,
      displayName: connection.displayName,
      email: connection.email,
      folderPath: connection.folderPath,
      folders: OneDriveFileService.getDefaultFolders(),
      lastSyncAt: connection.lastSyncAt,
      status: connection.status
    };
  }

  static async sync(userId) {
    await OneDriveAuthService.getValidAccessToken(userId);
    const filesPayload = await OneDriveFileService.listCsvFiles(userId);
    const results = [];
    let importedFiles = 0;
    let ignoredFiles = 0;
    let erroredFiles = 0;

    for (const file of filesPayload.files) {
      const existing = await prisma.importBatch.findFirst({
        where: {
          userId,
          provider: "ONEDRIVE",
          fileId: file.id
        }
      });

      if (existing) {
        ignoredFiles += 1;
        results.push({
          fileId: file.id,
          fileName: file.name,
          status: "IGNORED",
          reason: "already_imported"
        });
        continue;
      }

      try {
        const fileContent = await OneDriveFileService.downloadFileContent(userId, file.id);
        const result = await LedgerImportService.confirm(userId, {
          source: "ONEDRIVE_CSV",
          provider: "ONEDRIVE",
          bank: null,
          accountName: null,
          fileName: file.name,
          fileId: file.id,
          fileContent
        });

        importedFiles += 1;
        results.push({
          fileId: file.id,
          fileName: file.name,
          status: "IMPORTED",
          importBatchId: result.importBatch.id,
          importedRows: result.importedTransactions
        });
      } catch (error) {
        erroredFiles += 1;
        results.push({
          fileId: file.id,
          fileName: file.name,
          status: "ERROR",
          reason: error.message
        });
      }
    }

    await prisma.oneDriveConnection.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        status: "CONNECTED"
      }
    });

    return {
      synced: true,
      importedFiles,
      ignoredFiles,
      erroredFiles,
      results
    };
  }

  static async disconnect(userId) {
    return OneDriveAuthService.disconnect(userId);
  }
}
