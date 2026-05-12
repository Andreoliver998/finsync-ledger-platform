import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppInput } from '@components/AppInput';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { InfoHint } from '@components/InfoHint';
import { InvestigationBreadcrumbs } from '@components/InvestigationBreadcrumbs';
import { InvestigationHeader } from '@components/InvestigationHeader';
import { InvestigationRail } from '@components/InvestigationRail';
import { InsightCard } from '@components/InsightCard';
import { MetricProgressBar } from '@components/MetricProgressBar';
import { RankingList } from '@components/RankingList';
import { SectionHeader } from '@components/SectionHeader';
import { SmartErrorState } from '@components/SmartErrorState';
import { TransactionRow } from '@components/TransactionRow';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import {
  buildProfileParams,
  openExportScreen,
  openFinancialSearch,
  openIntelligentReading,
  openInsightDetails,
  openRelatedTransactions,
  openRelationshipGraph,
  openTimelineAnalysis
} from '@utils/analyticsNavigation';
import { normalizeProfile, normalizeTransaction } from '@utils/analyticsData';
import { formatBRL, formatBRLCompact, toNumber } from '@utils/money';
import { formatShortDate } from '@utils/date';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { safeText } from '@utils/safeText';
import { buildStableKey } from '@utils/buildStableKey';
import { getEntityBg, getEntityColor } from '@utils/formatters';
import { fetchFinancialProfile } from '../api/financialProfileApi';
import { EntitySignalsPanel } from '../components/EntitySignalsPanel';
import { FinancialProfileHeroCard } from '../components/FinancialProfileHeroCard';
import { FinancialProfileLoadingState } from '../components/FinancialProfileLoadingState';
import { FinancialQuickActions } from '../components/FinancialQuickActions';
import { MiniTimelineCard } from '../components/MiniTimelineCard';
import { MoneyFlowVisualizationCard } from '../components/MoneyFlowVisualizationCard';
import { RelationshipSnapshotCard } from '../components/RelationshipSnapshotCard';
import {
  buildContextSummary,
  buildEntitySignals,
  buildExecutiveSummary,
  buildFinancialRelevanceScore,
  buildRelationshipSnapshot,
  buildTimelineNarrative,
  buildTimelinePoints,
  formatActivePeriodLabel,
  getProfileVisualIdentity
} from '../utils/profileVisuals';

// ─── Constants ──────────────────────────────────────────────────────────────────

const VALID_TYPES = [
  { value: 'person', label: 'Pessoa', icon: 'person-outline' },
  { value: 'merchant', label: 'Empresa', icon: 'storefront-outline' },
  { value: 'bank', label: 'Banco', icon: 'business-outline' },
  { value: 'paymentMethod', label: 'Método', icon: 'card-outline' },
  { value: 'category', label: 'Categoria', icon: 'pricetag-outline' }
];

const QUICK_EXAMPLES = [
  { label: 'Enilton Pereira', type: 'person', icon: 'person-outline' },
  { label: 'PREZUNIC', type: 'merchant', icon: 'storefront-outline' },
  { label: 'Nubank', type: 'bank', icon: 'business-outline' },
  { label: 'PIX', type: 'paymentMethod', icon: 'card-outline' },
  { label: 'Transferências', type: 'category', icon: 'pricetag-outline' }
];

function isValidType(value) {
  return VALID_TYPES.some((item) => item.value === value);
}

function typeLabelFromValue(value) {
  return VALID_TYPES.find((item) => item.value === value)?.label || value || 'Entidade';
}

// ─── Data Pickers ────────────────────────────────────────────────────────────────

function pickHighlights(profile) {
  if (!profile) return [];
  return profile.highlights || profile.bullets || profile.signals || [];
}

function pickRecommendations(profile) {
  if (!profile) return [];
  return profile.recommendations || profile.actions || profile.suggestions || [];
}

function pickMetrics(profile) {
  if (!profile) return [];
  if (Array.isArray(profile.metrics)) return profile.metrics;
  if (profile.kpis && typeof profile.kpis === 'object') {
    return Object.entries(profile.kpis).map(([label, value]) => ({ label, value }));
  }
  return [];
}

function pickRelationship(profile) {
  if (!profile) return null;
  const count = profile.transactionCount ?? profile.count ?? profile.frequency ?? null;
  const total = profile.totalAmount ?? profile.volume ?? profile.total ?? null;
  const avg =
    profile.avgAmount ??
    profile.average ??
    (count && total ? Math.round(toNumber(total) / toNumber(count)) : null);
  if (count == null && total == null) return null;
  return { count, total, avg };
}

