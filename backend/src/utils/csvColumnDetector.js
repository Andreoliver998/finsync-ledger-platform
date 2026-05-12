const COLUMN_ALIASES = {
  date: ["data", "date", "data lancamento", "data lançamento", "posted at"],
  description: ["descricao", "descrição", "historico", "histórico", "lancamento", "lançamento", "description"],
  amount: ["valor", "amount", "valor rs", "valor r$", "amount brl"],
  balanceAfter: ["saldo", "balance", "saldo final", "saldo apos", "saldo após"],
  type: ["tipo", "type", "natureza"],
  documentNumber: ["documento", "doc", "id", "numero documento", "n documento"],
  category: ["categoria", "category"],
  paymentMethod: ["forma pagamento", "meio pagamento", "payment method", "paymentmethod"],
  externalId: ["external id", "transaction id", "codigo", "código", "identificador"],
  postedAt: ["posted at", "data efetivacao", "data efetivação", "data compensacao", "data compensação"],
  counterpartyName: ["favorecido", "beneficiario", "beneficiário", "counterparty", "nome"],
  counterpartyDocument: ["cpf", "cnpj", "documento favorecido", "documento beneficiario", "documento beneficiário"]
};

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function detectColumnMapping(headers = []) {
  const mapping = {};

  for (const header of headers) {
    const normalizedHeader = normalizeKey(header);

    for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (mapping[target]) {
        continue;
      }

      if (aliases.includes(normalizedHeader)) {
        mapping[target] = header;
      }
    }
  }

  return mapping;
}

export function getSupportedMappingFields() {
  return [
    "date",
    "postedAt",
    "description",
    "amount",
    "balanceAfter",
    "type",
    "documentNumber",
    "category",
    "paymentMethod",
    "externalId",
    "counterpartyName",
    "counterpartyDocument"
  ];
}
