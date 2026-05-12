import { api } from "./api.js";

export async function getTransactionDetails(transactionId) {
  const response = await api.get(`/transactions/${transactionId}`);
  return response.data?.data ?? response.data;
}
