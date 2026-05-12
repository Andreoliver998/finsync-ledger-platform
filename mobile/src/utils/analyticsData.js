import { safeText } from './safeText';

export function normalizeProfile(payload = {}) {
  return {
    type: safeText(payload.type || payload.entityType, ''),
    q: safeText(payload.q || payload.query || payload.label || payload.name, ''),
    entityId: safeText(payload.entityId || payload.id, ''),
    source: safeText(payload.source || payload.origin, ''),
    transactionId: safeText(payload.transactionId, ''),
    summary: safeText(payload.summary || payload.description, ''),
    score:
      typeof payload.score === 'number'
        ? payload.score
        : typeof payload.relationshipScore === 'number'
        ? payload.relationshipScore
        : null,
    confidence:
      typeof payload.confidence === 'number'
        ? payload.confidence
        : typeof payload.confidenceScore === 'number'
        ? payload.confidenceScore
        : null,
    totalSent: Number(payload.totalSent ?? payload.totalOut ?? payload.sent ?? 0),
    totalReceived: Number(payload.totalReceived ?? payload.totalIn ?? payload.received ?? 0),
    transactionCount: Number(payload.transactionCount ?? payload.count ?? 0),
    recurringCount: Number(payload.recurringCount ?? payload.recurring?.length ?? 0),
    concentration:
      typeof payload.concentration === 'number'
        ? payload.concentration
        : typeof payload.concentrationScore === 'number'
        ? payload.concentrationScore
        : null,
    byMethod: Array.isArray(payload.byMethod) ? payload.byMethod : [],
    byCategory: Array.isArray(payload.byCategory) ? payload.byCategory : [],
    timeline:
      Array.isArray(payload.timeline) ? payload.timeline : Array.isArray(payload.monthlyFlow) ? payload.monthlyFlow : [],
    insights:
      Array.isArray(payload.highlights) ? payload.highlights : Array.isArray(payload.insights) ? payload.insights : [],
    relatedTransactions:
      Array.isArray(payload.relatedTransactions)
        ? payload.relatedTransactions
        : Array.isArray(payload.transactions)
        ? payload.transactions
        : []
  };
}

export function normalizeTransaction(payload = {}) {
  const amount = Number(payload.amount ?? payload.value ?? 0);
  return {
    id: safeText(payload.id, ''),
    amount,
    kind:
      safeText(payload.kind || payload.type, '').toUpperCase() ||
      (amount > 0 ? 'INCOME' : amount < 0 ? 'EXPENSE' : 'UNKNOWN'),
    date: payload.date || payload.createdAt || null,
    description: safeText(payload.description || payload.memo || payload.title, ''),
    merchant: safeText(payload.merchant || payload.counterparty || payload.name, ''),
    category: safeText(payload.category || payload.categoryName, ''),
    paymentMethod: safeText(payload.paymentMethod || payload.method, ''),
    bank: safeText(payload.bank || payload.institution, ''),
    source: safeText(payload.source || payload.origin, '')
  };
}

export function normalizeInsight(payload = {}) {
  return {
    id: safeText(payload.id, ''),
    title: safeText(payload.title || payload.name || payload.label, 'Insight'),
    description: safeText(payload.description || payload.summary || payload.text, ''),
    tone: safeText(payload.tone || payload.severity || payload.level, 'primary'),
    icon: safeText(payload.icon, 'sparkles'),
    entityId: safeText(payload.entityId || payload.id, ''),
    transactionId: safeText(payload.transactionId, ''),
    source: safeText(payload.source || payload.origin, '')
  };
}
