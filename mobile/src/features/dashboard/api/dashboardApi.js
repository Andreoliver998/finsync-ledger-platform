import { api } from '@services/api';

/**
 * GET /api/sync/dashboard-summary
 * @param {Object} [params] period, startDate, endDate, source, category, etc.
 */
export async function fetchDashboardSummary(params = {}) {
  const { data } = await api.get('/sync/dashboard-summary', { params });
  return data?.data ?? data;
}

/**
 * GET /api/dashboard/metrics — retorna KPIs estendidos, anomalias, tendência mensal, breakdown por banco.
 * Dead code: definida mas não utilizada em nenhuma tela. Candidata à integração futura no DashboardScreen
 * como complemento ao fetchDashboardSummary (que usa /sync/dashboard-summary).
 */
export async function fetchDashboardMetrics(params = {}) {
  const { data } = await api.get('/dashboard/metrics', { params });
  return data?.data ?? data;
}
