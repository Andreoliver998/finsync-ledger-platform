import { normalizeTransaction } from '@utils/analyticsData';
import { buildStableKey, uniqueByStableKey } from '@utils/buildStableKey';
import { safeText } from '@utils/safeText';
import { toNumber } from '@utils/money';

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstFilled(...values) {
  return values.find((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

function normalizeConfidence(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizePeriod(payload) {
  const raw =
    firstFilled(
      payload.period,
      payload.analysisPeriod,
      payload.executiveSummary?.period,
      payload.dateRange,
      payload.range
    ) || {};
  const period = asObject(raw);
  const start =
    period.start ||
    period.startDate ||
    period.from ||
    payload.startDate ||
    payload.filters?.startDate ||
    payload.query?.startDate ||
    null;
  const end =
    period.end ||
    period.endDate ||
    period.to ||
    payload.endDate ||
    payload.filters?.endDate ||
    payload.query?.endDate ||
    null;
  const label = safeText(period.label || period.name || payload.periodLabel, '').trim();
  const preset = safeText(period.preset || period.key || payload.activePeriod, '').trim();

  return {
    start,
    end,
    label,
    preset,
    hasPeriod: Boolean(start || end || label || preset)
  };
}

function normalizeEntity(item = {}, fallbackType = 'merchant') {
  const entity = asObject(item);
  const name = safeText(
    entity.name ||
      entity.label ||
      entity.entity ||
      entity.merchant ||
      entity.counterpartyName ||
      entity.category ||
      entity.paymentMethod,
    ''
  ).trim();
  if (!name) return null;

  return {
    id: safeText(entity.id, '').trim(),
    name,
    type: safeText(entity.type || entity.entityType, fallbackType).trim() || fallbackType,
    amount: toNumber(entity.amount ?? entity.total ?? entity.totalAmount ?? entity.value ?? entity.totalSpent),
    count: Number(entity.count ?? entity.transactions ?? entity.transactionCount ?? entity.frequency ?? 0) || null,
    dominantMethod: safeText(entity.dominantMethod || entity.paymentMethod || entity.method, '').trim(),
    dominantCategory: safeText(entity.dominantCategory || entity.category, '').trim(),
    source: safeText(entity.source || entity.origin || entity.provider, '').trim(),
    transactionId: safeText(entity.transactionId || entity.idTransaction, '').trim()
  };
}

function normalizeTransactionList(value) {
  return asArray(value)
    .map((transaction) => normalizeTransaction(transaction))
    .filter((transaction) => transaction.id || transaction.description || transaction.amount);
}

const ALLOWED_NAVIGATION_ROUTES = new Set([
  'FinancialProfile',
  'FinancialSearch',
  'TransactionDetails',
  'RelationshipGraph',
  'TransactionsTab'
]);

function normalizeNavigationTarget(value) {
  const target = asObject(value);
  const route = safeText(target.route, '').trim();
  if (!ALLOWED_NAVIGATION_ROUTES.has(route)) return null;
  return {
    route,
    params: asObject(target.params)
  };
}

function normalizeSuggestedAction(value, navigationTarget) {
  const action = asObject(value);
  const route = safeText(action.route, '').trim();
  const safeRoute = ALLOWED_NAVIGATION_ROUTES.has(route) ? route : navigationTarget?.route || '';
  const label = safeText(action.label || action.title || action.text, '').trim();
  if (!label && !safeRoute) return null;
  return {
    label,
    route: safeRoute,
    params: Object.keys(asObject(action.params)).length ? asObject(action.params) : navigationTarget?.params || {}
  };
}

function normalizeEvidenceItems(value) {
  return asArray(value)
    .map((item, index) => {
      if (typeof item === 'string') {
        const text = safeText(item, '').trim();
        return text ? { type: 'evidence', label: 'Evidência', value: text } : null;
      }
      const evidence = asObject(item);
      const label = safeText(evidence.label || evidence.type || evidence.title || evidence.name, 'Evidência').trim();
      const value = safeText(
        firstFilled(evidence.value, evidence.amount, evidence.description, evidence.text, evidence.date),
        ''
      ).trim();
      if (!label && !value) return null;
      return {
        id: safeText(evidence.id, '').trim() || buildStableKey('evidence', label, value, index + 1),
        type: safeText(evidence.type || evidence.kind, 'evidence').trim(),
        label,
        value,
        transactionId: safeText(evidence.transactionId || evidence.transaction?.id, '').trim(),
        date: evidence.date || evidence.transactionDate || null,
        amount: toNumber(evidence.amount ?? evidence.valueAmount),
        description: safeText(evidence.description || evidence.text || evidence.transaction?.description, '').trim()
      };
    })
    .filter(Boolean);
}

function normalizeInsight(item = {}, index = 0, fallbackEvidence = {}) {
  const insight = typeof item === 'string' ? { title: item } : asObject(item);
  const relatedTransactions = normalizeTransactionList(
    firstFilled(
      insight.relatedTransactions,
      insight.transactions,
      insight.related,
      insight.evidence?.transactions
    )
  );
  const entity = firstFilled(
    insight.entity,
    insight.relatedEntity,
    insight.merchant,
    insight.counterpartyName,
    insight.name
  );
  const entityName = safeText(entity, '').trim();
  const category = safeText(
    insight.category || insight.dominantCategory || insight.evidence?.category || fallbackEvidence.category,
    ''
  ).trim();
  const paymentMethod = safeText(
    insight.paymentMethod || insight.method || insight.evidence?.paymentMethod || fallbackEvidence.paymentMethod,
    ''
  ).trim();
  const period = normalizePeriod({ ...fallbackEvidence, ...insight });
  const amount = toNumber(insight.amount ?? insight.value ?? insight.total ?? insight.relatedAmount);
  const navigationTarget = normalizeNavigationTarget(insight.navigationTarget);
  const suggestedAction = normalizeSuggestedAction(insight.suggestedAction, navigationTarget);
  const evidenceItems = normalizeEvidenceItems(insight.evidenceItems);
  const transactionId = safeText(
    insight.transactionId ||
      insight.transaction?.id ||
      insight.evidence?.transactionId ||
      (relatedTransactions.length === 1 ? relatedTransactions[0]?.id : ''),
    ''
  ).trim();

  return {
    id: safeText(insight.id, '').trim() || buildStableKey('insight', insight.title, insight.description, index + 1),
    title: safeText(insight.title || insight.name || insight.label, 'Insight'),
    description: safeText(insight.description || insight.summary || insight.text || insight.message, ''),
    severity: safeText(insight.severity || insight.tone || insight.level, 'info'),
    type: safeText(insight.type || insight.kind, '').trim(),
    confidence: normalizeConfidence(insight.confidence ?? insight.score),
    period,
    entity: entityName,
    entityType: safeText(insight.entityType || fallbackEvidence.entityType, '').trim(),
    category,
    paymentMethod,
    source: safeText(insight.source || insight.origin || insight.provider || fallbackEvidence.source, '').trim(),
    transactionId,
    relatedTransactions,
    relatedTransactionsCount:
      Number(insight.relatedTransactionsCount ?? insight.transactionCount ?? relatedTransactions.length) || relatedTransactions.length,
    evidenceItems,
    suggestedAction,
    navigationTarget,
    amount,
    raw: insight
  };
}

function normalizeSourceLabel(value) {
  const source = safeText(value, '').trim();
  const upper = source.toUpperCase();
  if (!upper) return '';
  if (upper.includes('ONEDRIVE')) return 'OneDrive';
  if (upper.includes('OPEN_FINANCE') || upper.includes('PLUGGY')) return 'Open Finance';
  if (upper.includes('CSV')) return 'CSV';
  if (upper.includes('LEDGER')) return 'Ledger';
  return source;
}

function pickTopCategories(payload, expenseAnalysis) {
  return asArray(
    firstFilled(expenseAnalysis.topCategories, expenseAnalysis.categories, payload.topCategories, payload.categories)
  )
    .map((item) => normalizeEntity(item, 'category'))
    .filter(Boolean);
}

function pickPaymentMethods(payload, paymentMethodAnalysis) {
  return asArray(
    firstFilled(
      paymentMethodAnalysis.methods,
      paymentMethodAnalysis.breakdown,
      paymentMethodAnalysis.byPaymentMethod,
      payload.paymentMethods
    )
  )
    .map((item) => normalizeEntity(item, 'paymentMethod'))
    .filter(Boolean);
}

function buildEvidenceItems({ period, topMerchants, topPeople, topCategories, paymentMethods, relatedTransactions, source }) {
  const evidence = [];
  if (period?.hasPeriod) {
    evidence.push({ type: 'period', label: 'Período analisado', value: period.label || period.preset || 'intervalo informado' });
  }
  topMerchants.slice(0, 3).forEach((item) => evidence.push({ type: 'entity', label: 'Estabelecimento', value: item.name }));
  topPeople.slice(0, 3).forEach((item) => evidence.push({ type: 'entity', label: 'Pessoa relacionada', value: item.name }));
  topCategories.slice(0, 3).forEach((item) => evidence.push({ type: 'category', label: 'Categoria', value: item.name }));
  paymentMethods.slice(0, 3).forEach((item) => evidence.push({ type: 'method', label: 'Método', value: item.name }));
  if (relatedTransactions.length) {
    evidence.push({ type: 'transaction', label: 'Transações relacionadas', value: String(relatedTransactions.length) });
  }
  if (source) {
    evidence.push({ type: 'source', label: 'Origem', value: source });
  }
  return uniqueByStableKey(evidence, (item) => [item.type, item.label, item.value]);
}

export function normalizeIntelligentReading(payload) {
  const data = asObject(payload);
  const executiveSummary = asObject(data.executiveSummary);
  const moneyFlow = asObject(firstFilled(data.moneyFlow, data.cashFlow));
  const expenseAnalysis = asObject(firstFilled(data.expenseAnalysis, data.expenses));
  const merchantAnalysis = asObject(firstFilled(data.merchantAnalysis, data.merchants));
  const peopleAnalysis = asObject(firstFilled(data.peopleAnalysis, data.people));
  const pixAnalysis = asObject(firstFilled(data.pixAnalysis, data.pix));
  const paymentMethodAnalysis = asObject(firstFilled(data.paymentMethodAnalysis, data.paymentMethods));
  const recurrenceAnalysis = asObject(firstFilled(data.recurrenceAnalysis, data.recurrence));
  const period = normalizePeriod(data);

  const topMerchants = asArray(
    firstFilled(merchantAnalysis.topMerchants, merchantAnalysis.merchants, data.topMerchants)
  )
    .map((item) => normalizeEntity(item, 'merchant'))
    .filter(Boolean);
  const topPeople = asArray(
    firstFilled(peopleAnalysis.people, peopleAnalysis.topPeople, peopleAnalysis.top, pixAnalysis.people, data.topPeople)
  )
    .map((item) => normalizeEntity(item, 'person'))
    .filter(Boolean);
  const topCategories = pickTopCategories(data, expenseAnalysis);
  const paymentMethods = pickPaymentMethods(data, paymentMethodAnalysis);
  const relatedTransactions = normalizeTransactionList(
    firstFilled(data.relatedTransactions, data.transactions, data.related)
  );
  const backendEvidenceItems = normalizeEvidenceItems(data.evidenceItems);
  const source = normalizeSourceLabel(data.source || data.origin || data.provider || data.aiAnalysis?.provider || 'Ledger');
  const fallbackEvidence = {
    ...period,
    category: topCategories[0]?.name,
    paymentMethod: paymentMethods[0]?.name,
    source,
    entityType: topMerchants[0] ? 'merchant' : topPeople[0] ? 'person' : undefined
  };
  const rawInsights = [
    ...asArray(data.mainFindings),
    ...asArray(data.insights),
    ...asArray(data.cards)
  ];
  const insights = uniqueByStableKey(
    rawInsights.map((item, index) => normalizeInsight(item, index, fallbackEvidence)),
    (item) => [item.id, item.title, item.description]
  );

  return {
    headline: safeText(executiveSummary.headline || data.headline || data.title || executiveSummary.narrative, 'Leitura Inteligente'),
    narrative: safeText(data.narrative || data.analysis || executiveSummary.aiNarrative || executiveSummary.narrative || data.summary, ''),
    summary: safeText(data.summary || executiveSummary.narrative || executiveSummary.headline, ''),
    confidence: normalizeConfidence(data.confidence?.averageConfidence ?? data.confidence ?? data.aiAnalysis?.confidence),
    period,
    totals: {
      income: toNumber(moneyFlow.income ?? moneyFlow.totalIncome ?? data.totals?.income),
      expense: toNumber(moneyFlow.expense ?? moneyFlow.totalExpense ?? moneyFlow.totalExpenses ?? data.totals?.expense),
      balance: toNumber(moneyFlow.balance ?? moneyFlow.net ?? moneyFlow.netAmount ?? data.totals?.balance),
      savingsRate: toNumber(moneyFlow.savingsRate ?? data.totals?.savingsRate)
    },
    moneyFlow,
    incomeAnalysis: asObject(firstFilled(data.incomeAnalysis, data.income)),
    expenseAnalysis,
    pixAnalysis,
    merchantAnalysis,
    peopleAnalysis,
    paymentMethodAnalysis,
    recurrenceAnalysis,
    topMerchants,
    topPeople,
    topCategories,
    paymentMethods,
    insights,
    alerts: asArray(data.alerts),
    recommendations: asArray(firstFilled(data.recommendations, data.suggestions)),
    suggestedQuestions: asArray(firstFilled(data.suggestedQuestions, data.questions))
      .map((question) => safeText(question, '').trim())
      .filter(Boolean),
    relatedTransactions,
    evidenceItems: uniqueByStableKey(
      [
        ...backendEvidenceItems,
        ...buildEvidenceItems({
          period,
          topMerchants,
          topPeople,
          topCategories,
          paymentMethods,
          relatedTransactions,
          source
        })
      ],
      (item) => [item.id, item.type, item.label, item.value]
    ),
    source,
    aiAnalysis: asObject(data.aiAnalysis)
  };
}

export function getIntelligentReadingPayloadKeySummary(data) {
  const payload = asObject(data);
  return {
    root: Object.keys(payload),
    executiveSummary: Object.keys(asObject(payload.executiveSummary)),
    moneyFlow: Object.keys(asObject(payload.moneyFlow)),
    expenseAnalysis: Object.keys(asObject(payload.expenseAnalysis)),
    merchantAnalysis: Object.keys(asObject(payload.merchantAnalysis)),
    peopleAnalysis: Object.keys(asObject(payload.peopleAnalysis)),
    pixAnalysis: Object.keys(asObject(payload.pixAnalysis)),
    recurrenceAnalysis: Object.keys(asObject(payload.recurrenceAnalysis)),
    alerts: asArray(payload.alerts).length ? Object.keys(asObject(payload.alerts[0])) : [],
    recommendations: asArray(payload.recommendations).length ? Object.keys(asObject(payload.recommendations[0])) : [],
    suggestedQuestions: asArray(payload.suggestedQuestions).length ? ['string'] : [],
    insights: asArray(payload.insights).length ? Object.keys(asObject(payload.insights[0])) : [],
    relatedTransactions: asArray(payload.relatedTransactions).length ? Object.keys(asObject(payload.relatedTransactions[0])) : [],
    evidenceItems: asArray(payload.evidenceItems).length ? Object.keys(asObject(payload.evidenceItems[0])) : []
  };
}
