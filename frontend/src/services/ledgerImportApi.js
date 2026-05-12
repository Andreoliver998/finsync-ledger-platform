import { api } from "./api.js";

export async function previewLedgerCsv(payload) {
  const response = await api.post("/ledger/imports/csv/preview", payload, { timeout: 120000 });
  return response.data?.data ?? response.data;
}

export async function confirmLedgerCsvImport(payload) {
  const response = await api.post("/ledger/imports/csv/confirm", payload, { timeout: 120000 });
  return response.data?.data ?? response.data;
}

export async function listLedgerImports(params = {}) {
  const response = await api.get("/ledger/imports", { params });
  return {
    data: response.data?.data ?? [],
    pagination: response.data?.pagination ?? null
  };
}

export async function getLedgerImportById(id) {
  const response = await api.get(`/ledger/imports/${id}`);
  return response.data?.data ?? response.data;
}

export async function listLedgerTransactions(params = {}) {
  const response = await api.get("/ledger/transactions", { params });
  return response.data?.data ?? response.data;
}

export async function updateLedgerTransaction(id, payload) {
  const response = await api.patch(`/ledger/transactions/${id}`, payload);
  return response.data?.data ?? response.data;
}

export async function listLedgerReconciliationReview(params = {}) {
  const response = await api.get("/ledger/reconciliation/review", { params });
  return {
    data: response.data?.data ?? [],
    totalGroups: response.data?.totalGroups ?? 0,
    totalTransactions: response.data?.totalTransactions ?? 0
  };
}

export async function resolveLedgerReconciliation(id, payload) {
  const response = await api.post(`/ledger/reconciliation/${id}/resolve`, payload);
  return response.data?.data ?? response.data;
}

export async function deleteLedgerImport(id) {
  const response = await api.delete(`/ledger/imports/${id}`);
  return response.data?.data ?? response.data;
}

export async function getOneDriveStatus() {
  const response = await api.get("/onedrive/status");
  return response.data?.data ?? response.data;
}

export async function getOneDriveAuthUrl() {
  const response = await api.get("/onedrive/auth-url");
  return response.data?.data ?? response.data;
}

export async function syncOneDriveNow() {
  const response = await api.post("/onedrive/sync");
  return response.data?.data ?? response.data;
}

export async function listOneDriveFiles() {
  const response = await api.get("/onedrive/files");
  return response.data?.data ?? response.data;
}

export async function disconnectOneDrive() {
  const response = await api.post("/onedrive/disconnect");
  return response.data?.data ?? response.data;
}
