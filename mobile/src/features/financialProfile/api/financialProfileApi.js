import { api } from '@services/api';

/** GET /api/ledger/financial-profile */
export async function fetchFinancialProfile(params = {}) {
  const { data } = await api.get('/ledger/financial-profile', { params });
  return data?.data ?? data;
}
