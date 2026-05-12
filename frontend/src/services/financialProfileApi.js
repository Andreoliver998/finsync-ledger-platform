import { api } from "./api.js";

function unwrap(response, fallback = null) {
  return response.data?.data ?? response.data ?? fallback;
}

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

function buildProfileParams(params = {}) {
  const type = sanitizeString(params.type, 20);
  const q = sanitizeString(params.q, 80);
  const startDate = sanitizeDate(params.startDate);
  const endDate = sanitizeDate(params.endDate);

  return Object.fromEntries(
    Object.entries({
      type,
      q,
      startDate,
      endDate
    }).filter(([, value]) => value !== "")
  );
}

export async function getFinancialProfile(params = {}) {
  return unwrap(await api.get("/ledger/financial-profile", { params: buildProfileParams(params) }), {});
}
