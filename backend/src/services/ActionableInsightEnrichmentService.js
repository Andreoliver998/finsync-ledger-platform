function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactText(value, maxLength = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function toDateIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(toNumber(value));
}

function uniqueBy(items = [], getKey) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function summarizeTransaction(transaction = {}) {
  const amount = transaction.signedAmount ?? transaction.amount ?? 0;
  return {
    id: transaction.id || null,
    date: toDateIso(transaction.date),
    amount: toNumber(amount),
    absoluteAmount: Math.abs(toNumber(amount)),
    description: compactText(transaction.description || transaction.normalizedDescription, 160),
    category: compactText(transaction.category || transaction.userCategory, 80) || null,
    paymentMethod: compactText(transaction.paymentMethod || transaction.operationType, 80) || null,
    merchant: compactText(transaction.merchantName || transaction.merchant, 100) || null,
    counterpartyName: compactText(transaction.counterpartyName, 100) || null,
    source: compactText(transaction.source, 60) || null,
    provider: compactText(transaction.provider, 60) || null
  };
}

function compactEvidence(label, value, meta = {}) {
  if (value === undefined || value === null || value === "") return null;
  return {
    label,
    value,
    ...meta
  };
}

function resolveEntityType(entity, source = {}) {
  const type = compactText(source.entityType || source.type, 40);
  if (["person", "merchant", "bank", "paymentMethod", "category"].includes(type)) {
    return type;
  }

  const text = normalizeText(entity);
  if (!text) return null;
  if (["pix", "ted", "doc", "boleto", "credito", "debito", "transferencia"].some((item) => text.includes(item))) {
    return "paymentMethod";
  }
  if (["nubank", "itau", "banco", "bradesco", "santander", "inter", "caixa", "c6"].some((item) => text.includes(item))) {
    return "bank";
  }
  if (["mercado", "ifood", "uber", "amazon", "shopee", "magalu"].some((item) => text.includes(item))) {
    return "merchant";
  }
  return "person";
}

function findReferencedValue(text, items = [], keys = []) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return null;

  return items.find((item) => {
    const label = keys.map((key) => item?.[key]).find(Boolean);
    const normalizedLabel = normalizeText(label);
    return normalizedLabel && normalizedText.includes(normalizedLabel);
  }) || null;
}

function transactionMatches(transaction, criteria = {}) {
  const entity = normalizeText(criteria.entity);
  const category = normalizeText(criteria.category);
  const paymentMethod = normalizeText(criteria.paymentMethod);
  const haystack = normalizeText([
    transaction.description,
    transaction.normalizedDescription,
    transaction.merchant,
    transaction.merchantName,
    transaction.counterpartyName,
    transaction.category,
    transaction.paymentMethod,
    transaction.operationType
  ].filter(Boolean).join(" "));

  if (criteria.transactionId && transaction.id === criteria.transactionId) return true;
  if (entity && haystack.includes(entity)) return true;
  if (category && normalizeText(transaction.category).includes(category)) return true;
  if (paymentMethod && normalizeText(transaction.paymentMethod || transaction.operationType).includes(paymentMethod)) return true;
  return false;
}

function buildNavigationTarget({ transactionId, entity, entityType, category, paymentMethod, relatedTransactions }) {
  if (transactionId) {
    return {
      route: "TransactionDetails",
      params: { transactionId }
    };
  }

  if (entity) {
    return {
      route: "FinancialProfile",
      params: {
        entity,
        q: entity,
        type: entityType || resolveEntityType(entity)
      }
    };
  }

  if (category || paymentMethod) {
    const q = category || paymentMethod;
    return {
      route: "FinancialSearch",
      params: {
        q,
        prefill: q,
        type: category ? "category" : "paymentMethod"
      }
    };
  }

  if (relatedTransactions?.length) {
    return {
      route: "TransactionsTab",
      params: {}
    };
  }

  return {
    route: "FinancialSearch",
    params: {}
  };
}

function buildSuggestedAction(target, entity) {
  const route = target?.route;
  const labelByRoute = {
    TransactionDetails: "Abrir transação",
    FinancialProfile: entity ? `Investigar ${entity}` : "Abrir dossiê",
    FinancialSearch: "Buscar relacionados",
    RelationshipGraph: "Ver grafo",
    TransactionsTab: "Ver transações"
  };

  return {
    label: labelByRoute[route] || "Investigar",
    route,
    params: target?.params || {}
  };
}

function inferFindingCriteria({ finding, base, text }) {
  const topMerchant = findReferencedValue(text, base?.merchantAnalysis?.topMerchants || [], ["merchant", "name", "label"]);
  const topPerson = findReferencedValue(text, base?.peopleAnalysis?.topPeople || [], ["name", "label"]);
  const topCategory = findReferencedValue(text, base?.expenseAnalysis?.topCategories || [], ["category", "label", "name"]);
  const topMethod = findReferencedValue(text, base?.paymentMethodAnalysis?.byPaymentMethod || [], ["paymentMethod", "label"]);

  const entity = compactText(
    finding?.entity ||
      finding?.merchant ||
      finding?.counterpartyName ||
      topMerchant?.merchant ||
      topMerchant?.name ||
      topPerson?.name,
    100
  ) || null;
  const category = compactText(finding?.category || topCategory?.category || topCategory?.label, 80) || null;
  const paymentMethod = compactText(finding?.paymentMethod || finding?.method || topMethod?.paymentMethod || topMethod?.label, 80) || null;
  const transactionId = compactText(finding?.transactionId || finding?.transaction?.id, 40) || null;

  return {
    entity,
    entityType: entity ? resolveEntityType(entity, finding) : null,
    category,
    paymentMethod,
    transactionId
  };
}

