import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { OneDriveAuthService } from "./OneDriveAuthService.js";

const DEFAULT_FOLDERS = {
  inbox: "/FinSync-Ledger/Entrada",
  processed: "/FinSync-Ledger/Processados",
  errors: "/FinSync-Ledger/Erros",
  archive: "/FinSync-Ledger/Arquivo"
};

function normalizeFolderPath(folderPath) {
  const value = String(folderPath || DEFAULT_FOLDERS.inbox).trim();

  if (!value.startsWith("/")) {
    return `/${value}`;
  }

  return value;
}

async function graphRequest(userId, path, options = {}) {
  const { accessToken } = await OneDriveAuthService.getValidAccessToken(userId);
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new HttpError(404, "Pasta ou arquivo OneDrive não encontrado.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(401, "Acesso OneDrive expirado ou sem permissão.");
    }

    throw new HttpError(502, "Falha ao acessar arquivos no OneDrive.");
  }

  return response;
}

function toImportedStatusMap(batches) {
  const map = new Map();

  for (const batch of batches) {
    if (batch.fileId) {
      map.set(batch.fileId, batch);
    }
  }

  return map;
}

export class OneDriveFileService {
  static getDefaultFolders() {
    return DEFAULT_FOLDERS;
  }

  static async listCsvFiles(userId) {
    const connection = await prisma.oneDriveConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return {
        folderPath: DEFAULT_FOLDERS.inbox,
        folders: DEFAULT_FOLDERS,
        files: []
      };
    }

    const folderPath = normalizeFolderPath(connection.folderPath);
    const response = await graphRequest(
      userId,
      `/me/drive/root:${encodeURI(folderPath)}:/children?$select=id,name,size,lastModifiedDateTime,webUrl,file,folder`
    );
    const payload = await response.json();

    const importedBatches = await prisma.importBatch.findMany({
      where: {
        userId,
        provider: "ONEDRIVE"
      },
      select: {
        id: true,
        fileId: true,
        status: true,
        importedRows: true,
        duplicatedRows: true,
        errorRows: true,
        createdAt: true
      }
    });

    const importedStatus = toImportedStatusMap(importedBatches);

    const files = (payload.value || [])
      .filter((item) => item.file && /\.csv$/i.test(item.name || ""))
      .map((item) => {
        const batch = importedStatus.get(item.id);
        return {
          id: item.id,
          name: item.name,
          size: item.size,
          lastModifiedDateTime: item.lastModifiedDateTime,
          webUrl: item.webUrl,
          status: batch ? batch.status : "NEW",
          origin: batch ? "ONEDRIVE_IMPORTED" : "ONEDRIVE_PENDING",
          importBatchId: batch?.id || null
        };
      });

    return {
      folderPath,
      folders: DEFAULT_FOLDERS,
      files
    };
  }

  static async downloadFileContent(userId, fileId) {
    if (!fileId) {
      throw new HttpError(400, "fileId é obrigatório.");
    }

    const response = await graphRequest(userId, `/me/drive/items/${encodeURIComponent(fileId)}/content`);
    return response.text();
  }
}
