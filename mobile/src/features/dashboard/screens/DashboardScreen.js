import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ActionCard } from '@components/ActionCard';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { ErrorState } from '@components/ErrorState';
import { FinancialMiniChart } from '@components/FinancialMiniChart';
import { InvestigationRail } from '@components/InvestigationRail';
import { InsightBadge } from '@components/InsightBadge';
import { InsightCard } from '@components/InsightCard';
import { ListSkeleton, LoadingSkeleton } from '@components/LoadingSkeleton';
import { MetricCard } from '@components/MetricCard';
import { MetricProgressBar } from '@components/MetricProgressBar';
import { QuickPeriodChips } from '@components/QuickPeriodChips';
import { RankingList } from '@components/RankingList';
import { ScreenIntro } from '@components/ScreenIntro';
import { SectionHeader } from '@components/SectionHeader';
import { TransactionRow } from '@components/TransactionRow';
import { useAuth } from '@contexts/AuthContext';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import {
  openFinancialProfile,
  openFinancialSearch,
  openIntelligentReading
} from '@utils/analyticsNavigation';
import { toDate } from '@utils/date';
import { formatBRL } from '@utils/money';
import { safeText } from '@utils/safeText';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { buildStableKey } from '@utils/buildStableKey';
import { fetchDashboardSummary } from '../api/dashboardApi';

function extractInsight(summary) {
  if (!summary) return null;
  if (Array.isArray(summary.insights) && summary.insights.length) return summary.insights[0];
  if (summary.insight) return summary.insight;
  if (summary.headline) return { title: summary.headline, description: summary.subheadline };
  return null;
}

function pickRecent(summary) {
  return (summary?.recentTransactions || summary?.transactions || summary?.latestTransactions || []).slice(0, 20);
}

function filterByDays(list, days) {
  if (!days || !list?.length) return list ?? [];
  const cutoff = Date.now() - days * 86_400_000;
  return list.filter((tx) => {
    const d = toDate(tx?.date);
    return d && d.getTime() >= cutoff;
  });
}

