import { safeText } from '@utils/safeText';
import { formatEntityType } from '@utils/formatters';
import { toNumber } from '@utils/money';

const TYPE_VISUALS = {
  person: {
    color: '#B78CFF',
    soft: 'rgba(183, 140, 255, 0.16)',
    glow: 'rgba(183, 140, 255, 0.32)',
    gradient: ['rgba(183, 140, 255, 0.22)', 'rgba(77, 27, 125, 0.06)'],
    icon: 'person-outline',
    badge: 'Pessoa'
  },
  merchant: {
    color: '#8B5CF6',
    soft: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.28)',
    gradient: ['rgba(139, 92, 246, 0.2)', 'rgba(45, 20, 91, 0.06)'],
    icon: 'storefront-outline',
    badge: 'Empresa'
  },
  bank: {
    color: '#38BDF8',
    soft: 'rgba(56, 189, 248, 0.16)',
    glow: 'rgba(56, 189, 248, 0.28)',
    gradient: ['rgba(56, 189, 248, 0.2)', 'rgba(8, 47, 73, 0.06)'],
    icon: 'business-outline',
    badge: 'Banco'
  },
  paymentMethod: {
    color: '#22D3EE',
    soft: 'rgba(34, 211, 238, 0.16)',
    glow: 'rgba(34, 211, 238, 0.3)',
    gradient: ['rgba(34, 211, 238, 0.18)', 'rgba(8, 52, 58, 0.06)'],
    icon: 'flash-outline',
    badge: 'Método'
  },
  category: {
    color: '#FBBF24',
    soft: 'rgba(251, 191, 36, 0.16)',
    glow: 'rgba(251, 191, 36, 0.28)',
    gradient: ['rgba(251, 191, 36, 0.18)', 'rgba(69, 44, 3, 0.06)'],
    icon: 'pricetag-outline',
    badge: 'Categoria'
  }
};

const PERIOD_LABELS = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '1y': 'Último ano'
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizePercent(value) {
  const num = toNumber(value);
  if (!Number.isFinite(num)) return null;
  return Math.abs(num) <= 1 ? clamp(num * 100) : clamp(num);
}

