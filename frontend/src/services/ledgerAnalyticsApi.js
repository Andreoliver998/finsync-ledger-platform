import { api } from "./api.js";

function unwrap(response, fallback = null) {
  return response.data?.data ?? response.data ?? fallback;
}

export async function getLedgerAnalyticsOverview(params = {}) {
  return unwrap(await api.get("/ledger/analytics/overview", { params }), {});
}

export async function getLedgerAnalyticsTimeline(params = {}) {
  return unwrap(await api.get("/ledger/analytics/timeline", { params }), {});
}

export async function getLedgerAnalyticsCategories(params = {}) {
  return unwrap(await api.get("/ledger/analytics/categories", { params }), []);
}

export async function getLedgerAnalyticsMerchants(params = {}) {
  return unwrap(await api.get("/ledger/analytics/merchants", { params }), []);
}

export async function getLedgerAnalyticsPaymentMethods(params = {}) {
  return unwrap(await api.get("/ledger/analytics/payment-methods", { params }), []);
}

export async function getLedgerAnalyticsReports(params = {}) {
  return unwrap(await api.get("/ledger/analytics/reports", { params }), {});
}

export async function getLedgerAnalyticsExecutiveSummary(params = {}) {
  return unwrap(await api.get("/ledger/analytics/executive-summary", { params }), {});
}

export async function getLedgerAnalyticsStatementReading(params = {}) {
  return unwrap(await api.get("/ledger/analytics/statement-reading", { params }), {});
}

export async function getLedgerAnalyticsExecutiveReport(params = {}) {
  return unwrap(await api.get("/ledger/analytics/executive-report", { params }), {});
}

export async function getLedgerAnalyticsQuestionAnswers(params = {}) {
  return unwrap(await api.get("/ledger/analytics/question-answers", { params }), {});
}

export async function getLedgerAnalyticsRankings(params = {}) {
  return unwrap(await api.get("/ledger/analytics/rankings", { params }), {});
}

export async function getLedgerAnalyticsInsights(params = {}) {
  return unwrap(await api.get("/ledger/analytics/insights", { params }), {});
}

export async function getLedgerAnalyticsCardUsage(params = {}) {
  return unwrap(await api.get("/ledger/analytics/card-usage", { params }), {});
}

export async function getLedgerAnalyticsImportQuality(params = {}) {
  return unwrap(await api.get("/ledger/analytics/import-quality", { params }), {});
}

export async function getLedgerAnalyticsConfidence(params = {}) {
  return unwrap(await api.get("/ledger/analytics/confidence", { params }), {});
}
