import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { InvestigationBreadcrumbs } from '@components/InvestigationBreadcrumbs';
import { InvestigationHeader } from '@components/InvestigationHeader';
import { InsightCard } from '@components/InsightCard';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { SectionHeader } from '@components/SectionHeader';
import { SmartErrorState } from '@components/SmartErrorState';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import {
  openFinancialProfile,
  openFinancialSearch,
  openInsightDetails,
  openRelationshipGraph
} from '@utils/analyticsNavigation';
import { buildStableKey } from '@utils/buildStableKey';
import { formatBRL, formatBRLCompact, toNumber } from '@utils/money';
import { safeText } from '@utils/safeText';
import { formatPercent, getMethodIcon } from '@utils/formatters';
import { formatDate } from '@utils/date';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { fetchIntelligentReading } from '../api/intelligentReadingApi';
import {
  getIntelligentReadingPayloadKeySummary,
  normalizeIntelligentReading
} from '../utils/normalizeIntelligentReading';

function hasAnyContent(r) {
  if (!r) return false;
  return !!(
    r.narrative ||
    r.period?.hasPeriod ||
    r.moneyFlow ||
    r.topMerchants.length ||
    r.topPeople.length ||
    r.topCategories.length ||
    r.paymentMethods.length ||
    r.alerts.length ||
    r.recommendations.length ||
    r.suggestedQuestions.length ||
    r.insights.length ||
    r.evidenceItems.length
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function ConfidenceBadge({ value }) {
  if (value == null) return null;
  const pct = Math.round(value <= 1 ? value * 100 : value);
  const color =
    pct >= 80 ? theme.colors.success : pct >= 50 ? theme.colors.warning : theme.colors.muted;
  return (
    <View style={localStyles.confBadge}>
      <Ionicons name="shield-checkmark-outline" size={12} color={color} />
      <Text style={[localStyles.confText, { color }]}>{pct}% confiança</Text>
    </View>
  );
}

function MoneyFlowBar({ income, expense }) {
  const inc = Math.abs(toNumber(income));
  const exp = Math.abs(toNumber(expense));
  const total = inc + exp;
  if (total === 0) return null;

  return (
    <View style={localStyles.flowBarContainer}>
      <View style={localStyles.flowBarTrack}>
        <View
          style={[
            localStyles.flowBarSegment,
            { flex: inc / total, backgroundColor: theme.colors.success }
          ]}
        />
        <View style={{ width: 2 }} />
        <View
          style={[
            localStyles.flowBarSegment,
            { flex: exp / total, backgroundColor: theme.colors.danger }
          ]}
        />
      </View>
      <View style={localStyles.flowBarLegend}>
        <View style={localStyles.flowBarLegendItem}>
          <View style={[localStyles.flowDot, { backgroundColor: theme.colors.success }]} />
          <Text style={localStyles.flowLegendLabel}>Entrada</Text>
          <Text style={localStyles.flowLegendValue}>{formatBRLCompact(inc)}</Text>
        </View>
        <View style={localStyles.flowBarLegendItem}>
          <View style={[localStyles.flowDot, { backgroundColor: theme.colors.danger }]} />
          <Text style={localStyles.flowLegendLabel}>Saída</Text>
          <Text style={localStyles.flowLegendValue}>{formatBRLCompact(exp)}</Text>
        </View>
      </View>
    </View>
  );
}

function AlertItem({ alert }) {
  const severity = safeText(alert.severity || alert.level, 'info');
  const palette =
    severity === 'danger' || severity === 'critical'
      ? { color: theme.colors.danger, bg: theme.colors.dangerSoft, icon: 'warning-outline' }
      : severity === 'warning'
      ? { color: theme.colors.warning, bg: theme.colors.warningSoft, icon: 'alert-circle-outline' }
      : { color: theme.colors.secondary, bg: theme.colors.secondarySoft, icon: 'information-circle-outline' };

  const title = safeText(alert.title);
  const description = safeText(alert.description || alert.text || alert.message);
  if (!title && !description) return null;

  return (
    <View style={localStyles.alertRow}>
      <View style={[localStyles.alertIconWrap, { backgroundColor: palette.bg }]}>
        <Ionicons name={safeText(alert.icon, palette.icon)} size={16} color={palette.color} />
      </View>
      <View style={localStyles.alertContent}>
        {title ? <Text style={localStyles.alertTitle}>{title}</Text> : null}
        {description ? (
          <Text style={localStyles.alertDescription} numberOfLines={4}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EntityRankRow({ item, index, color }) {
  const name = safeText(item.name || item.label || item.entity, '—');
  const amount = toNumber(item.amount || item.total || item.value || 0);
  const count = item.count || item.transactions || null;

  return (
    <View style={localStyles.rankRow}>
      <View
        style={[
          localStyles.rankBadge,
          { backgroundColor: index === 0 ? color + '28' : theme.colors.surface }
        ]}
      >
        <Text style={[localStyles.rankNum, index === 0 && { color }]}>#{index + 1}</Text>
      </View>
      <Text style={localStyles.rankName} numberOfLines={1}>
        {name}
      </Text>
      <View style={localStyles.rankRight}>
        {count != null ? <Text style={localStyles.rankCount}>{count}x</Text> : null}
        <Text style={[localStyles.rankAmount, { color }]}>{formatBRLCompact(amount)}</Text>
      </View>
    </View>
  );
}

function MethodRow({ item, index }) {
  const method = safeText(item.method || item.name || item.label, '—');
  const amount = toNumber(item.amount || item.total || item.value || 0);
  const count = item.count || item.transactions || null;

  return (
    <View style={localStyles.methodRow}>
      <View style={localStyles.methodIconWrap}>
        <Ionicons name={getMethodIcon(method)} size={16} color={theme.colors.action} />
      </View>
      <Text style={localStyles.methodName} numberOfLines={1}>
        {method}
      </Text>
      <View style={localStyles.rankRight}>
        {count != null ? <Text style={localStyles.rankCount}>{count}x</Text> : null}
        <Text style={localStyles.methodAmount}>{formatBRLCompact(amount)}</Text>
      </View>
    </View>
  );
}

function ShortId({ value }) {
  const id = safeText(value, '').trim();
  if (!id) return null;
  const shortId = id.length > 10 ? `${id.slice(0, 4)}...${id.slice(-3)}` : id;
  return <Text style={localStyles.shortId}>{shortId}</Text>;
}

function InfoChip({ icon, label, value }) {
  const text = safeText(value, '').trim();
  if (!text) return null;
  return (
    <View style={localStyles.infoChip}>
      <Ionicons name={icon} size={12} color={theme.colors.muted} />
      <Text style={localStyles.infoChipLabel}>{label}</Text>
      <Text style={localStyles.infoChipValue} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function formatPeriodLabel(period) {
  if (!period?.hasPeriod) return 'Período não informado pela análise.';
  if (period.start || period.end) {
    return `${period.start ? formatDate(period.start) : 'início'} → ${
      period.end ? formatDate(period.end) : 'fim'
    }`;
  }
  return period.label || period.preset || 'Período informado pela análise';
}

function PeriodPanel({ period }) {
  return (
    <AppCard variant="outline" style={localStyles.periodPanel}>
      <View style={localStyles.periodIcon}>
        <Ionicons name="calendar-outline" size={16} color={theme.colors.action} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={localStyles.periodLabel}>Período analisado</Text>
        <Text style={localStyles.periodValue}>{formatPeriodLabel(period)}</Text>
      </View>
    </AppCard>
  );
}

function EvidenceSection({ evidenceItems = [], relatedTransactions = [], transactionId, onOpenTransaction }) {
  const hasEvidence = evidenceItems.length || relatedTransactions.length || transactionId;
  if (!hasEvidence) return null;
  return (
    <View style={localStyles.evidenceBox}>
      <Text style={localStyles.evidenceTitle}>Evidências do insight</Text>
      {evidenceItems.length ? (
        <View style={localStyles.evidenceChips}>
          {evidenceItems.map((item, index) => (
            <InfoChip
              key={buildStableKey(item.type, item.label, item.value, index + 1)}
              icon={
                item.type === 'period'
                  ? 'calendar-outline'
                  : item.type === 'category'
                  ? 'pricetag-outline'
                  : item.type === 'method'
                  ? 'card-outline'
                  : item.type === 'source'
                  ? 'layers-outline'
                  : 'ellipse-outline'
              }
              label={safeText(item.label, 'Evidência')}
              value={item.value}
            />
          ))}
        </View>
      ) : null}
      {transactionId ? (
        <View style={localStyles.transactionEvidenceRow}>
          <View style={localStyles.transactionEvidenceText}>
            <Text style={localStyles.evidenceLabel}>ID de transação</Text>
            <ShortId value={transactionId} />
          </View>
          <AppButton
            label="Abrir transação"
            size="sm"
            variant="ghost"
            fullWidth={false}
            onPress={onOpenTransaction}
          />
        </View>
      ) : null}
      {relatedTransactions.length ? (
        <View style={localStyles.relatedMiniList}>
          {relatedTransactions.slice(0, 3).map((transaction, index) => (
            <View
              key={buildStableKey(
                transaction.id,
                transaction.date,
                transaction.description,
                transaction.amount,
                index + 1
              )}
              style={localStyles.relatedMiniRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={localStyles.relatedMiniTitle} numberOfLines={1}>
                  {safeText(transaction.description || transaction.merchant, 'Transação relacionada')}
                </Text>
                <Text style={localStyles.relatedMiniSub} numberOfLines={1}>
                  {[transaction.category, transaction.paymentMethod, transaction.source]
                    .map((item) => safeText(item, '').trim())
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={localStyles.relatedMiniAmount}>{formatBRLCompact(transaction.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function InsightInvestigationCard({
  insight,
  globalEvidence,
  primaryActionLabel,
  primaryActionRoute,
  onPrimaryAction,
  onOpenEntity,
  onSearchRelated,
  onOpenTransaction,
  onOpenGraph,
  onOpenTransactions,
  onOpenDetails
}) {
  const title = safeText(insight.title, 'Insight');
  const description = safeText(insight.description, '');
  const severity = safeText(insight.severity, 'info');
  const confidence = insight.confidence == null ? null : Math.round(insight.confidence <= 1 ? insight.confidence * 100 : insight.confidence);
  const chips = [
    { icon: 'alert-circle-outline', label: 'Severidade', value: severity },
    confidence != null ? { icon: 'shield-checkmark-outline', label: 'Confiança', value: `${confidence}%` } : null,
    { icon: 'calendar-outline', label: 'Período', value: insight.period?.hasPeriod ? formatPeriodLabel(insight.period) : '' },
    { icon: 'person-circle-outline', label: 'Entidade', value: insight.entity },
    { icon: 'pricetag-outline', label: 'Categoria', value: insight.category },
    { icon: 'card-outline', label: 'Método', value: insight.paymentMethod },
    { icon: 'layers-outline', label: 'Origem', value: insight.source },
    insight.relatedTransactionsCount
      ? { icon: 'git-branch-outline', label: 'Relacionadas', value: `${insight.relatedTransactionsCount}` }
      : null,
    insight.amount ? { icon: 'cash-outline', label: 'Valor', value: formatBRLCompact(insight.amount) } : null
  ].filter(Boolean);

  const insightEvidence = Array.isArray(insight.evidenceItems) ? insight.evidenceItems : [];
  const relatedTransactions = Array.isArray(insight.relatedTransactions) ? insight.relatedTransactions : [];
  const strongTransactionId =
    safeText(insight.transactionId, '').trim() ||
    (relatedTransactions.length === 1 ? safeText(relatedTransactions[0]?.id, '').trim() : '');
  const evidenceItems = [
    ...insightEvidence,
    ...chips.map((chip) => ({ type: chip.label, label: chip.label, value: chip.value })),
    ...(insightEvidence.length ? [] : globalEvidence)
  ];
  const safePrimaryLabel = safeText(primaryActionLabel, '').trim();

  return (
    <AppCard variant="elevated" style={localStyles.insightInvestigationCard}>
      <View style={localStyles.insightHeader}>
        <View style={localStyles.insightIconWrap}>
          <Ionicons name="sparkles-outline" size={17} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={localStyles.insightTitle} numberOfLines={2}>
            {title}
          </Text>
          {description ? (
            <Text style={localStyles.insightDescription} numberOfLines={5}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {chips.length ? (
        <View style={localStyles.insightChips}>
          {chips.map((chip, index) => (
            <InfoChip
              key={buildStableKey(chip.label, chip.value, index + 1)}
              icon={chip.icon}
              label={chip.label}
              value={chip.value}
            />
          ))}
        </View>
      ) : null}

      <EvidenceSection
        evidenceItems={evidenceItems}
        relatedTransactions={relatedTransactions}
        transactionId={strongTransactionId}
        onOpenTransaction={() => onOpenTransaction(strongTransactionId)}
      />

      <View style={localStyles.contextActions}>
        {safePrimaryLabel && onPrimaryAction ? (
          <AppButton label={safePrimaryLabel} size="sm" variant="ghost" fullWidth={false} onPress={onPrimaryAction} />
        ) : null}
        {insight.entity && primaryActionRoute !== 'FinancialProfile' ? (
          <AppButton label="Abrir entidade" size="sm" variant="ghost" fullWidth={false} onPress={onOpenEntity} />
        ) : null}
        {(insight.entity || title) && primaryActionRoute !== 'FinancialSearch' ? (
          <AppButton label="Buscar relacionados" size="sm" variant="ghost" fullWidth={false} onPress={onSearchRelated} />
        ) : null}
        {insight.entity && primaryActionRoute !== 'RelationshipGraph' ? (
          <AppButton label="Ver grafo" size="sm" variant="ghost" fullWidth={false} onPress={onOpenGraph} />
        ) : null}
        {relatedTransactions.length > 1 && primaryActionRoute !== 'TransactionsTab' ? (
          <AppButton label="Ver transações" size="sm" variant="ghost" fullWidth={false} onPress={onOpenTransactions} />
        ) : null}
        <Text onPress={onOpenDetails} style={localStyles.detailCta}>
          Ver detalhe →
        </Text>
      </View>
    </AppCard>
  );
}

function MerchantRow({ item, index, onOpen }) {
  return (
    <View style={localStyles.merchantRow}>
      <View style={localStyles.rankBadge}>
        <Text style={localStyles.rankNum}>#{index + 1}</Text>
      </View>
      <View style={localStyles.merchantContent}>
        <Text style={localStyles.rankName} numberOfLines={1}>
          {safeText(item.name, 'Estabelecimento')}
        </Text>
        <View style={localStyles.merchantMetaRow}>
          {item.count ? <Text style={localStyles.rankCount}>{item.count} transações</Text> : null}
          {item.dominantMethod ? <Text style={localStyles.rankCount}>{item.dominantMethod}</Text> : null}
          {item.dominantCategory ? <Text style={localStyles.rankCount}>{item.dominantCategory}</Text> : null}
        </View>
      </View>
      <View style={localStyles.merchantRight}>
        <Text style={[localStyles.rankAmount, { color: theme.colors.secondary }]}>
          {formatBRLCompact(item.amount)}
        </Text>
        <Text onPress={onOpen} style={localStyles.rowCta}>
          Dossiê
        </Text>
      </View>
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function ReadingEmptyState({ navigation }) {
  return (
    <AppScreen padded scroll>
      <View style={localStyles.hero}>
        <Text style={localStyles.label}>Leitura Inteligente</Text>
        <Text style={localStyles.title}>Ainda sem análise</Text>
        <Text style={localStyles.summary}>
          A análise inteligente é gerada a partir do seu histórico financeiro. Importe extratos ou
          aguarde novas transações para ativar esta funcionalidade.
        </Text>
      </View>

      <AppCard variant="elevated" style={localStyles.emptyCard}>
        <View style={localStyles.emptyIconWrap}>
          <Ionicons name="bulb-outline" size={32} color={theme.colors.primary} />
        </View>
        <Text style={localStyles.emptyCardTitle}>Como ativar a leitura?</Text>
        <Text style={localStyles.emptyCardBody}>
          Importe seu extrato bancário no Dashboard ou conecte via Open Finance. Com dados
          suficientes, a IA analisa padrões automaticamente.
        </Text>
      </AppCard>

      <SectionHeader title="Explore enquanto isso" subtitle="Ferramentas disponíveis agora" />

      <View style={localStyles.emptyActions}>
        <Pressable
          onPress={() => navigation?.getParent()?.navigate('TransactionsTab')}
          android_ripple={{ color: theme.colors.primarySoft }}
          style={({ pressed }) => [localStyles.emptyActionCard, pressed && { opacity: 0.85 }]}
        >
          <View style={[localStyles.emptyActionIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="list-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={localStyles.emptyActionText}>
            <Text style={localStyles.emptyActionTitle}>Ver Transações</Text>
            <Text style={localStyles.emptyActionSub}>Explore seu histórico completo</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
        </Pressable>

        <Pressable
          onPress={() => openFinancialSearch(navigation)}
          android_ripple={{ color: theme.colors.secondarySoft }}
          style={({ pressed }) => [localStyles.emptyActionCard, pressed && { opacity: 0.85 }]}
        >
          <View style={[localStyles.emptyActionIcon, { backgroundColor: theme.colors.secondarySoft }]}>
            <Ionicons name="search-outline" size={22} color={theme.colors.secondary} />
          </View>
          <View style={localStyles.emptyActionText}>
            <Text style={localStyles.emptyActionTitle}>Busca Inteligente</Text>
            <Text style={localStyles.emptyActionSub}>Investigue pessoas, bancos e gastos</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
        </Pressable>

        <Pressable
          onPress={() => navigation?.getParent()?.navigate('DashboardTab')}
          android_ripple={{ color: theme.colors.accentSoft }}
          style={({ pressed }) => [localStyles.emptyActionCard, pressed && { opacity: 0.85 }]}
        >
          <View style={[localStyles.emptyActionIcon, { backgroundColor: theme.colors.accentSoft }]}>
            <Ionicons name="pie-chart-outline" size={22} color={theme.colors.accent} />
          </View>
          <View style={localStyles.emptyActionText}>
            <Text style={localStyles.emptyActionTitle}>Ver Dashboard</Text>
            <Text style={localStyles.emptyActionSub}>Visão geral das suas finanças</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
        </Pressable>
      </View>
    </AppScreen>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export function IntelligentReadingScreen({ navigation }) {
  const { state: investigationState, syncInvestigationContext } = useInvestigation();
  const query = useQuery({
    queryKey: ['ledger', 'intelligent-reading'],
    queryFn: () => fetchIntelligentReading()
  });

  const reading = useMemo(() => normalizeIntelligentReading(query.data), [query.data]);

  useEffect(() => {
    if (!__DEV__ || !query.data) return;
    console.log('[IntelligentReading payload keys]', getIntelligentReadingPayloadKeySummary(query.data));
  }, [query.data]);

  useInvestigationScreen(
    {
      screen: 'IntelligentReading',
      label: investigationState.activeEntity || 'Leitura Inteligente',
      activeEntity: investigationState.activeEntity,
      activeType: investigationState.activeType,
      activePeriod: investigationState.activePeriod,
      source: 'IntelligentReading',
      params: {
        q: investigationState.activeEntity,
        type: investigationState.activeType,
        period: investigationState.activePeriod
      },
      summary: reading?.headline || reading?.summary || 'Interpretação analítica do histórico',
      trackRecent: Boolean(investigationState.activeEntity)
    },
    [investigationState.activeEntity, investigationState.activeType, investigationState.activePeriod, reading?.headline, reading?.summary]
  );

  const openTransaction = useCallback(
    (transactionId) => {
      const id = safeText(transactionId, '').trim();
      if (!id) return;
      navigation.navigate('TransactionDetails', { transactionId: id, source: 'IntelligentReading' });
    },
    [navigation]
  );

  const openTransactions = useCallback(() => {
    navigation?.getParent?.()?.navigate('TransactionsTab');
  }, [navigation]);

  const openEntity = useCallback(
    (entity, type = 'merchant', summary = '') => {
      const q = safeText(entity, '').trim();
      if (!q) return;
      syncInvestigationContext({
        activeEntity: q,
        activeType: type,
        activePeriod: investigationState.activePeriod,
        source: 'IntelligentReading',
        summary
      });
      openFinancialProfile(navigation, {
        type,
        q,
        source: 'IntelligentReading',
        period: investigationState.activePeriod,
        summary
      });
    },
    [investigationState.activePeriod, navigation, syncInvestigationContext]
  );

  const openGraph = useCallback(
    (entity, type = 'merchant') => {
      const q = safeText(entity, '').trim();
      if (!q) return;
      openRelationshipGraph(navigation, {
        type,
        q,
        source: 'IntelligentReading',
        period: investigationState.activePeriod
      });
    },
    [investigationState.activePeriod, navigation]
  );

  const searchRelated = useCallback(
    (term) => {
      const q = safeText(term, '').trim();
      if (!q) return;
      openFinancialSearch(navigation, { prefill: q, source: 'IntelligentReading' });
    },
    [navigation]
  );

  const openNavigationTarget = useCallback(
    (target, insight) => {
      const route = safeText(target?.route, '').trim();
      const params = target?.params && typeof target.params === 'object' ? target.params : {};
      const fallbackTerm =
        insight?.entity || insight?.category || insight?.paymentMethod || insight?.title || params.entity || params.q;
      const entityType =
        params.entityType ||
        params.type ||
        insight?.entityType ||
        (insight?.category ? 'category' : insight?.paymentMethod ? 'paymentMethod' : 'merchant');

      if (route === 'FinancialProfile') {
        openEntity(params.entity || params.q || params.name || fallbackTerm, entityType, insight?.description || insight?.title);
        return;
      }
      if (route === 'FinancialSearch') {
        searchRelated(params.prefill || params.q || params.query || params.entity || fallbackTerm);
        return;
      }
      if (route === 'TransactionDetails') {
        const relatedTransactions = Array.isArray(insight?.relatedTransactions) ? insight.relatedTransactions : [];
        openTransaction(
          params.transactionId ||
            params.id ||
            insight?.transactionId ||
            (relatedTransactions.length === 1 ? relatedTransactions[0]?.id : '')
        );
        return;
      }
      if (route === 'RelationshipGraph') {
        openGraph(params.entity || params.q || params.name || fallbackTerm, entityType);
        return;
      }
      if (route === 'TransactionsTab') {
        openTransactions();
      }
    },
    [openEntity, openGraph, openTransaction, openTransactions, searchRelated]
  );

  if (query.isError) {
    return (
      <AppScreen padded>
        <SmartErrorState error={query.error} onRetry={() => query.refetch()} />
      </AppScreen>
    );
  }

  if (query.isPending) {
    return (
      <AppScreen padded scroll>
        <LoadingSkeleton width="50%" height={14} />
        <LoadingSkeleton width="75%" height={30} style={{ marginTop: theme.spacing.sm }} />
        <LoadingSkeleton width="100%" height={80} style={{ marginTop: theme.spacing.md }} />
        <LoadingSkeleton width="100%" height={130} style={{ marginTop: theme.spacing.lg }} />
        <LoadingSkeleton width="100%" height={130} style={{ marginTop: theme.spacing.md }} />
        <LoadingSkeleton width="100%" height={100} style={{ marginTop: theme.spacing.md }} />
      </AppScreen>
    );
  }

  if (!hasAnyContent(reading)) {
    return <ReadingEmptyState navigation={navigation} />;
  }

  const moneyFlow = reading.moneyFlow;
  const pixItems = Array.isArray(reading.pixAnalysis?.topEntities)
    ? reading.pixAnalysis.topEntities
    : Array.isArray(reading.pixAnalysis?.people)
    ? reading.pixAnalysis.people
    : Array.isArray(reading.pixAnalysis?.merchants)
    ? reading.pixAnalysis.merchants
    : [];
  const merchantItems = reading.topMerchants;
  const peopleItems = reading.topPeople;
  const categoryItems = reading.topCategories;
  const methodItems = reading.paymentMethods;
  const recurrenceItems = Array.isArray(reading.recurrenceAnalysis?.patterns)
    ? reading.recurrenceAnalysis.patterns
    : Array.isArray(reading.recurrenceAnalysis?.recurrent)
    ? reading.recurrenceAnalysis.recurrent
    : [];

  return (
    <AppScreen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <View style={localStyles.hero}>
        <Text style={localStyles.label}>Leitura Inteligente</Text>
        <Text style={localStyles.title}>{reading.headline}</Text>
        {reading.summary ? (
          <Text style={localStyles.summary}>{reading.summary}</Text>
        ) : null}
        <ConfidenceBadge value={reading.confidence} />
      </View>
      <PeriodPanel period={reading.period} />
      <InvestigationHeader
        navigation={navigation}
        summary={reading.summary || reading.narrative || reading.headline}
      />
      <InvestigationBreadcrumbs navigation={navigation} />

      {/* ── Narrativa ─────────────────────────────────────────── */}
      {reading.narrative ? (
        <AppCard variant="elevated" style={localStyles.narrativeCard}>
          <View style={localStyles.narrativeHeader}>
            <View style={localStyles.narrativeIconWrap}>
              <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
            </View>
            <Text style={localStyles.narrativeTitle}>O que mais chama atenção</Text>
          </View>
          <Text style={localStyles.narrativeText}>{reading.narrative}</Text>
        </AppCard>
      ) : null}

      {/* ── Fluxo financeiro ──────────────────────────────────── */}
      {moneyFlow ? (
        <>
          <SectionHeader title="Fluxo do período" subtitle="Entradas vs saídas totais" />
          <AppCard variant="elevated">
            <MoneyFlowBar
              income={moneyFlow.income ?? moneyFlow.totalIncome ?? reading.totals.income}
              expense={moneyFlow.expense ?? moneyFlow.totalExpense ?? moneyFlow.totalExpenses ?? reading.totals.expense}
            />

            {(moneyFlow.balance != null || moneyFlow.savingsRate != null || reading.totals.balance) ? (
              <View style={localStyles.flowMetrics}>
                {(moneyFlow.balance != null || moneyFlow.netAmount != null || reading.totals.balance) ? (
                  <View style={localStyles.flowMetric}>
                    <Text style={localStyles.flowMetricLabel}>Saldo do período</Text>
                    <Text
                      style={[
                        localStyles.flowMetricValue,
                        {
                          color:
                            toNumber(moneyFlow.balance ?? moneyFlow.netAmount ?? reading.totals.balance) >= 0
                              ? theme.colors.success
                              : theme.colors.danger
                        }
                      ]}
                    >
                      {formatBRL(toNumber(moneyFlow.balance ?? moneyFlow.netAmount ?? reading.totals.balance))}
                    </Text>
                  </View>
                ) : null}
                {moneyFlow.savingsRate != null ? (
                  <View style={localStyles.flowMetric}>
                    <Text style={localStyles.flowMetricLabel}>Taxa de poupança</Text>
                    <Text style={[localStyles.flowMetricValue, { color: theme.colors.accent }]}>
                      {formatPercent(toNumber(moneyFlow.savingsRate))}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {reading.expenseAnalysis?.dominantCategory ? (
              <View style={localStyles.flowHintRow}>
                <Ionicons name="trending-up-outline" size={14} color={theme.colors.muted} />
                <Text style={localStyles.flowHint}>
                  Principal categoria de gasto:{' '}
                  {safeText(reading.expenseAnalysis.dominantCategory)}
                </Text>
              </View>
            ) : null}
          </AppCard>
        </>
      ) : null}

      {/* ── PIX ───────────────────────────────────────────────── */}
      {pixItems.length > 0 ? (
        <>
          <SectionHeader
            title="Movimentações PIX"
            subtitle="Quem mais aparece nas transações PIX"
          />
          <AppCard>
            {reading.pixAnalysis?.total != null ? (
              <Text style={localStyles.sectionStat}>
                {formatBRLCompact(toNumber(reading.pixAnalysis.total))} em{' '}
                {reading.pixAnalysis.count ?? '—'} transações PIX
              </Text>
            ) : null}
            {pixItems.slice(0, 6).map((item, i) => (
              <EntityRankRow
                key={buildStableKey(item.id, item.type, item.name || item.label, item.amount, item.count, i + 1)}
                item={item}
                index={i}
                color={theme.colors.accent}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Estabelecimentos ──────────────────────────────────── */}
      <SectionHeader title="Estabelecimentos relevantes" subtitle="Onde a análise encontrou maior concentração" />
      {merchantItems.length > 0 ? (
        <AppCard>
          {merchantItems.slice(0, 6).map((item, i) => (
            <MerchantRow
              key={buildStableKey(item.id, item.type, item.name, item.amount, item.count, i + 1)}
              item={item}
              index={i}
              onOpen={() => openEntity(item.name, item.type || 'merchant', 'Estabelecimento relevante na Leitura Inteligente')}
            />
          ))}
        </AppCard>
      ) : (
        <AppCard variant="outline">
          <View style={localStyles.smallEmptyRow}>
            <Ionicons name="storefront-outline" size={18} color={theme.colors.muted} />
            <Text style={localStyles.smallEmptyText}>
              Não encontramos estabelecimentos suficientes neste período.
            </Text>
          </View>
        </AppCard>
      )}

      {categoryItems.length > 0 ? (
        <>
          <SectionHeader title="Onde mais gastou" subtitle="Categorias que puxaram as saídas" />
          <AppCard>
            {categoryItems.slice(0, 6).map((item, i) => (
              <EntityRankRow
                key={buildStableKey(item.id, item.type, item.name, item.amount, item.count, i + 1)}
                item={item}
                index={i}
                color={theme.colors.action}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Pessoas ───────────────────────────────────────────── */}
      {peopleItems.length > 0 ? (
        <>
          <SectionHeader
            title="Pessoas detectadas"
            subtitle="Transferências enviadas ou recebidas de pessoas"
          />
          <AppCard>
            {peopleItems.slice(0, 6).map((item, i) => (
              <EntityRankRow
                key={buildStableKey(item.id, item.type, item.name || item.label, item.amount, item.count, i + 1)}
                item={item}
                index={i}
                color={theme.colors.primary}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Métodos de pagamento ──────────────────────────────── */}
      {methodItems.length > 0 ? (
        <>
          <SectionHeader title="Métodos de pagamento" subtitle="Como você pagou no período" />
          <AppCard>
            {methodItems.slice(0, 6).map((item, i) => (
              <MethodRow
                key={buildStableKey(item.id, item.method || item.name || item.label, item.amount, item.count, i + 1)}
                item={item}
                index={i}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Recorrências ──────────────────────────────────────── */}
      {recurrenceItems.length > 0 ? (
        <>
          <SectionHeader
            title="Padrões recorrentes"
            subtitle="Gastos que se repetem no histórico"
          />
          {recurrenceItems.slice(0, 5).map((item, i) => (
            <InsightCard
              key={buildStableKey(item.id, item.type, item.name || item.label || item.entity, item.timestamp || item.createdAt, i + 1)}
              icon="repeat-outline"
              tone="warning"
              title={safeText(item.name || item.label || item.entity, 'Recorrência detectada')}
              description={safeText(item.description || item.summary)}
              style={{ marginBottom: theme.spacing.md }}
            />
          ))}
        </>
      ) : null}

      {/* ── Alertas ───────────────────────────────────────────── */}
      {reading.alerts.length > 0 ? (
        <>
          <SectionHeader
            title="Alertas"
            subtitle={`${reading.alerts.length} ponto${reading.alerts.length !== 1 ? 's' : ''} que merece${reading.alerts.length !== 1 ? 'm' : ''} atenção`}
          />
          <AppCard variant="elevated">
            {reading.alerts.map((alert, i) => (
              <AlertItem
                key={buildStableKey(alert.id, alert.type, alert.title || alert.label || alert.text, alert.timestamp || alert.createdAt, i + 1)}
                alert={alert}
              />
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Recomendações ─────────────────────────────────────── */}
      {reading.recommendations.length > 0 ? (
        <>
          <SectionHeader title="Recomendações" subtitle="O que você pode melhorar" />
          <AppCard variant="outline">
            {reading.recommendations.map((rec, i) => {
              const text =
                typeof rec === 'string'
                  ? rec
                  : safeText(rec.text || rec.title || rec.description, '');
              if (!text) return null;
              return (
                <View
                  key={buildStableKey(rec?.id, rec?.type, text, rec?.timestamp || rec?.createdAt, i + 1)}
                  style={localStyles.recRow}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={theme.colors.accent}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={localStyles.recText} numberOfLines={4}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </AppCard>
        </>
      ) : null}

      {reading.suggestedQuestions.length > 0 ? (
        <>
          <SectionHeader
            title="Próximas perguntas"
            subtitle="Investigações sugeridas automaticamente"
          />
          <AppCard variant="outline">
            {reading.suggestedQuestions.map((question, i) => {
              const text = safeText(question, '');
              if (!text) return null;
              return (
                <View
                  key={buildStableKey('question', text, i + 1)}
                  style={localStyles.recRow}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={theme.colors.secondary}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={localStyles.recText} numberOfLines={4}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </AppCard>
        </>
      ) : null}

      {reading.evidenceItems.length || reading.relatedTransactions.length ? (
        <>
          <SectionHeader title="Contexto de origem" subtitle="Base usada pela análise inteligente" />
          <AppCard variant="outline">
            <EvidenceSection
              evidenceItems={reading.evidenceItems}
              relatedTransactions={reading.relatedTransactions}
            />
          </AppCard>
        </>
      ) : null}

      {/* ── Insights investigáveis ─────────────────────────────── */}
      {reading.insights.length > 0 ? (
        <>
          <SectionHeader
            title="Insights investigáveis"
            subtitle={`${reading.insights.length} ponto${reading.insights.length !== 1 ? 's' : ''} detectado${reading.insights.length !== 1 ? 's' : ''}`}
          />
          {reading.insights.map((insight, i) => {
            const term = insight.entity || insight.category || insight.paymentMethod || insight.title;
            const entityType =
              insight.entityType ||
              (insight.category ? 'category' : insight.paymentMethod ? 'paymentMethod' : 'merchant');
            const primaryTarget =
              insight.navigationTarget ||
              (insight.suggestedAction?.route
                ? { route: insight.suggestedAction.route, params: insight.suggestedAction.params }
                : null);
            const primaryActionLabel =
              insight.suggestedAction?.label ||
              (primaryTarget?.route === 'FinancialProfile'
                ? 'Abrir entidade'
                : primaryTarget?.route === 'FinancialSearch'
                ? 'Buscar relacionados'
                : primaryTarget?.route === 'TransactionDetails'
                ? 'Abrir transação'
                : primaryTarget?.route === 'RelationshipGraph'
                ? 'Ver grafo'
                : primaryTarget?.route === 'TransactionsTab'
                ? 'Ver transações'
                : '');
            return (
              <InsightInvestigationCard
                key={buildStableKey(insight.id, insight.type, insight.title, insight.timestamp || insight.createdAt, i + 1)}
                insight={insight}
                globalEvidence={reading.evidenceItems}
                primaryActionLabel={primaryActionLabel}
                primaryActionRoute={primaryTarget?.route}
                onPrimaryAction={primaryTarget ? () => openNavigationTarget(primaryTarget, insight) : null}
                onOpenEntity={() => openEntity(term, entityType, insight.description || insight.title)}
                onSearchRelated={() => searchRelated(term)}
                onOpenTransaction={openTransaction}
                onOpenGraph={() => openGraph(term, entityType)}
                onOpenTransactions={openTransactions}
                onOpenDetails={() =>
                  openInsightDetails(navigation, {
                    insight: insight.raw || insight,
                    normalizedInsight: insight,
                    source: 'IntelligentReading'
                  })
                }
              />
            );
          })}
        </>
      ) : null}

      {/* ── Rodapé ────────────────────────────────────────────── */}
      <AppCard variant="outline" style={localStyles.footerCard}>
        <View style={localStyles.footerRow}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.muted} />
          <Text style={localStyles.footerText}>
            Análise baseada nas transações importadas. Resultados melhoram com mais dados.
          </Text>
        </View>
        <AppButton
          label="Busca Inteligente"
          variant="ghost"
          size="sm"
          iconLeft={<Ionicons name="search-outline" size={16} color={theme.colors.text} />}
          onPress={() => openFinancialSearch(navigation)}
          style={{ marginTop: theme.spacing.md }}
        />
      </AppCard>

      <View style={{ height: theme.spacing.xxxl }} />
    </AppScreen>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  hero: { paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.sm,
    lineHeight: 34
  },
  summary: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.sm,
    lineHeight: 22,
    marginBottom: theme.spacing.md
  },
  periodPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  periodIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.actionSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  periodLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  periodValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginTop: 2
  },

  confBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm
  },
  confText: { fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.medium },

  narrativeCard: { marginBottom: theme.spacing.sm },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  narrativeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  narrativeTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold
  },
  narrativeText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22
  },

  flowBarContainer: { gap: theme.spacing.md },
  flowBarTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface
  },
  flowBarSegment: { borderRadius: 5 },
  flowBarLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  flowBarLegendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  flowDot: { width: 8, height: 8, borderRadius: 4 },
  flowLegendLabel: { color: theme.colors.muted, fontSize: theme.typography.size.sm },
  flowLegendValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  flowMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md
  },
  flowMetric: { alignItems: 'center' },
  flowMetricLabel: { color: theme.colors.muted, fontSize: theme.typography.size.xs, marginBottom: 2 },
  flowMetricValue: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold
  },
  flowHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  flowHint: { color: theme.colors.muted, fontSize: theme.typography.size.sm, flex: 1 },

  sectionStat: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic'
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  rankNum: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.muted
  },
  rankName: { flex: 1, color: theme.colors.text, fontSize: theme.typography.size.md },
  rankRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rankCount: { color: theme.colors.muted, fontSize: theme.typography.size.xs },
  rankAmount: { fontWeight: theme.typography.weight.semibold, fontSize: theme.typography.size.md },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  merchantContent: { flex: 1, minWidth: 0 },
  merchantMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: 2
  },
  merchantRight: { alignItems: 'flex-end', gap: 2 },
  rowCta: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  smallEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  smallEmptyText: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  methodIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.actionSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  methodName: { flex: 1, color: theme.colors.text, fontSize: theme.typography.size.md },
  methodAmount: {
    color: theme.colors.action,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.md
  },

  alertRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  alertContent: { flex: 1 },
  alertTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: 2
  },
  alertDescription: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  },

  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  recText: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22
  },

  footerCard: { marginTop: theme.spacing.lg, gap: 0 },
  footerRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  footerText: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  },
  detailCta: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6
  },
  infoChipLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium
  },
  infoChipValue: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    maxWidth: 150
  },
  evidenceBox: { gap: theme.spacing.sm },
  evidenceTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  evidenceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  evidenceLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs
  },
  shortId: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  transactionEvidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm
  },
  transactionEvidenceText: { flex: 1 },
  relatedMiniList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm
  },
  relatedMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  relatedMiniTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  relatedMiniSub: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  relatedMiniAmount: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  insightInvestigationCard: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md
  },
  insightIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    flexShrink: 0
  },
  insightTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold
  },
  insightDescription: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 19,
    marginTop: 4
  },
  insightChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  contextActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },

  emptyCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.xl
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    textAlign: 'center'
  },
  emptyCardBody: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    textAlign: 'center',
    lineHeight: 22
  },
  emptyActions: { gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  emptyActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg
  },
  emptyActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  emptyActionText: { flex: 1 },
  emptyActionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  emptyActionSub: { color: theme.colors.muted, fontSize: theme.typography.size.sm, marginTop: 2 }
});
