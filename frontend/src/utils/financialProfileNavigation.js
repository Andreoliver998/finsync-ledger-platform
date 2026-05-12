const ALLOWED_TYPES = new Set(["person", "merchant", "bank", "paymentMethod", "category"]);
const TYPE_MAP = {
  PERSON: "person",
  MERCHANT: "merchant",
  MARKETPLACE: "merchant",
  BANK: "bank",
  PAYMENT_METHOD: "paymentMethod",
  CATEGORY: "category",
  person: "person",
  merchant: "merchant",
  bank: "bank",
  paymentMethod: "paymentMethod",
  category: "category"
};

function sanitizeString(value, maxLength = 120) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLength);
}

function sanitizeDate(value) {
  const normalized = sanitizeString(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function sanitizeType(value) {
  const normalized = sanitizeString(value, 20);
  const mapped = TYPE_MAP[normalized] || normalized;
  return ALLOWED_TYPES.has(mapped) ? mapped : "";
}

export function buildFinancialProfileUrl(params = {}) {
  const safeType = sanitizeType(params.type);
  const safeQuery = sanitizeString(params.q, 80);
  const startDate = sanitizeDate(params.startDate);
  const endDate = sanitizeDate(params.endDate);
  const searchParams = new URLSearchParams();

  if (safeType) searchParams.set("type", safeType);
  if (safeQuery) searchParams.set("q", safeQuery);
  if (startDate) searchParams.set("startDate", startDate);
  if (endDate) searchParams.set("endDate", endDate);

  const query = searchParams.toString();
  const url = query ? `/financial-profile?${query}` : "/financial-profile";

  if (import.meta.env.DEV) {
    console.log("[FinancialProfileNavigation]", {
      type: safeType,
      q: safeQuery,
      url
    });
  }

  return url;
}

export function openFinancialProfile(navigate, params = {}) {
  const nextUrl = buildFinancialProfileUrl(params);
  if (nextUrl === "/financial-profile") {
    return;
  }
  navigate(nextUrl);
}
