import { prisma } from "../lib/prisma.js";
import { SummaryService } from "./SummaryService.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";
import { ReconciliationService } from "./ReconciliationService.js";
import { CSVNormalizerService } from "./CSVNormalizerService.js";
import { detectColumnMapping, getSupportedMappingFields } from "../utils/csvColumnDetector.js";
import { parseCsv } from "../utils/csvParser.js";
import { createFileFingerprint } from "../utils/transactionFingerprint.js";
import { normalizeCsvTransactionRow } from "../utils/transactionNormalizer.js";
import { HttpError } from "../utils/httpError.js";

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024;

function validateCsvInput(fileName, fileContent) {
  if (!/\.csv$/i.test(fileName)) {
    throw new HttpError(400, "Apenas arquivos CSV são aceitos.");
  }

  if (Buffer.byteLength(fileContent, "utf8") > MAX_CSV_SIZE_BYTES) {
    throw new HttpError(413, "Arquivo CSV excede o limite de 2MB.");
  }
}

function mergeMapping(detectedMapping, providedMapping = {}) {
  const merged = { ...detectedMapping };

  for (const field of getSupportedMappingFields()) {
    if (providedMapping[field]) {
      merged[field] = providedMapping[field];
    }
  }

  return merged;
}

function buildNormalizedRows({ userId, parsedCsv, mapping, bank, accountName, provider }) {
  return parsedCsv.rows.map((row) => {
    const normalized = normalizeCsvTransactionRow({
      userId,
      rawRow: row.raw,
      mapping,
      source: provider === "ONEDRIVE" ? "ONEDRIVE_CSV" : "CSV_UPLOAD",
      bank,
      accountName,
      provider
    });

    return {
      rowId: row.index,
      ...normalized
    };
  });
}

function summarizePreview(rows) {
  return rows.reduce(
    (summary, row) => {
      summary.totalRows += 1;

      if (row.reconciliationStatus === "DUPLICATE") {
        summary.duplicatedRows += 1;
      } else if (row.reconciliationStatus === "POSSIBLE_DUPLICATE") {
        summary.possibleDuplicateRows += 1;
      } else if (row.reconciliationStatus === "CONFLICT") {
        summary.conflictRows += 1;
      } else {
        summary.newRows += 1;
      }

      return summary;
    },
    {
      totalRows: 0,
      newRows: 0,
      duplicatedRows: 0,
      possibleDuplicateRows: 0,
      conflictRows: 0
    }
  );
}

function buildPreviewResponse({
  fileName,
  fileHash,
  parsedCsv,
  mapping,
  reconciledRows,
  provider,
  bank,
  accountName,
  bankDetection
}) {
  const summary = summarizePreview(reconciledRows);

  return {
    fileName,
    fileHash,
    delimiter: parsedCsv.delimiter,
    headers: parsedCsv.headers,
    suggestedMapping: mapping,
    previewRows: reconciledRows.slice(0, 50).map((row) => ({
      rowId: row.rowId,
      date: row.date,
      description: row.description,
      normalizedDescription: row.normalizedDescription,
      amount: row.amount,
      type: row.type,
      category: row.category,
      suggestedCategory: row.suggestedCategory,
      paymentMethod: row.paymentMethod,
      bank: row.bank,
      accountName: row.accountName,
      direction: row.direction,
      merchantName: row.merchantName,
      counterpartyName: row.counterpartyName,
      confidenceScore: row.confidenceScore,
      confidenceLabel: row.confidenceLabel,
      classificationReason: row.classificationReason,
      explanation: row.explanation,
      reconciliationStatus: row.reconciliationStatus,
      reconciliationReason: row.reconciliationReason,
      documentNumber: row.documentNumber,
      externalId: row.externalId
    })),
    summary,
    provider,
    bank,
    accountName,
    detectedBank: bankDetection?.bank ?? null,
    bankConfidence: bankDetection?.confidence ?? "none",
    bankDetectionSource: bankDetection?.source ?? null
  };
}

