import { api } from "./api.js";

function normalizeListResponse(response) {
  return {
    data: response.data?.data ?? [],
    pagination: response.data?.pagination ?? {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 1
    }
  };
}

export async function listManualTransactions(params = {}) {
  const response = await api.get("/manual-transactions", { params });
  return normalizeListResponse(response);
}

export async function getManualTransaction(id) {
  const response = await api.get(`/manual-transactions/${id}`);
  return response.data?.data ?? response.data;
}

export async function createManualTransaction(data) {
  const response = await api.post("/manual-transactions", data);
  return response.data?.data ?? response.data;
}

export async function updateManualTransaction(id, data) {
  const response = await api.put(`/manual-transactions/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function deleteManualTransaction(id) {
  const response = await api.delete(`/manual-transactions/${id}`);
  return response.data;
}
