import { api } from '@services/api';

/** GET /api/ledger/intelligent-reading */
export async function fetchIntelligentReading(params = {}) {
  const { data } = await api.get('/ledger/intelligent-reading', { params });
  return data?.data ?? data;
}