async function preparePreview(userId, payload) {
  validateCsvInput(payload.fileName, payload.fileContent);
  const parsedCsv = parseCsv(payload.fileContent);
  const detectedMapping = detectColumnMapping(parsedCsv.headers);
  const mapping = mergeMapping(detectedMapping, payload.mapping);

  if (!mapping.date || !mapping.description || !mapping.amount) {
    throw new HttpError(400, "Não foi possível sugerir o mapeamento mínimo: date, description e amount.");
  }

  const bankDetection = CSVNormalizerService.detectBank(payload.fileName, parsedCsv.headers);
  const resolvedBank = payload.bank || bankDetection.bank;

  const normalizedRows = buildNormalizedRows({
    userId,
    parsedCsv,
    mapping,
    bank: resolvedBank,
    accountName: payload.accountName,
    provider: payload.provider
  }).map((row) => {
    const enriched = CategoryClassifierService.classifyFull(row);
    return {
      ...row,
      category: row.category || enriched.category,
      paymentMethod: row.paymentMethod || enriched.paymentMethod,
      counterpartyName: row.counterpartyName || enriched.counterpartyName,
      tags: enriched.tags,
      direction: enriched.direction,
      merchantName: enriched.merchantName,
      confidenceScore: enriched.confidenceScore,
      confidenceLabel: enriched.confidenceLabel,
      classificationReason: enriched.classificationReason,
      explanation: enriched.explanation,
      suggestedCategory: enriched.category
    };
  });

  const reconciledRows = await ReconciliationService.classifyTransactions(userId, normalizedRows);
  const fileHash = createFileFingerprint(payload.fileContent);

  return {
    parsedCsv,
    mapping,
    fileHash,
    reconciledRows,
    resolvedBank,
    bankDetection
  };
}

function buildImportBatchMetadata(payload, parsedCsv, fileHash, mapping, summary) {
  return {
    source: payload.source,
    provider: payload.provider,
    bank: payload.bank || null,
    accountName: payload.accountName || null,
    fileName: payload.fileName,
    fileId: payload.fileId || null,
    fileHash,
    fileType: "CSV",
    status: "COMPLETED",
    totalRows: summary.totalRows,
    importedRows: summary.newRows + summary.possibleDuplicateRows,
    duplicatedRows: summary.duplicatedRows,
    errorRows: summary.conflictRows,
    columnMapping: mapping,
    rawMetadata: {
      delimiter: parsedCsv.delimiter,
      headers: parsedCsv.headers,
      processedAt: new Date().toISOString()
    }
  };
}

function buildTransactionCreateData(userId, importBatchId, row) {
  return {
    userId,
    importBatchId,
    matchedTransactionId: typeof row.matchedTransactionId === "string" ? row.matchedTransactionId : null,
    source: row.source,
    provider: row.provider,
    bank: row.bank,
    accountName: row.accountName,
    transactionHash: row.transactionHash,
    externalId: row.externalId,
    documentNumber: row.documentNumber,
    date: row.date,
    postedAt: row.postedAt,
    description: row.description,
    normalizedDescription: row.normalizedDescription,
    amount: row.amount,
    type: row.type,
    paymentMethod: row.paymentMethod,
    tags: row.tags || [],
    category: row.category || row.suggestedCategory,
    userCategory: row.category || row.suggestedCategory,
    subcategory: row.subcategory,
    balanceAfter: row.balanceAfter,
    currencyCode: row.currencyCode,
    counterpartyName: row.counterpartyName,
    counterpartyDocument: row.counterpartyDocument,
    notes: row.notes || null,
    reconciliationStatus: row.reconciliationStatus,
    reconciliationReason: row.reconciliationReason || null,
    reviewedAt: row.reconciliationStatus === "POSSIBLE_DUPLICATE" ? new Date() : null,
    status: row.reconciliationStatus === "POSSIBLE_DUPLICATE" ? "REVIEWED" : row.status,
    raw: row.raw
  };
}

function effectiveLedgerCategory(item) {
  return item.userCategory || item.category || null;
}

