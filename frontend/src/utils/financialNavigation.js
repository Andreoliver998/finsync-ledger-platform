const SEARCH_ALLOWED_PARAMS = [
  "q",
  "startDate",
  "endDate",
  "type",
  "paymentMethod",
  "category",
  "source",
  "minAmount",
  "maxAmount",
  "recurrence"
];

const TRANSACTIONS_ALLOWED_PARAMS = [
  "startDate",
  "endDate",
  "type",
  "status",
  "paymentMethod",
  "category",
  "source",
  "minAmount",
  "maxAmount",
  "transactionId"
];

function sanitizeString(value, maxLength = 120) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLength);
}

function sanitizeAmount(value) {
  const normalized = sanitizeString(value, 24).replace(",", ".");
  if (!normalized) return "";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed);
}

function sanitizeDate(value) {
  const normalized = sanitizeString(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function sanitizeBooleanFlag(value) {
  if (value === true || value === "true") return "true";
  return "";
}

function sanitizeValue(key, value) {
  if (value === null || value === undefined) return "";

  if (key === "minAmount" || key === "maxAmount") {
    return sanitizeAmount(value);
  }

  if (key === "startDate" || key === "endDate") {
    return sanitizeDate(value);
  }

  if (key === "recurrence") {
    return sanitizeBooleanFlag(value);
  }

  return sanitizeString(value);
}

function buildUrl(basePath, params = {}, allowedKeys = []) {
  const searchParams = new URLSearchParams();

  for (const key of allowedKeys) {
    const sanitized = sanitizeValue(key, params[key]);
    if (!sanitized) continue;
    searchParams.set(key, sanitized);
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildSearchUrl(params = {}) {
  const withFallbackQuery = { ...params };
  const fallbackQuery = withFallbackQuery.q || withFallbackQuery.paymentMethod || withFallbackQuery.category || withFallbackQuery.source;
  if (!withFallbackQuery.q && fallbackQuery) {
    withFallbackQuery.q = fallbackQuery;
  }
  return buildUrl("/search", withFallbackQuery, SEARCH_ALLOWED_PARAMS);
}

export function buildTransactionsUrl(params = {}) {
  const sanitizedTransactionId = sanitizeString(params.transactionId, 24);
  if (sanitizedTransactionId) {
    const nextParams = { ...params };
    delete nextParams.transactionId;
    const query = buildUrl("", nextParams, TRANSACTIONS_ALLOWED_PARAMS.filter((key) => key !== "transactionId"));
    return query ? `/transactions/${sanitizedTransactionId}${query}` : `/transactions/${sanitizedTransactionId}`;
  }
  return buildUrl("/transactions", params, TRANSACTIONS_ALLOWED_PARAMS);
}

export function openSearchFromInsight(navigate, insight = {}) {
  navigate(buildSearchUrl(insight));
}

export function openTransactionsFromInsight(navigate, insight = {}) {
  navigate(buildTransactionsUrl(insight));
}
