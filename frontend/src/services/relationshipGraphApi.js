import { api } from "./api.js";

function unwrap(response, fallback = null) {
  return response.data?.data ?? response.data ?? fallback;
}

export async function getRelationshipGraph(params = {}) {
  return unwrap(await api.get("/ledger/relationship-graph", { params }), null);
}