function normalizeDate(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeLabel(value, fallback = 'Sinal') {
  return safeText(value, fallback).trim() || fallback;
}

function pickTransactionDate(item = {}) {
  return (
    item.date ||
    item.transactionDate ||
    item.createdAt ||
    item.timestamp ||
    item.occurredAt ||
    item.bookingDate ||
    null
  );
}

function pickTransactionCounterparty(item = {}) {
  return normalizeLabel(
    item.counterparty ||
      item.counterpartyName ||
      item.entity ||
      item.merchant ||
      item.merchantName ||
      item.name ||
      item.title ||
      item.description ||
      item.bankName,
    'Relacionamento'
  );
}

export function getProfileVisualIdentity(type) {
  const visual = TYPE_VISUALS[type];
  if (visual) return visual;
  return {
    color: '#94A3B8',
    soft: 'rgba(148, 163, 184, 0.16)',
    glow: 'rgba(148, 163, 184, 0.24)',
    gradient: ['rgba(148, 163, 184, 0.18)', 'rgba(30, 41, 59, 0.06)'],
    icon: 'help-circle-outline',
    badge: formatEntityType(type)
  };
}

export function formatActivePeriodLabel(activePeriod, periodRange) {
  if (periodRange?.first || periodRange?.last) {
    const first = safeText(periodRange.first, '').trim();
    const last = safeText(periodRange.last, '').trim();
    if (first && last) return `${first} → ${last}`;
    if (last) return `Até ${last}`;
  }
  return PERIOD_LABELS[activePeriod] || 'Janela ativa';
}

export function buildFinancialRelevanceScore({
  profile,
  profileSnapshot,
  confidence,
  relationship
}) {
  const signals = [];
  const rawScore = toNumber(profile?.score ?? profileSnapshot?.score);
  if (Number.isFinite(rawScore) && rawScore > 0) {
    signals.push(clamp(rawScore));
  }

  const confidenceScore = normalizePercent(confidence ?? profileSnapshot?.confidence);
  if (confidenceScore != null) signals.push(confidenceScore);

  const concentrationScore = normalizePercent(profileSnapshot?.concentration);
  if (concentrationScore != null) {
    signals.push(100 - Math.max(0, concentrationScore - 35) * 0.7);
  }

  const transactionCount = toNumber(profileSnapshot?.transactionCount ?? relationship?.count);
  if (Number.isFinite(transactionCount) && transactionCount > 0) {
    signals.push(clamp(transactionCount * 8, 18, 100));
  }

  const recurringCount = toNumber(profileSnapshot?.recurringCount);
  if (Number.isFinite(recurringCount) && recurringCount > 0 && transactionCount > 0) {
    signals.push(clamp((recurringCount / transactionCount) * 100));
  }

  const value = signals.length
    ? Math.round(signals.reduce((sum, item) => sum + item, 0) / signals.length)
    : 58;

  return {
    value,
    label:
      value >= 82
        ? 'Prioridade alta'
        : value >= 68
        ? 'Relevância forte'
        : value >= 52
        ? 'Relevância moderada'
        : 'Leitura inicial',
    caption:
      value >= 82
        ? 'Entidade com presença estrutural no fluxo.'
        : value >= 68
        ? 'Entidade com sinais consistentes no histórico.'
        : value >= 52
        ? 'Entidade útil para investigação adicional.'
        : 'Ainda há pouco contexto para uma leitura definitiva.'
  };
}

export function buildExecutiveSummary({
  entityName,
  moneyFlow,
  profileSnapshot,
  methods,
  relatedTransactions,
  activePeriod
}) {
  const txCount = toNumber(profileSnapshot?.transactionCount ?? relatedTransactions?.length);
  const recurringCount = toNumber(profileSnapshot?.recurringCount);
  const concentration = normalizePercent(profileSnapshot?.concentration);
  const topMethod = methods?.[0];
  const methodShare =
    topMethod && moneyFlow?.total ? clamp((toNumber(topMethod.value) / moneyFlow.total) * 100) : null;

  const headlineParts = [];
  if (recurringCount >= 3) {
    headlineParts.push(`Alta recorrência via ${normalizeLabel(topMethod?.label, 'fluxo principal')}`);
  } else if (moneyFlow?.dominant === 'entrada') {
    headlineParts.push('Predominância de entradas no período');
  } else if (moneyFlow?.dominant === 'saída') {
    headlineParts.push('Predominância de saídas no período');
  } else {
    headlineParts.push('Movimentação detectada no período ativo');
  }

  const contextParts = [];
  if (concentration != null && concentration >= 65) {
    contextParts.push(`Fluxo concentrado em ${Math.round(concentration)}% da relação`);
  }
  if (methodShare != null && methodShare >= 48) {
    contextParts.push(`${Math.round(methodShare)}% do volume passa por ${normalizeLabel(topMethod.label)}`);
  }
  if (txCount > 0) {
    contextParts.push(`${txCount} transações mapeadas em ${PERIOD_LABELS[activePeriod] || 'janela ativa'}`);
  }

  return {
    headline: `${headlineParts[0]}.`,
    body: `${contextParts.join(' · ') || `O dossiê de ${entityName} já possui sinais suficientes para leitura contextual.`}.`
  };
}

export function buildEntitySignals({
  profileSnapshot,
  relationship,
  methods,
  moneyFlow,
  confidence,
  relatedTransactions
}) {
  const signals = [];
  const txCount = toNumber(
    profileSnapshot?.transactionCount ?? relationship?.count ?? relatedTransactions?.length
  );
  const recurringCount = toNumber(profileSnapshot?.recurringCount);
  const concentration = normalizePercent(profileSnapshot?.concentration);
  const conf = normalizePercent(confidence ?? profileSnapshot?.confidence);
  const avgTicket = toNumber(relationship?.avg);
  const topMethod = methods?.[0];
  const topMethodRatio =
    topMethod && moneyFlow?.total ? clamp((toNumber(topMethod.value) / moneyFlow.total) * 100) : null;

  const timeline = buildTimelinePoints(relatedTransactions);
  const split = Math.max(1, Math.floor(timeline.length / 2));
  const leftHalf = timeline.slice(0, split);
  const rightHalf = timeline.slice(split);
  const leftVolume = leftHalf.reduce((sum, item) => sum + item.value, 0);
  const rightVolume = rightHalf.reduce((sum, item) => sum + item.value, 0);
  const peak = timeline.reduce((max, item) => Math.max(max, item.value), 0);
  const trough = timeline.reduce(
    (min, item) => (item.value > 0 ? Math.min(min, item.value) : min),
    peak || 0
  );

  if (recurringCount >= 3 || (txCount > 0 && recurringCount / txCount >= 0.35)) {
    signals.push({
      key: 'recurrence',
      icon: 'repeat-outline',
      tone: 'primary',
      title: 'Alta recorrência',
      description: `${recurringCount || txCount} movimentos recorrentes sustentam essa relação.`,
      score: clamp((recurringCount / Math.max(txCount, 1)) * 100 || 70)
    });
  }

  if (topMethod && topMethodRatio != null && /pix/i.test(topMethod.label) && topMethodRatio >= 45) {
    signals.push({
      key: 'pix',
      icon: 'flash-outline',
      tone: 'info',
      title: 'Dependência PIX',
      description: `${Math.round(topMethodRatio)}% do fluxo passa por ${normalizeLabel(topMethod.label)}.`,
      score: topMethodRatio
    });
  }

  if (concentration != null && concentration >= 60) {
    signals.push({
      key: 'concentration',
      icon: 'funnel-outline',
      tone: 'warning',
      title: 'Forte concentração',
      description: `${Math.round(concentration)}% do volume está concentrado neste vínculo.`,
      score: concentration
    });
  }

  if (peak > 0 && trough > 0 && peak / Math.max(trough, 1) >= 1.8 && timeline.length >= 4) {
    signals.push({
      key: 'seasonality',
      icon: 'pulse-outline',
      tone: 'accent',
      title: 'Fluxo sazonal',
      description: 'O padrão temporal mostra picos e vales claros ao longo da janela.',
      score: clamp(((peak - trough) / peak) * 100)
    });
  }

  if (Number.isFinite(avgTicket) && avgTicket >= 1800) {
    signals.push({
      key: 'ticket',
      icon: 'diamond-outline',
      tone: 'warning',
      title: 'Ticket elevado',
      description: 'O ticket médio desta relação está acima do comportamento comum.',
      score: clamp((avgTicket / 4500) * 100, 42, 100)
    });
  }

  if (rightVolume > leftVolume * 1.18 && rightVolume > 0) {
    signals.push({
      key: 'growth',
      icon: 'trending-up-outline',
      tone: 'info',
      title: 'Frequência crescente',
      description: 'A segunda metade da janela concentra mais atividade que a primeira.',
      score: clamp((rightVolume / Math.max(leftVolume, 1)) * 45)
    });
  }

  if ((conf != null && conf >= 72) || txCount >= 8) {
    signals.push({
      key: 'stability',
      icon: 'shield-checkmark-outline',
      tone: 'primary',
      title: 'Relação estável',
      description: 'Há contexto suficiente para tratar esta entidade como recorrente.',
      score: conf != null ? conf : clamp(txCount * 10)
    });
  }

  return signals.slice(0, 6);
}

export function buildTimelinePoints(relatedTransactions = []) {
  if (!Array.isArray(relatedTransactions) || !relatedTransactions.length) return [];

  const buckets = new Map();
  relatedTransactions.forEach((item) => {
    const parsed = normalizeDate(pickTransactionDate(item));
    if (!parsed) return;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const current = buckets.get(key) || {
      key,
      label: parsed.toLocaleDateString('pt-BR', { month: 'short' }),
      value: 0,
      amount: 0
    };
    current.value += 1;
    current.amount += Math.abs(toNumber(item.amount ?? item.value ?? 0));
    buckets.set(key, current);
  });

  const items = Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);
  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 1);

  return items.map((item) => ({
    ...item,
    ratio: clamp((item.value / maxValue) * 100)
  }));
}