export class LedgerImportService {
  static async preview(userId, payload) {
    const { parsedCsv, mapping, fileHash, reconciledRows, resolvedBank, bankDetection } = await preparePreview(userId, payload);

    return buildPreviewResponse({
      fileName: payload.fileName,
      fileHash,
      parsedCsv,
      mapping,
      reconciledRows,
      provider: payload.provider,
      bank: resolvedBank,
      accountName: payload.accountName,
      bankDetection
    });
  }

  static async confirm(userId, payload) {
    const { parsedCsv, mapping, fileHash, reconciledRows, resolvedBank } = await preparePreview(userId, payload);
    const selectedSet = payload.selectedRowIndexes?.length
      ? new Set(payload.selectedRowIndexes)
      : null;

    const rowsToPersist = reconciledRows.filter((row) => {
      if (selectedSet && !selectedSet.has(row.rowId)) {
        return false;
      }

      return row.reconciliationStatus === "NEW" || row.reconciliationStatus === "POSSIBLE_DUPLICATE";
    });

    const summary = summarizePreview(
      selectedSet
        ? reconciledRows.filter((row) => selectedSet.has(row.rowId))
        : reconciledRows
    );

    const existingBatch = await prisma.importBatch.findFirst({
      where: {
        userId,
        OR: [
          payload.fileId ? { fileId: payload.fileId } : undefined,
          { fileHash, fileName: payload.fileName }
        ].filter(Boolean)
      }
    });

    if (existingBatch) {
      throw new HttpError(409, "Este arquivo já foi importado anteriormente para este usuário.");
    }

    const importBatch = await prisma.importBatch.create({
      data: {
        userId,
        ...buildImportBatchMetadata({ ...payload, bank: resolvedBank }, parsedCsv, fileHash, mapping, summary)
      }
    });

    if (rowsToPersist.length) {
      await prisma.ledgerTransaction.createMany({
        data: rowsToPersist.map((row) => buildTransactionCreateData(userId, importBatch.id, row))
      });
    }

    const touchedMonths = new Set(
      rowsToPersist.map((row) => `${row.date.getUTCFullYear()}-${row.date.getUTCMonth() + 1}`)
    );

    for (const monthKey of touchedMonths) {
      const [year, month] = monthKey.split("-").map(Number);
      SummaryService.invalidate(userId, month, year);
    }

    return {
      importBatch,
      summary,
      importedTransactions: rowsToPersist.length
    };
  }

  static async listImports(userId, query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {})
    };

    const [data, total] = await Promise.all([
      prisma.importBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.importBatch.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async findImportById(userId, id) {
    const item = await prisma.importBatch.findFirst({
      where: { id, userId },
      include: {
        ledgerTransactions: {
          orderBy: { date: "desc" },
          take: 50
        }
      }
    });

    if (!item) {
      throw new HttpError(404, "Lote de importação não encontrado.");
    }

    return item;
  }

  static async listTransactions(userId, query = {}) {
    const where = {
      userId,
      status: { not: "DISCARDED" }
    };
    const limit = Math.min(500, Number(query.limit || 100));

    if (query.month && query.year) {
      where.date = {
        gte: new Date(Date.UTC(Number(query.year), Number(query.month) - 1, 1)),
        lt: new Date(Date.UTC(Number(query.year), Number(query.month), 1))
      };
    } else if (query.year) {
      where.date = {
        gte: new Date(Date.UTC(Number(query.year), 0, 1)),
        lt: new Date(Date.UTC(Number(query.year) + 1, 0, 1))
      };
    }

    if (query.bank) where.bank = query.bank;
    if (query.source) where.source = query.source;
    if (query.category) {
      where.OR = [
        { category: query.category },
        { userCategory: query.category }
      ];
    }
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    const items = await prisma.ledgerTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit
    });

    return items.map((item) => ({
      ...item,
      category: effectiveLedgerCategory(item)
    }));
  }

  static async removeImport(userId, id) {
    const batch = await prisma.importBatch.findFirst({
      where: { id, userId }
    });

    if (!batch) {
      throw new HttpError(404, "Lote de importação não encontrado.");
    }

    await prisma.ledgerTransaction.deleteMany({
      where: {
        userId,
        importBatchId: id
      }
    });

    await prisma.importBatch.delete({
      where: { id }
    });

    return { id };
  }
}
