import crypto from "node:crypto";

function normalizeText(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export function normalizeTransactionDescription(value) {
  return normalizeText(value)
    .replace(/\b(PGTO|PAGTO)\b/g, "PAGAMENTO")
    .replace(/\bTRANSF\b/g, "TRANSFERENCIA")
    .replace(/\bDOC\b/g, "DOCUMENTO")
    .trim();
}

export function buildTransactionFingerprintParts(payload = {}) {
  const externalId = normalizeText(payload.externalId);
  const documentNumber = normalizeText(payload.documentNumber);
  const strongId = externalId || documentNumber;

  return [
    normalizeText(payload.userId),
    normalizeDate(payload.date),
    normalizeAmount(payload.amount),
    normalizeTransactionDescription(payload.normalizedDescription || payload.description),
    normalizeText(payload.bank),
    normalizeText(payload.accountName),
    normalizeText(payload.paymentMethod),
    strongId,
    externalId,
    documentNumber
  ];
}

export function createTransactionFingerprint(payload = {}) {
  const raw = buildTransactionFingerprintParts(payload).join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function createFileFingerprint(content) {
  return crypto.createHash("sha256").update(content || "").digest("hex");
}