function normalizeCategories(summary) {
  const raw = summary?.byCategory || summary?.categories || summary?.topCategories || [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw
    .map((c) => ({
      label: safeText(c.category ?? c.name ?? c.label, '—'),
      value: Math.abs(Number(c.amount ?? c.total ?? c.value ?? 0))
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function healthVariant(savings, income) {
  if (income === 0) return 'sem-dados';
  const ratio = savings / income;
  if (ratio >= 0.1) return 'positivo';
  if (ratio >= 0) return 'atencao';
  return 'alto-gasto';
}

function ClickableMetricCard({ label, value, tone, caption, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [style, pressed && { opacity: 0.88 }]}
    >
      <MetricCard label={label} value={value} tone={tone} caption={caption} />
    </Pressable>
  );
}

export function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { state: investigationState, setActivePeriod, restoreTrailItem } = useInvestigation();
  const [period, setPeriod] = useState(30);

  const query = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => fetchDashboardSummary()
  });

  const summary = query.data;
  const insight = useMemo(() => extractInsight(summary), [summary]);
  const allRecent = useMemo(() => pickRecent(summary), [summary]);
  const recent = useMemo(() => filterByDays(allRecent, period).slice(0, 5), [allRecent, period]);
  const categories = useMemo(() => normalizeCategories(summary), [summary]);

  const balance = summary?.balance ?? summary?.totalBalance ?? summary?.netBalance ?? 0;
  const income = summary?.income ?? summary?.totalIncome ?? 0;
  const expenses = summary?.expenses ?? summary?.totalExpenses ?? 0;
  const savings = summary?.savings ?? summary?.netResult ?? income - expenses;
  const savingsRate = income > 0 ? savings / income : 0;

  const badge = healthVariant(savings, income);

  useInvestigationScreen(
    {
      screen: 'Dashboard',
      label: 'Dashboard',
      activePeriod: period === 7 ? '7d' : period === 30 ? '30d' : period === 90 ? '90d' : '1y',
      source: 'Dashboard',
      trackRecent: false,
      summary: insight?.description || insight?.title || 'Visão executiva'
    },
    [period, insight?.description, insight?.title]
  );

  const goTransactions = useCallback(
    (kindFilter) => {
      navigation.getParent()?.navigate('TransactionsTab', {
        screen: 'Transactions',
        params: { kindFilter }
      });
    },
    [navigation]
  );

  const handleOpenTransaction = useCallback(
    (tx) => {
      if (!tx?.id) return;
      navigation.navigate('TransactionDetails', { transactionId: tx.id });
    },
    [navigation]
  );

  return (
    <AppScreen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <View style={styles.heading}>
        <Text style={styles.hello}>Olá, {user?.name?.split(' ')?.[0] || 'investigador'}</Text>
        <Text style={styles.title}>Sua visão financeira</Text>
      </View>

      <ScreenIntro
        icon="analytics-outline"
        description="Veja um resumo do seu comportamento financeiro e acesse análises importantes."
      />

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <View style={styles.skeletonGrid}>
          <LoadingSkeleton height={110} style={{ flex: 1 }} />
          <LoadingSkeleton height={110} style={{ flex: 1, marginLeft: theme.spacing.md }} />
        </View>
      ) : (
        <>
          {/* Balance card */}
          <AppCard variant="elevated" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo consolidado</Text>
            <Text style={styles.balanceValue}>{formatBRL(balance)}</Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceMini}>
                <Ionicons name="arrow-down-circle" size={14} color={theme.colors.success} />
                <Text style={styles.balanceMiniText}>{formatBRL(income)}</Text>
              </View>
              <View style={styles.balanceMini}>
                <Ionicons name="arrow-up-circle" size={14} color={theme.colors.danger} />
                <Text style={styles.balanceMiniText}>{formatBRL(expenses)}</Text>
              </View>
              <InsightBadge variant={badge} size="sm" />
            </View>
          </AppCard>

          {/* Metric cards */}
          <View style={styles.metricsGrid}>
            <ClickableMetricCard
              label="Receitas"
              value={income}
              tone="positive"
              caption="Ver entradas →"
              onPress={() => goTransactions('INCOME')}
              style={{ flex: 1 }}
            />
            <ClickableMetricCard
              label="Despesas"
              value={expenses}
              tone="negative"
              caption="Ver saídas →"
              onPress={() => goTransactions('EXPENSE')}
              style={{ flex: 1, marginLeft: theme.spacing.md }}
            />
          </View>
          <View style={[styles.metricsGrid, { marginTop: theme.spacing.md }]}>
            <ClickableMetricCard
              label="Resultado"
              value={savings}
              tone={savings >= 0 ? 'accent' : 'negative'}
              caption="Receita − Despesa"
              onPress={() => goTransactions(null)}
              style={{ flex: 1 }}
            />
            <ClickableMetricCard
              label="Categorias"
              value={String((summary?.byCategory?.length ?? summary?.categoriesCount ?? categories.length) || '—')}
              tone="primary"
              caption="Ver por categoria →"
              onPress={() => openFinancialSearch(navigation)}
              style={{ flex: 1, marginLeft: theme.spacing.md }}
            />
          </View>

          {/* Visual summary section */}
          <SectionHeader
            title="Resumo visual"
            subtitle="Composição e distribuição do período"
          />

          <AppCard variant="elevated" style={styles.visualCard}>
            <FinancialMiniChart income={income} expenses={expenses} />
            <View style={styles.barDivider} />
            <MetricProgressBar
              label="Taxa de poupança"
              value={Math.max(savings, 0)}
              total={income || 1}
              tone={savingsRate >= 0.1 ? 'positive' : savingsRate >= 0 ? 'warning' : 'negative'}
              caption={income > 0 ? `${Math.round(savingsRate * 100)}% da receita preservada` : 'Sem dados de receita'}
            />
          </AppCard>

          {categories.length > 0 ? (
            <AppCard style={styles.rankCard}>
              <Text style={styles.rankTitle}>Top categorias de gastos</Text>
              <RankingList
                items={categories}
                labelKey="label"
                valueKey="value"
                tone="negative"
                maxItems={5}
              />
            </AppCard>
          ) : null}

          {/* Insight AI */}
          {insight ? (
            <InsightCard
              icon="sparkles"
              tone="primary"
              title={safeText(insight.title, 'Leitura Inteligente')}
              description={safeText(insight.description || insight.summary, 'Veja a análise completa.')}
              footer={
                <Text
                  onPress={() => openIntelligentReading(navigation, { source: 'DashboardInsight' })}
                  style={styles.insightCta}
                >
                  Abrir Leitura Inteligente →
                </Text>
              }
              style={{ marginTop: theme.spacing.xl }}
            />
          ) : null}

          {/* Shortcuts */}
          <SectionHeader
            title="Investigue agora"
            subtitle="Ferramentas analíticas do FinSync"
            style={{ marginTop: theme.spacing.lg }}
          />

          <View style={styles.actionsBlock}>
            <ActionCard
              icon="search-outline"
              iconColor={theme.colors.secondary}
              iconBg={theme.colors.secondarySoft}
              title="Busca Inteligente"
              subtitle="Pesquise pessoas, bancos e categorias"
              onPress={() => openFinancialSearch(navigation)}
            />
            <ActionCard
              icon="person-circle-outline"
              iconColor={theme.colors.accent}
              iconBg={theme.colors.accentSoft}
              title="Perfil Financeiro"
              subtitle="Abra o dossiê de uma entidade"
              onPress={() => openFinancialProfile(navigation)}
            />
            <ActionCard
              icon="reader-outline"
              iconColor={theme.colors.action}
              iconBg={theme.colors.actionSoft}
              title="Leitura Inteligente"
              subtitle="Análise contextual do seu histórico"
              onPress={() => openIntelligentReading(navigation, { source: 'DashboardAction' })}
            />
          </View>

          {/* Recent transactions */}
          <SectionHeader
            title="Movimentações recentes"
            subtitle={recent.length ? 'Toque para detalhar' : 'Sem lançamentos no período'}
            actionLabel={allRecent.length ? 'Ver tudo' : null}
            onActionPress={() => navigation.getParent()?.navigate('TransactionsTab')}
          />

          <QuickPeriodChips
            selected={period}
            onSelect={(value) => {
              setPeriod(value);
              setActivePeriod(value === 7 ? '7d' : value === 30 ? '30d' : value === 90 ? '90d' : '1y');
            }}
            style={{ marginBottom: theme.spacing.md }}
          />

          <InvestigationRail
            title="Investigações recentes"
            subtitle="Continue de onde parou"
            items={investigationState.recentInvestigations}
            emptyText="As próximas investigações que você abrir aparecerão aqui."
            onItemPress={(item) => {
              restoreTrailItem({
                id: item.id,
                label: item.entity,
                screen: item.screen || 'FinancialProfile',
                params: item.params,
                activeEntity: item.entity,
                activeType: item.type,
                activePeriod: item.period,
                summary: item.summary
              });
              if (item.screen === 'FinancialSearch') {
                openFinancialSearch(navigation, { prefill: item.entity });
                return;
              }
              openFinancialProfile(navigation, {
                q: item.entity,
                type: item.type,
                period: item.period,
                summary: item.summary,
                filters: item.params?.filters
              });
            }}
          />

          <InvestigationRail
            title="Entidades fixadas"
            subtitle="Atalhos para dossiês prioritários"
            icon="bookmark-outline"
            items={investigationState.pinnedEntities}
            emptyText="Fixe entidades críticas no dossiê para acessá-las rapidamente."
            onItemPress={(item) =>
              openFinancialProfile(navigation, {
                q: item.entity,
                type: item.type,
                period: item.period,
                summary: item.summary,
                filters: item.params?.filters
              })
            }
          />

          {recent.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="Nenhum lançamento no período"
              description="Tente um período maior ou sincronize uma conta."
            />
          ) : (
            recent.map((tx) => (
              <TransactionRow
                key={buildStableKey(tx.id, tx.date, tx.description, tx.amount, tx.merchant)}
                transaction={tx}
                onPress={() => handleOpenTransaction(tx)}
              />
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },
  hello: { color: theme.colors.muted, fontSize: theme.typography.size.md, letterSpacing: 0.4 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    marginTop: 2
  },
  skeletonGrid: { flexDirection: 'row', marginTop: theme.spacing.md },
  balanceCard: { backgroundColor: theme.colors.surface2, paddingVertical: theme.spacing.xl },
  balanceLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  balanceValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.hero,
    fontWeight: theme.typography.weight.black,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.2
  },
  balanceFooter: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md, alignItems: 'center' },
  balanceMini: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceMiniText: {
    color: theme.colors.textSubtle,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.sm
  },
  metricsGrid: { flexDirection: 'row', marginTop: theme.spacing.lg },
  visualCard: { gap: theme.spacing.lg },
  barDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border
  },
  rankCard: { marginTop: theme.spacing.md },
  rankTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  insightCta: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.md
  },
  actionsBlock: { gap: theme.spacing.sm, marginBottom: theme.spacing.sm }
});
