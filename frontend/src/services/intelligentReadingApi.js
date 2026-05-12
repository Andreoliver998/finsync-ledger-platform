import { api } from "./api.js";

function unwrap(response, fallback = null) {
  return response.data?.data ?? response.data ?? fallback;
}

export async function getIntelligentReading(params = {}) {
  return unwrap(await api.get("/ledger/intelligent-reading", { params }), {});
}
