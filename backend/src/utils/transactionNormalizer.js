import { HttpError } from "./httpError.js";
import {
  createTransactionFingerprint,
  normalizeTransactionDescription
} from "./transactionFingerprint.js";

function readMappedValue(raw, mapping, field) {
  const column = mapping?.[field];
  return column ? raw?.[column] ?? "" : "";
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const stringValue = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(stringValue)) {
    const [day, month, year] = stringValue.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return new Date(`${stringValue}T00:00:00.000Z`);
  }

  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumberValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const stringValue = String(value).trim().replace(/\s/g, "");

  if (!stringValue) {
    return null;
  }

  const normalized = stringValue.includes(",") && stringValue.includes(".")
    ? stringValue.replace(/\./g, "").replace(",", ".")
    : stringValue.includes(",")
      ? stringValue.replace(",", ".")
      : stringValue;

  const numeric = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeType(value, amount) {
  const normalized = String(value || "").trim().toUpperCase();

  if (["CREDIT", "INCOME", "ENTRADA", "RECEITA"].includes(normalized)) {
    return "CREDIT";
  }

  if (["DEBIT", "EXPENSE", "SAIDA", "SAÍDA", "DESPESA"].includes(normalized)) {
    return "DEBIT";
  }

  return Number(amount) < 0 ? "DEBIT" : "CREDIT";
}

function normalizePaymentMethod(value) {
  if (!value) {
    return null;
  }

  return String(value).trim().toUpperCase();
}

function cleanString(value) {
  const stringValue = String(value || "").trim();
  return stringValue || null;
}

export function normalizeCsvTransactionRow({
  userId,
  rawRow,
  mapping,
  source = "CSV_UPLOAD",
  bank,
  accountName,
  provider = "MANUAL_UPLOAD"
}) {
  const date = parseDateValue(readMappedValue(rawRow, mapping, "date"));
  const postedAt = parseDateValue(readMappedValue(rawRow, mapping, "postedAt"));
  const description = cleanString(readMappedValue(rawRow, mapping, "description"));
  const amount = parseNumberValue(readMappedValue(rawRow, mapping, "amount"));
  const balanceAfter = parseNumberValue(readMappedValue(rawRow, mapping, "balanceAfter"));
  const documentNumber = cleanString(readMappedValue(rawRow, mapping, "documentNumber"));
  const externalId = cleanString(readMappedValue(rawRow, mapping, "externalId"));
  const category = cleanString(readMappedValue(rawRow, mapping, "category"));
  const paymentMethod = normalizePaymentMethod(readMappedValue(rawRow, mapping, "paymentMethod"));
  const counterpartyName = cleanString(readMappedValue(rawRow, mapping, "counterpartyName"));
  const counterpartyDocument = cleanString(readMappedValue(rawRow, mapping, "counterpartyDocument"));

  if (!date || !description || amount === null) {
    throw new HttpError(400, "O CSV precisa conter data, descrição e valor válidos.");
  }

  const normalizedDescription = normalizeTransactionDescription(description);
  const normalizedAmount = Math.abs(amount);
  const type = normalizeType(readMappedValue(rawRow, mapping, "type"), amount);

  return {
    source,
    provider,
    bank: cleanString(bank),
    accountName: cleanString(accountName),
    externalId,
    documentNumber,
    date,
    postedAt,
    description,
    normalizedDescription,
    amount: normalizedAmount,
    type,
    paymentMethod,
    category,
    subcategory: null,
    balanceAfter,
    currencyCode: "BRL",
    counterpartyName,
    counterpartyDocument,
    status: "CONFIRMED",
    raw: rawRow,
    transactionHash: createTransactionFingerprint({
      userId,
      date,
      amount: normalizedAmount,
      normalizedDescription,
      bank,
      accountName,
      paymentMethod,
      documentNumber,
      externalId
    })
  };
}