function pickMethods(profile) {
  if (!profile) return [];
  const raw = profile.byMethod ?? profile.methods ?? profile.paymentMethods ?? [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw
    .map((m) => ({
      label: safeText(m.method ?? m.name ?? m.label, '—'),
      value: Math.abs(toNumber(m.amount ?? m.total ?? m.value ?? m.count ?? 0))
    }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function pickProfileCategories(profile) {
  if (!profile) return [];
  const raw = profile.byCategory ?? profile.categories ?? profile.topCategories ?? [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw
    .map((c) => ({
      label: safeText(c.category ?? c.name ?? c.label, '—'),
      value: Math.abs(toNumber(c.amount ?? c.total ?? c.value ?? 0))
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function pickMoneyFlow(profile) {
  if (!profile) return null;
  const sent = profile.totalSent ?? profile.totalOut ?? profile.sent ?? profile.expense ?? null;
  const received =
    profile.totalReceived ?? profile.totalIn ?? profile.received ?? profile.income ?? null;
  if (sent == null && received == null) return null;
  const sentNum = Math.abs(toNumber(sent));
  const receivedNum = Math.abs(toNumber(received));
  const total = sentNum + receivedNum;
  if (total === 0) return null;
  const dominant = sentNum > receivedNum ? 'saída' : 'entrada';
  return {
    sent: sentNum,
    received: receivedNum,
    total,
    sentRatio: sentNum / total,
    receivedRatio: receivedNum / total,
    dominant,
    dominantText:
      sentNum > receivedNum
        ? 'A maior parte da movimentação com esta entidade foi de saída.'
        : 'Esta entidade aparece mais como origem de entrada de dinheiro.'
  };
}

function pickPeriod(profile) {
  if (!profile) return null;
  const first =
    profile.firstSeen ?? profile.firstDate ?? profile.firstTransaction ?? null;
  const last =
    profile.lastSeen ?? profile.lastDate ?? profile.lastTransaction ?? null;
  if (!first && !last) return null;
  return { first, last };
}

function pickConfidence(profile) {
  if (!profile) return null;
  const val = profile.confidence ?? null;
  return typeof val === 'number' ? val : null;
}

function pickRelatedTransactions(profile) {
  if (!profile) return [];
  const raw =
    profile.relatedTransactions ?? profile.transactions ?? profile.related ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map(normalizeTransaction);
}

function pickLargestTx(profile) {
  if (!profile) return null;
  return profile.largestTransaction ?? profile.maxTransaction ?? null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────────

function TypeChip({ item, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [
        localStyles.chip,
        selected ? localStyles.chipSelected : localStyles.chipIdle,
        pressed && localStyles.chipPressed
      ]}
    >
      <Ionicons
        name={item.icon}
        size={14}
        color={selected ? theme.colors.primary : theme.colors.muted}
        style={{ marginRight: 4 }}
      />
      <Text style={[localStyles.chipText, selected && localStyles.chipTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function ConfidenceBadge({ value }) {
  if (value == null) return null;
  const pct = Math.round(value <= 1 ? value * 100 : value);
  const color =
    pct >= 80 ? theme.colors.success : pct >= 50 ? theme.colors.warning : theme.colors.muted;
  return (
    <View style={localStyles.confBadge}>
      <Ionicons name="shield-checkmark-outline" size={11} color={color} />
      <Text style={[localStyles.confText, { color }]}>{pct}% confiança</Text>
    </View>
  );
}

function PeriodBadge({ period }) {
  if (!period) return null;
  const parts = [
    period.first ? formatShortDate(period.first) : null,
    period.last ? formatShortDate(period.last) : null
  ].filter(Boolean);
  if (!parts.length) return null;
  return (
    <View style={localStyles.periodBadge}>
      <Ionicons name="calendar-outline" size={11} color={theme.colors.muted} />
      <Text style={localStyles.periodText}>{parts.join(' → ')}</Text>
    </View>
  );
}

// ─── Launcher (sem parâmetros) ────────────────────────────────────────────────────

function DossierLauncher({ selectedType, setSelectedType, query, setQuery, openProfile }) {
  return (
    <AppScreen scroll>
      <View style={localStyles.heroBlock}>
        <Text style={localStyles.label}>Perfil Financeiro</Text>
        <Text style={localStyles.archetype}>Dossiê de Entidade</Text>
        <Text style={localStyles.summary}>
          Pesquise uma entidade para gerar seu dossiê — um relatório completo de movimentações,
          padrões e relacionamentos financeiros.
        </Text>
      </View>

      <InfoHint
        text="O dossiê reúne movimentações, padrões e o relacionamento financeiro de uma entidade: pessoa, empresa, banco, método ou categoria."
        tone="primary"
        style={{ marginTop: theme.spacing.md }}
      />

      <AppCard variant="elevated" style={localStyles.launcherCard}>
        <AppInput
          label="Buscar entidade"
          value={query}
          onChangeText={setQuery}
          placeholder="Ex: Enilton, PREZUNIC, Nubank, PIX"
          leftIcon={<Ionicons name="search" size={18} color={theme.colors.muted} />}
        />

        <Text style={localStyles.sectionTitle}>Tipo de dossiê</Text>
        <View style={localStyles.chipsWrap}>
          {VALID_TYPES.map((item) => (
            <TypeChip
              key={item.value}
              item={item}
              selected={selectedType === item.value}
              onPress={() => setSelectedType(item.value)}
            />
          ))}
        </View>

        <AppButton
          label="Abrir dossiê"
          onPress={() => openProfile(selectedType, query)}
          disabled={!query.trim()}
          style={{ marginTop: theme.spacing.lg }}
        />
      </AppCard>

      <SectionHeader
        title="Exemplos rápidos"
        subtitle="Toque para preencher e abrir o dossiê"
      />

      <View style={localStyles.examplesWrap}>
        {QUICK_EXAMPLES.map((example) => (
          <Pressable
            key={`${example.type}-${example.label}`}
            onPress={() => openProfile(example.type, example.label)}
            android_ripple={{ color: theme.colors.primarySoft }}
            style={({ pressed }) => [localStyles.exampleCard, pressed && localStyles.chipPressed]}
          >
            <View style={localStyles.exampleRow}>
              <View
                style={[
                  localStyles.exampleIconWrap,
                  { backgroundColor: getEntityBg(example.type) }
                ]}
              >
                <Ionicons name={example.icon} size={18} color={getEntityColor(example.type)} />
              </View>
              <View style={localStyles.exampleContent}>
                <Text style={localStyles.exampleTitle}>{example.label}</Text>
                <Text style={localStyles.exampleType}>
                  {VALID_TYPES.find((i) => i.value === example.type)?.label || example.type}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
            </View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────────

export function FinancialProfileScreen({ navigation, route }) {
  const { state: investigationState, pinEntity } = useInvestigation();
  const routeType = route?.params?.type;
  const routeQuery = route?.params?.q;

  const [selectedType, setSelectedType] = useState(
    isValidType(routeType) ? routeType : 'person'
  );
  const [query, setQuery] = useState(typeof routeQuery === 'string' ? routeQuery : '');

  useEffect(() => {
    if (isValidType(routeType)) setSelectedType(routeType);
    if (typeof routeQuery === 'string') setQuery(routeQuery);
  }, [routeType, routeQuery]);

  const hasValidParams =
    isValidType(routeType) &&
    typeof routeQuery === 'string' &&
    routeQuery.trim().length > 0;
  const normalizedQuery = typeof routeQuery === 'string' ? routeQuery.trim() : '';

  const queryResult = useQuery({
    queryKey: ['financial-profile', routeType, normalizedQuery],
    queryFn: () => fetchFinancialProfile({ type: routeType, q: normalizedQuery }),
    enabled: hasValidParams
  });

  const profile = queryResult.data;

  const highlights = useMemo(() => pickHighlights(profile), [profile]);
  const recommendations = useMemo(() => pickRecommendations(profile), [profile]);
  const metrics = useMemo(() => pickMetrics(profile), [profile]);
  const relationship = useMemo(() => pickRelationship(profile), [profile]);
  const methods = useMemo(() => pickMethods(profile), [profile]);
  const profileCategories = useMemo(() => pickProfileCategories(profile), [profile]);
  const moneyFlow = useMemo(() => pickMoneyFlow(profile), [profile]);
  const period = useMemo(() => pickPeriod(profile), [profile]);
  const confidence = useMemo(() => pickConfidence(profile), [profile]);
  const relatedTransactions = useMemo(() => pickRelatedTransactions(profile), [profile]);
  const largestTx = useMemo(() => pickLargestTx(profile), [profile]);
  const activePeriod = route?.params?.period || investigationState.activePeriod || '90d';
  const profileSnapshot = useMemo(
    () => normalizeProfile({ ...profile, type: routeType, q: normalizedQuery, source: 'FinancialProfile' }),
    [profile, routeType, normalizedQuery]
  );
  const visualIdentity = useMemo(() => getProfileVisualIdentity(routeType), [routeType]);
  const relevanceScore = useMemo(
    () => buildFinancialRelevanceScore({ profile, profileSnapshot, confidence, relationship }),
    [profile, profileSnapshot, confidence, relationship]
  );
  const entitySignals = useMemo(
    () =>
      buildEntitySignals({
        profileSnapshot,
        relationship,
        methods,
        moneyFlow,
        confidence,
        relatedTransactions
      }),
    [profileSnapshot, relationship, methods, moneyFlow, confidence, relatedTransactions]
  );
  const timelinePoints = useMemo(() => buildTimelinePoints(relatedTransactions), [relatedTransactions]);
  const timelineNarrative = useMemo(() => buildTimelineNarrative(timelinePoints), [timelinePoints]);
  const relationshipSnapshot = useMemo(
    () => buildRelationshipSnapshot({ relatedTransactions, methods, profileCategories }),
    [relatedTransactions, methods, profileCategories]
  );
  const contextSummary = useMemo(
    () => buildContextSummary({ entitySignals, moneyFlow, relatedTransactions }),
    [entitySignals, moneyFlow, relatedTransactions]
  );
  const executiveSummary = useMemo(
    () =>
      buildExecutiveSummary({
        entityName: normalizedQuery,
        moneyFlow,
        profileSnapshot,
        methods,
        relatedTransactions,
        activePeriod
      }),
    [normalizedQuery, moneyFlow, profileSnapshot, methods, relatedTransactions, activePeriod]
  );
  const periodLabel = useMemo(
    () =>
      formatActivePeriodLabel(
        activePeriod,
        period
          ? {
              first: period.first ? formatShortDate(period.first) : null,
              last: period.last ? formatShortDate(period.last) : null
            }
          : null
      ),
    [activePeriod, period]
  );
  const isPinned = useMemo(
    () =>
      investigationState.pinnedEntities.some(
        (item) => item.entity === normalizedQuery && item.type === routeType
      ),
    [investigationState.pinnedEntities, normalizedQuery, routeType]
  );
  const heroMetrics = useMemo(
    () => [
      {
        label: 'entradas',
        value: formatBRLCompact(profileSnapshot.totalReceived || 0),
        toneColor: theme.colors.success
      },
      {
        label: 'saídas',
        value: formatBRLCompact(profileSnapshot.totalSent || 0),
        toneColor: theme.colors.danger
      },
      {
        label: 'recorrência',
        value: String(profileSnapshot.recurringCount || 0),
        toneColor: theme.colors.primaryStrong
      },
      {
        label: 'confiança',
        value:
          profileSnapshot.confidence != null
            ? `${Math.round(profileSnapshot.confidence <= 1 ? profileSnapshot.confidence * 100 : profileSnapshot.confidence)}%`
            : '—',
        toneColor: theme.colors.secondary
      }
    ],
    [profileSnapshot]
  );
  const profileParams = useMemo(
    () =>
      buildProfileParams({
        type: routeType,
        q: normalizedQuery,
        source: route?.params?.source || 'FinancialProfile',
        period: activePeriod,
        summary: safeText(profile?.summary || profile?.description, '').trim() || contextSummary
      }),
    [
      routeType,
      normalizedQuery,
      route?.params?.source,
      activePeriod,
      profile?.summary,
      profile?.description,
      contextSummary
    ]
  );

  useInvestigationScreen(
    {
      enabled: hasValidParams,
      screen: 'FinancialProfile',
      routeKey: route?.key,
      label: normalizedQuery || 'Dossiê',
      activeEntity: normalizedQuery,
      activeType: routeType,
      activePeriod,
      source: route?.params?.source || 'FinancialProfile',
      params: route?.params || {},
      summary:
        safeText(profile?.summary || profile?.description, '').trim() ||
        contextSummary ||
        `${relatedTransactions.length} transações · ${methods.length} métodos`
    },
    [
      hasValidParams,
      route?.key,
      route?.params,
      normalizedQuery,
      routeType,
      profile?.summary,
      profile?.description,
      contextSummary,
      relatedTransactions.length,
      methods.length,
      activePeriod
    ]
  );

  const goToSearch = useCallback(() => {
    openFinancialSearch(navigation, {
      prefill: normalizedQuery,
      type: routeType,
      period: activePeriod
    });
  }, [navigation, normalizedQuery, routeType, activePeriod]);

  const goToGraph = useCallback(() => {
    openRelationshipGraph(navigation, profileParams);
  }, [navigation, profileParams]);

  const goToExport = useCallback(() => {
    openExportScreen(navigation, { ...profileParams, title: `Exportar ${normalizedQuery}` });
  }, [navigation, profileParams, normalizedQuery]);

  const openReading = useCallback(() => {
    openIntelligentReading(navigation, profileParams);
  }, [navigation, profileParams]);

  const openTimeline = useCallback(() => {
    openTimelineAnalysis(navigation, {
      title: `Timeline de ${normalizedQuery}`,
      items: relatedTransactions,
      contextSummary,
      ...profileSnapshot
    });
  }, [navigation, normalizedQuery, relatedTransactions, contextSummary, profileSnapshot]);

  const togglePin = useCallback(() => {
    pinEntity({
      entity: normalizedQuery,
      type: routeType,
      period: activePeriod,
      source: route?.params?.source || 'FinancialProfile',
      summary: contextSummary,
      params: profileParams
    });
  }, [pinEntity, normalizedQuery, routeType, activePeriod, route?.params?.source, contextSummary, profileParams]);

  const shareProfile = useCallback(async () => {
    await Share.share({
      message: `${normalizedQuery} · ${typeLabelFromValue(routeType)}\n${executiveSummary.headline}\n${executiveSummary.body}`
    });
  }, [normalizedQuery, routeType, executiveSummary]);

  const quickActions = useMemo(
    () => [
      {
        key: 'compare',
        label: 'Comparar entidade',
        icon: 'swap-horizontal-outline',
        tone: 'accent',
        onPress: goToSearch
      },
      {
        key: 'recurrence',
        label: 'Ver recorrência',
        icon: 'repeat-outline',
        tone: 'secondary',
        onPress: openTimeline
      },
      {
        key: 'reading',
        label: 'Abrir leitura',
        icon: 'sparkles-outline',
        tone: 'primary',
        onPress: openReading
      },
      {
        key: 'graph',
        label: 'Ver conexões',
        icon: 'git-network-outline',
        tone: 'secondary',
        onPress: goToGraph
      },
      {
        key: 'export',
        label: 'Exportar',
        icon: 'download-outline',
        tone: 'action',
        onPress: goToExport
      },
      {
        key: 'share',
        label: 'Compartilhar',
        icon: 'share-social-outline',
        tone: 'muted',
        onPress: shareProfile
      },
      {
        key: 'pin',
        label: 'Fixar investigação',
        icon: isPinned ? 'bookmark' : 'bookmark-outline',
        tone: 'primary',
        selected: isPinned,
        onPress: togglePin
      }
    ],
    [goToSearch, openTimeline, openReading, goToGraph, goToExport, shareProfile, isPinned, togglePin]
  );

  const openProfile = (nextType, nextQuery) => {
    const params = buildProfileParams({ type: nextType, q: nextQuery, source: 'FinancialProfileLauncher' });
    if (!params.q || !isValidType(params.type)) return;
    navigation.setParams({ type: params.type, q: params.q });
  };

  if (!hasValidParams) {
    return (
      <DossierLauncher
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        query={query}
        setQuery={setQuery}
        openProfile={openProfile}
      />
    );
  }

  if (queryResult.isError) {
    return (
      <AppScreen padded>
        <SmartErrorState error={queryResult.error} onRetry={() => queryResult.refetch()} />
        <AppButton
          label="Tentar outra entidade"
          variant="ghost"
          onPress={() => navigation.setParams({ type: undefined, q: undefined })}
          style={{ marginTop: theme.spacing.lg }}
        />
      </AppScreen>
    );
  }

  if (queryResult.isPending) {
    return <FinancialProfileLoadingState />;
  }

  if (!profile) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="person-circle-outline"
          title="Dossiê ainda sem densidade analítica"
          description="Tente outra entidade, amplie o período ou refine a busca para gerar um contexto investigativo mais claro."
        />
        <AppButton
          label="Tentar outra entidade"
          variant="ghost"
          onPress={() => navigation.setParams({ type: undefined, q: undefined })}
          style={{ marginTop: theme.spacing.lg }}
        />
        <InfoHint
          text="Se você estiver explorando recorrência ou vínculos, abra a Busca Inteligente e refine por pessoa, banco, método ou categoria."
          tone="primary"
          style={{ marginTop: theme.spacing.md }}
        />
      </AppScreen>
    );
  }

  const typeLabel = VALID_TYPES.find((t) => t.value === routeType)?.label ?? routeType;
  const hasPatternData =
    methods.length > 0 ||
    profileCategories.length > 0 ||
    typeof profile.score === 'number';

  return (
    <AppScreen scroll refreshing={queryResult.isFetching} onRefresh={() => queryResult.refetch()}>
      <FinancialProfileHeroCard
        visualIdentity={visualIdentity}
        typeLabel={typeLabel}
        entityName={normalizedQuery}
        archetype={safeText(profile.archetype || profile.persona || profile.profile, 'Perfil Financeiro')}
        periodLabel={periodLabel}
        summary={safeText(profile.summary || profile.description, 'Dossiê contextual pronto para leitura.')}
        executiveSummary={executiveSummary}
        relevanceScore={relevanceScore}
        metrics={heroMetrics}
      />

      <InvestigationHeader
        navigation={navigation}
        summary={
          safeText(profile?.summary || profile?.description, '').trim() ||
          contextSummary ||
          `${relatedTransactions.length} transações ligadas · ${methods.length} métodos detectados`
        }
      />
      <InvestigationBreadcrumbs navigation={navigation} />
      <FinancialQuickActions items={quickActions} />

      <View style={localStyles.kpiGrid}>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>{profileSnapshot.transactionCount || relationship?.count || 0}</Text>
          <Text style={localStyles.kpiLabel}>entradas e saídas</Text>
        </AppCard>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>{formatBRLCompact(profileSnapshot.totalReceived || 0)}</Text>
          <Text style={localStyles.kpiLabel}>entradas</Text>
        </AppCard>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>{formatBRLCompact(profileSnapshot.totalSent || 0)}</Text>
          <Text style={localStyles.kpiLabel}>saídas</Text>
        </AppCard>
      </View>
      <View style={localStyles.kpiGrid}>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>{profileSnapshot.recurringCount || 0}</Text>
          <Text style={localStyles.kpiLabel}>recorrências</Text>
        </AppCard>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>
            {profileSnapshot.concentration != null ? `${Math.round(profileSnapshot.concentration)}%` : '—'}
          </Text>
          <Text style={localStyles.kpiLabel}>concentração</Text>
        </AppCard>
        <AppCard style={localStyles.kpiCard}>
          <Text style={localStyles.kpiValue}>
            {profileSnapshot.confidence != null
              ? `${Math.round(profileSnapshot.confidence <= 1 ? profileSnapshot.confidence * 100 : profileSnapshot.confidence)}%`
              : '—'}
          </Text>
          <Text style={localStyles.kpiLabel}>confiança</Text>
        </AppCard>
      </View>

      <MoneyFlowVisualizationCard flow={moneyFlow} />
      <EntitySignalsPanel signals={entitySignals} />
      <MiniTimelineCard points={timelinePoints} narrative={timelineNarrative} />
      <RelationshipSnapshotCard snapshot={relationshipSnapshot} onOpenGraph={goToGraph} />

      {/* ── Como você se relaciona ────────────────────────────────── */}
      {relationship ? (
        <AppCard variant="elevated" style={localStyles.relationCard}>
          <Text style={localStyles.cardTitle}>Como você se relaciona</Text>
          <View style={localStyles.relationRow}>
            {relationship.count != null ? (
              <View style={localStyles.relationStat}>
                <Text style={localStyles.relationValue}>{relationship.count}</Text>
                <Text style={localStyles.relationLabel}>transações</Text>
              </View>
            ) : null}
            {relationship.count != null && relationship.total != null ? (
              <View style={localStyles.relationDivider} />
            ) : null}
            {relationship.total != null ? (
              <View style={localStyles.relationStat}>
                <Text style={localStyles.relationValue}>
                  {formatBRLCompact(toNumber(relationship.total))}
                </Text>
                <Text style={localStyles.relationLabel}>movimentados</Text>
              </View>
            ) : null}
            {(relationship.count != null || relationship.total != null) &&
            relationship.avg != null ? (
              <View style={localStyles.relationDivider} />
            ) : null}
            {relationship.avg != null ? (
              <View style={localStyles.relationStat}>
                <Text style={localStyles.relationValue}>
                  {formatBRLCompact(toNumber(relationship.avg))}
                </Text>
                <Text style={localStyles.relationLabel}>ticket médio</Text>
              </View>
            ) : null}
          </View>

          {largestTx ? (
            <View style={localStyles.largestTxRow}>
              <Ionicons name="trending-up-outline" size={14} color={theme.colors.muted} />
              <Text style={localStyles.largestTxText}>
                Maior transação:{' '}
                <Text style={{ color: theme.colors.text, fontWeight: theme.typography.weight.semibold }}>
                  {formatBRL(toNumber(largestTx.amount ?? largestTx.value ?? largestTx))}
                </Text>
              </Text>
            </View>
          ) : null}
        </AppCard>
      ) : null}

      {/* ── Padrões detectados ────────────────────────────────────── */}
      {hasPatternData ? (
        <>
          <SectionHeader
            title="Padrões detectados"
            subtitle="Métodos e categorias neste perfil"
          />

          {typeof profile.score === 'number' ? (
            <MetricProgressBar
              label="Score de relacionamento"
              value={profile.score}
              total={100}
              tone={profile.score >= 70 ? 'positive' : profile.score >= 40 ? 'accent' : 'negative'}
              caption={`${Math.round(profile.score)}/100`}
              style={{ marginBottom: theme.spacing.md }}
            />
          ) : null}

          {methods.length > 0 ? (
            <AppCard style={localStyles.rankCard}>
              <Text style={localStyles.cardTitle}>Métodos de pagamento</Text>
              <RankingList
                items={methods}
                labelKey="label"
                valueKey="value"
                tone="secondary"
                maxItems={5}
              />
            </AppCard>
          ) : null}

          {profileCategories.length > 0 ? (
            <AppCard style={[localStyles.rankCard, { marginTop: theme.spacing.md }]}>
              <Text style={localStyles.cardTitle}>Categorias</Text>
              <RankingList
                items={profileCategories}
                labelKey="label"
                valueKey="value"
                tone="primary"
                maxItems={5}
              />
            </AppCard>
          ) : null}
        </>
      ) : null}

      {/* ── Sinais importantes ────────────────────────────────────── */}
      {highlights.length ? (
        <>
          <SectionHeader
            title="Sinais importantes"
            subtitle="O que mais define o padrão encontrado"
          />
          {highlights.map((h, i) => (
            <InsightCard
              key={buildStableKey(
                typeof h === 'string' ? h : h?.id,
                typeof h === 'string' ? h : h?.type,
                typeof h === 'string' ? h : h?.title || h?.name || h?.normalizedName,
                typeof h === 'string' ? 'highlight' : h?.timestamp || h?.createdAt,
                i + 1
              )}
              icon={typeof h === 'string' ? 'flash-outline' : safeText(h.icon, 'flash-outline')}
              tone={typeof h === 'string' ? 'primary' : h.tone || 'primary'}
              title={
                typeof h === 'string'
                  ? h
                  : safeText(h.title || h.name || h.normalizedName, 'Insight')
              }
              description={
                typeof h === 'string'
                  ? null
                  : safeText(h.description || h.summary || h.relationshipSummary)
              }
              footer={
                typeof h === 'string' ? null : (
                  <Text
                    onPress={() =>
                      openInsightDetails(navigation, {
                        insight: h,
                        ...profileSnapshot
                      })
                    }
                    style={localStyles.insightLink}
                  >
                    Abrir explicação →
                  </Text>
                )
              }
              style={{ marginBottom: theme.spacing.md }}
            />
          ))}
        </>
      ) : null}

      {/* ── Indicadores ───────────────────────────────────────────── */}
      {metrics.length ? (
        <AppCard variant="elevated" style={{ marginTop: theme.spacing.lg }}>
          <Text style={localStyles.cardTitle}>Indicadores</Text>
          {metrics.map((m, i) => (
            <View
              key={buildStableKey(m.id, m.type, m.label, m.value, i + 1)}
              style={localStyles.metricRow}
            >
              <Text style={localStyles.metricLabel}>{safeText(m.label, 'Indicador')}</Text>
              <Text style={localStyles.metricValue} numberOfLines={1}>
                {typeof m.value === 'number'
                  ? m.value.toLocaleString('pt-BR')
                  : safeText(m.value, '—')}
              </Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {/* ── Recomendações ─────────────────────────────────────────── */}
      {recommendations.length ? (
        <>
          <SectionHeader title="Recomendações" subtitle="Próximos passos sugeridos" />
          <AppCard variant="outline">
            {recommendations.map((r, i) => (
              <View
                key={buildStableKey(
                  typeof r === 'string' ? r : r?.id,
                  typeof r === 'string' ? r : r?.type,
                  typeof r === 'string' ? r : r?.text || r?.title || r?.summary,
                  i + 1
                )}
                style={localStyles.recRow}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={theme.colors.accent}
                  style={{ marginTop: 2 }}
                />
                <Text style={localStyles.recText} numberOfLines={4}>
                  {typeof r === 'string'
                    ? r
                    : safeText(r.text || r.title || r.summary || r.relationshipSummary, '—')}
                </Text>
              </View>
            ))}
          </AppCard>
        </>
      ) : null}

      {/* ── Transações relacionadas ───────────────────────────────── */}
      {relatedTransactions.length > 0 ? (
        <>
          <SectionHeader
            title="Transações relacionadas"
            subtitle="Toque para ver o detalhe completo"
          />
          <AppCard variant="outline" style={localStyles.timelineCard}>
            <Text style={localStyles.cardTitle}>Timeline e contexto</Text>
            <Text style={localStyles.timelineText}>
              Entenda sequência temporal, agrupamentos e movimentos conectados a {normalizedQuery}.
            </Text>
            <View style={localStyles.timelineActions}>
              <AppButton
                label="Abrir timeline"
                size="sm"
                fullWidth={false}
                onPress={() =>
                  openTimelineAnalysis(navigation, {
                    title: `Timeline de ${normalizedQuery}`,
                    items: relatedTransactions,
                    ...profileSnapshot
                  })
                }
              />
              <AppButton
                label="Ver todas"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={() =>
                  openRelatedTransactions(navigation, {
                    title: `Relacionadas a ${normalizedQuery}`,
                    items: relatedTransactions,
                    ...profileSnapshot
                  })
                }
              />
            </View>
          </AppCard>
          {relatedTransactions.map((rt, idx) => (
            <TransactionRow
              key={buildStableKey(rt?.id, rt?.date, rt?.description, rt?.amount, rt?.merchant, idx + 1)}
              transaction={rt}
              onPress={() => {
                if (!rt?.id) return;
                navigation.navigate('TransactionDetails', { transactionId: rt.id });
              }}
            />
          ))}
        </>
      ) : null}

      <InvestigationRail
        title="Entidades fixadas"
        subtitle="Dossiês prioritários na sua investigação"
        icon="bookmark-outline"
        items={investigationState.pinnedEntities}
        onItemPress={(item) =>
          openProfile(item.type || 'person', item.entity || '')
        }
      />

      <InvestigationRail
        title="Investigações recentes"
        subtitle="Saltos rápidos entre contextos analisados"
        items={investigationState.recentInvestigations}
        onItemPress={(item) => openProfile(item.type || 'person', item.entity || '')}
      />

      {/* ── Rodapé ────────────────────────────────────────────────── */}
      <AppButton
        label="Nova busca"
        variant="ghost"
        onPress={() => navigation.setParams({ type: undefined, q: undefined })}
        style={{ marginTop: theme.spacing.xl }}
      />
      <View style={{ height: theme.spacing.xxxl }} />
    </AppScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  heroBlock: { paddingTop: theme.spacing.lg },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  heroText: { flex: 1 },
  archetype: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    lineHeight: 32
  },
  entityBadge: {
    fontSize: theme.typography.size.sm,
    marginTop: 2,
    fontWeight: theme.typography.weight.semibold
  },
  summary: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.sm,
    lineHeight: 22
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    flexWrap: 'wrap'
  },
  confBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5
  },
  confText: { fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.medium },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5
  },
  periodText: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium
  },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  actionBtn: { alignItems: 'center', flex: 1, gap: theme.spacing.xs },
  actionBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnLabel: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg
  },
  kpiValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold
  },
  kpiLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: 4,
    textAlign: 'center'
  },

  moneyFlowCard: { marginTop: theme.spacing.lg },
  flowBarTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md
  },
  flowBarSegment: { borderRadius: 5 },
  flowLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  flowLegendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  flowDot: { width: 8, height: 8, borderRadius: 4 },
  flowLegendLabel: { color: theme.colors.muted, fontSize: theme.typography.size.sm },
  flowLegendValue: { fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold },
  flowHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  flowHint: { flex: 1, color: theme.colors.muted, fontSize: theme.typography.size.sm, lineHeight: 18 },

  relationCard: { marginTop: theme.spacing.lg },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  relationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  relationStat: { alignItems: 'center' },
  relationValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold
  },
  relationLabel: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  relationDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: theme.colors.border
  },
  largestTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  largestTxText: { color: theme.colors.muted, fontSize: theme.typography.size.sm, flex: 1 },

  rankCard: { marginTop: theme.spacing.md },

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  metricLabel: { color: theme.colors.muted, flex: 1, paddingRight: 8, fontSize: theme.typography.size.md },
  metricValue: {
    color: theme.colors.text,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.md
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
    color: theme.colors.textSubtle,
    flex: 1,
    lineHeight: 22,
    fontSize: theme.typography.size.md
  },
  insightLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  timelineCard: {
    marginBottom: theme.spacing.md
  },
  timelineText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 20
  },
  timelineActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10
  },
  chipIdle: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  chipPressed: { opacity: 0.86 },
  chipText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  chipTextSelected: { color: theme.colors.text },

  launcherCard: { marginTop: theme.spacing.lg },
  examplesWrap: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl
  },
  exampleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg
  },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  exampleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exampleContent: { flex: 1 },
  exampleTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  exampleType: { color: theme.colors.muted, fontSize: theme.typography.size.sm, marginTop: 2 }
});
