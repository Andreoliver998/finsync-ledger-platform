import { api } from '@services/api';

/** GET /api/dashboard/all-transactions — transações combinadas (ledger + manual), paginadas */
export async function fetchAllTransactions(params = {}) {
  const { data } = await api.get('/dashboard/all-transactions', { params });
  return data?.data ?? data;
}

/** GET /api/ledger/financial-profile — dossiê financeiro de uma entidade */
export async function fetchFinancialProfile(params = {}) {
  const { data } = await api.get('/ledger/financial-profile', { params });
  return data?.data ?? data;
}

/** GET /api/ledger/analytics/reports — relatório completo (para preview de exportação) */
export async function fetchAnalyticsReports(params = {}) {
  const { data } = await api.get('/ledger/analytics/reports', { params });
  return data?.data ?? data;
}
