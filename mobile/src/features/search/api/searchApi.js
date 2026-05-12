import { api } from '@services/api';

/** GET /api/ledger/search */
export async function searchLedger(params) {
  const { data } = await api.get('/ledger/search', { params });
  return data?.data ?? data;
}