export function buildTimelineNarrative(points = []) {
  if (!points.length) {
    return 'Ainda não há massa crítica suficiente para desenhar um comportamento temporal confiável.';
  }

  const peak = points.reduce((max, item) => (item.value > max.value ? item : max), points[0]);
  const latest = points[points.length - 1];
  const first = points[0];

  if (latest.value > first.value * 1.3) {
    return `A atividade acelera até ${normalizeLabel(latest.label).toLowerCase()}, sugerindo investigação recente mais intensa.`;
  }

  if (peak.key !== latest.key) {
    return `O pico de atividade aparece em ${normalizeLabel(peak.label).toLowerCase()}, seguido de normalização do fluxo.`;
  }

  return `A atividade se mantém relativamente estável, com destaque recente em ${normalizeLabel(latest.label).toLowerCase()}.`;
}

export function buildRelationshipSnapshot({
  relatedTransactions = [],
  methods = [],
  profileCategories = []
}) {
  const grouped = new Map();
  relatedTransactions.forEach((item) => {
    const label = pickTransactionCounterparty(item);
    const amount = Math.abs(toNumber(item.amount ?? item.value ?? 0));
    const current = grouped.get(label) || { label, value: 0, amount: 0 };
    current.value += 1;
    current.amount += amount;
    grouped.set(label, current);
  });

  const topConnections = Array.from(grouped.values())
    .sort((a, b) => b.amount - a.amount || b.value - a.value)
    .slice(0, 4);

  const topMethod = methods?.[0] ? normalizeLabel(methods[0].label) : null;
  const topCategory = profileCategories?.[0] ? normalizeLabel(profileCategories[0].label) : null;
  const dominantCluster = [topMethod, topCategory].filter(Boolean).join(' · ') || 'Fluxo distribuído';

  return {
    topConnections,
    dominantCluster,
    hasData: topConnections.length > 0
  };
}

export function buildContextSummary({ entitySignals = [], moneyFlow, relatedTransactions = [] }) {
  const parts = [];
  if (entitySignals.length) {
    parts.push(entitySignals.slice(0, 2).map((item) => item.title).join(' · '));
  }
  if (relatedTransactions.length) {
    parts.push(`${relatedTransactions.length} transações`);
  }
  if (moneyFlow?.dominant) {
    parts.push(`Fluxo de ${moneyFlow.dominant}`);
  }
  return parts.join(' · ');
}
