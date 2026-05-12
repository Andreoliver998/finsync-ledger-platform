import { api } from '@services/api';

/** GET /api/ledger/relationship-graph */
export async function fetchRelationshipGraph(params = {}) {
  const { data } = await api.get('/ledger/relationship-graph', { params });
  return data?.data ?? data;
}