function normalizeRelatedTransactionsFromFinding(finding = {}, transactionById = new Map()) {
  const rawItems = Array.isArray(finding.relatedTransactions) ? finding.relatedTransactions : [];
  const ids = [
    finding.transactionId,
    finding.transaction?.id,
    ...rawItems.map((item) => (typeof item === "string" ? item : item?.id))
  ].filter(Boolean);

  return ids
    .map((id) => transactionById.get(id))
    .filter(Boolean)
    .map(summarizeTransaction);
}

function buildTopLevelEvidence(base = {}, relatedTransactions = []) {
  const evidence = [
    compactEvidence("Transações analisadas", base?.executiveSummary?.totalTransactions),
    compactEvidence("Total movimentado", base?.executiveSummary?.totalMoved != null ? money(base.executiveSummary.totalMoved) : null),
    compactEvidence("Saldo líquido", base?.executiveSummary?.netAmount != null ? money(base.executiveSummary.netAmount) : null),
    compactEvidence("Categoria dominante", base?.executiveSummary?.dominantCategory?.category || base?.expenseAnalysis?.topCategories?.[0]?.category),
    compactEvidence("Estabelecimento dominante", base?.executiveSummary?.dominantMerchant?.merchant || base?.merchantAnalysis?.topMerchants?.[0]?.merchant),
    compactEvidence("Pessoa dominante", base?.executiveSummary?.dominantPerson?.name || base?.peopleAnalysis?.topPeople?.[0]?.name),
    compactEvidence("Método dominante", base?.paymentMethodAnalysis?.dominantMethod?.label || base?.paymentMethodAnalysis?.dominantMethod?.group),
    compactEvidence("Transações relacionadas", relatedTransactions.length || null)
  ].filter(Boolean);

  return uniqueBy(evidence, (item) => `${item.label}:${item.value}`);
}

export class ActionableInsightEnrichmentService {
  static enrichReading({ base = {}, insights = [], findings = [], transactions = [] }) {
    const transactionById = new Map(transactions.filter((item) => item?.id).map((item) => [item.id, item]));

    const enrichedInsights = insights.map((insight, index) => {
      const finding = findings[index] || insight || {};
      const text = [finding.title, finding.description, finding.message, insight.title, insight.description, insight.message]
        .filter(Boolean)
        .join(" ");
      const criteria = inferFindingCriteria({ finding, base, text });
      const validatedTransactionId = criteria.transactionId && transactionById.has(criteria.transactionId)
        ? criteria.transactionId
        : null;

      const explicitRelated = normalizeRelatedTransactionsFromFinding(finding, transactionById);
      const inferredRelated = transactions
        .filter((transaction) => transactionMatches(transaction, { ...criteria, transactionId: validatedTransactionId }))
        .sort((left, right) => Math.abs(toNumber(right.signedAmount ?? right.amount)) - Math.abs(toNumber(left.signedAmount ?? left.amount)))
        .slice(0, 6)
        .map(summarizeTransaction);
      const relatedTransactions = uniqueBy([...explicitRelated, ...inferredRelated], (item) => item.id).slice(0, 6);
      const strongTransactionId = validatedTransactionId || (relatedTransactions.length === 1 ? relatedTransactions[0].id : null);
      const navigationTarget = buildNavigationTarget({
        transactionId: strongTransactionId,
        entity: criteria.entity,
        entityType: criteria.entityType,
        category: criteria.category,
        paymentMethod: criteria.paymentMethod,
        relatedTransactions
      });

      const evidenceItems = [
        compactEvidence("Entidade", criteria.entity),
        compactEvidence("Categoria", criteria.category),
        compactEvidence("Método de pagamento", criteria.paymentMethod),
        compactEvidence("Transações relacionadas", relatedTransactions.length || null),
        compactEvidence("Maior transação", relatedTransactions[0] ? money(relatedTransactions[0].absoluteAmount) : null),
        ...relatedTransactions.slice(0, 3).map((transaction) => ({
          label: "Transação",
          value: transaction.description || transaction.id,
          transactionId: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          description: transaction.description
        }))
      ].filter(Boolean);

      return {
        ...insight,
        id: insight.id || finding.id || `insight-${index + 1}`,
        type: finding.type || insight.type || "financial_insight",
        severity: finding.severity || insight.severity || insight.level || "info",
        priority: finding.priority || insight.priority || null,
        entity: criteria.entity,
        entityType: criteria.entityType,
        category: criteria.category,
        paymentMethod: criteria.paymentMethod,
        transactionId: strongTransactionId,
        relatedTransactions,
        evidenceItems: uniqueBy(evidenceItems, (item) => `${item.label}:${item.value}:${item.transactionId || ""}`),
        suggestedAction: buildSuggestedAction(navigationTarget, criteria.entity),
        navigationTarget
      };
    });

    const topLevelRelatedTransactions = uniqueBy(
      enrichedInsights.flatMap((insight) => insight.relatedTransactions || []),
      (item) => item.id
    ).slice(0, 12);

    return {
      insights: enrichedInsights,
      relatedTransactions: topLevelRelatedTransactions,
      evidenceItems: buildTopLevelEvidence(base, topLevelRelatedTransactions)
    };
  }
}
