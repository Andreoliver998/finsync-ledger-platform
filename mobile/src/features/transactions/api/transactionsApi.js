import { api } from '@services/api';

/** GET /api/dashboard/all-transactions */
export async function fetchAllTransactions(params = {}) {
  const { data } = await api.get('/dashboard/all-transactions', { params });
  return data?.data ?? data;
}

/** GET /api/transactions/:transactionId */
export async function fetchTransactionById(transactionId) {
  if (!transactionId) throw new Error('transactionId obrigatório.');
  const { data } = await api.get(`/transactions/${transactionId}`);
  return data?.data ?? data;
}
