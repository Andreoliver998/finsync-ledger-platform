import { api } from '@services/api';

/**
 * GET /api/sync/dashboard-summary
 * @param {Object} [params] period, startDate, endDate, source, category, etc.
 */
export async function fetchDashboardSummary(params = {}) {
  const { data } = await api.get('/sync/dashboard-summary', { params });
  return data?.data ?? data;
}

/** GET /api/dashboard/metrics */
export async function fetchDashboardMetrics(params = {}) {
  const { data } = await api.get('/dashboard/metrics', { params });
  return data?.data ?? data;
}
