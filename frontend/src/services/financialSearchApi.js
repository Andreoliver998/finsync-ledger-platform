import { api } from "./api.js";

export async function searchFinancialTransactions(params = {}) {
  const response = await api.get("/ledger/search", { params });
  return response.data?.data ?? response.data;
}
