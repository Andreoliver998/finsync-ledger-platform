import { api } from "./api.js";

function unwrap(response, fallback = null) {
  return response.data?.data ?? response.data ?? fallback;
}

export async function getSettings() {
  return unwrap(await api.get("/settings"), {});
}

export async function updateSettings(data) {
  return unwrap(await api.put("/settings", data), {});
}

export async function listGoals() {
  return unwrap(await api.get("/goals"), []);
}

export async function createGoal(data) {
  return unwrap(await api.post("/goals", data), {});
}

export async function updateGoal(id, data) {
  return unwrap(await api.put(`/goals/${id}`, data), {});
}

export async function deleteGoal(id) {
  return unwrap(await api.delete(`/goals/${id}`), {});
}

export async function listCards() {
  return unwrap(await api.get("/cards"), []);
}

export async function createCard(data) {
  return unwrap(await api.post("/cards", data), {});
}

export async function deleteCard(id) {
  return unwrap(await api.delete(`/cards/${id}`), {});
}

export async function listAlerts() {
  return unwrap(await api.get("/alerts"), []);
}

export async function createAlert(data) {
  return unwrap(await api.post("/alerts", data), {});
}

export async function updateAlert(id, data) {
  return unwrap(await api.put(`/alerts/${id}`, data), {});
}

export async function deleteAlert(id) {
  return unwrap(await api.delete(`/alerts/${id}`), {});
}

export async function listInvestments() {
  return unwrap(await api.get("/investments"), []);
}

export async function createInvestment(data) {
  return unwrap(await api.post("/investments", data), {});
}

export async function deleteInvestment(id) {
  return unwrap(await api.delete(`/investments/${id}`), {});
}

export async function getReports(params = {}) {
  return unwrap(await api.get("/reports", { params }), {});
}

export async function getFinancialAi(params = {}) {
  return unwrap(await api.get("/financial-ai/insights", { params }), {});
}
