import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { theme } from '@theme/index';
import { formatBRL } from '@utils/money';
import { formatShortDate } from '@utils/date';
import { safeText } from '@utils/safeText';
import { fetchAnalyticsReports } from '../api/analyticsApi';

function formatDateSafe(value) {
  if (!value) return '—';
  try {
    return formatShortDate(new Date(value));
  } catch {
    return '—';
  }
}

export function ExportScreen({ route }) {
  const title = safeText(route?.params?.title, 'Exportar dossiê');
  const scope = safeText(route?.params?.q || route?.params?.query, 'contexto atual');

  const reportQuery = useQuery({
    queryKey: ['export-reports-preview'],
    queryFn: () => fetchAnalyticsReports(),
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const report = reportQuery.data;
  const hasReport = Boolean(report && !reportQuery.isError);

  return (
    <AppScreen scroll>
      <LinearGradient
        colors={['rgba(251,155,54,0.2)', 'rgba(6,182,212,0.12)', 'rgba(157,255,44,0.08)']}
        style={styles.hero}
      >
        <View style={styles.pill}>
          <Ionicons name="bar-chart-outline" size={16} color={theme.colors.action} />
          <Text style={styles.pillText}>Prévia do relatório</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Resumo analítico de {scope}. Download em PDF e CSV será habilitado em versão futura — o endpoint POST /api/ledger/analytics/export está previsto para S2.
        </Text>
      </LinearGradient>

      {/* Resumo real do relatório */}
      <AppCard variant="elevated">
        <Text style={styles.sectionTitle}>
          {reportQuery.isPending ? 'Carregando resumo...' : hasReport ? 'Resumo do conteúdo' : 'Escopo recebido'}
        </Text>

        {reportQuery.isPending ? (
          <View style={styles.skeletonBlock}>
            <LoadingSkeleton width="70%" height={14} />
            <LoadingSkeleton width="55%" height={14} style={{ marginTop: theme.spacing.md }} />
            <LoadingSkeleton width="65%" height={14} style={{ marginTop: theme.spacing.md }} />
            <LoadingSkeleton width="45%" height={14} style={{ marginTop: theme.spacing.md }} />
          </View>
        ) : hasReport ? (
          <>
            <View style={styles.statRow}>
              <Ionicons name="list-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.statLabel}>Transações</Text>
              <Text style={styles.statValue}>{report.transactionsCount ?? 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.statLabel}>Período</Text>
              <Text style={styles.statValue}>
                {formatDateSafe(report.period?.start)} → {formatDateSafe(report.period?.end)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="arrow-up-circle-outline" size={16} color={theme.colors.danger} />
              <Text style={styles.statLabel}>Total gasto</Text>
              <Text style={[styles.statValue, { color: theme.colors.danger }]}>
                {formatBRL(report.totals?.totalExpenses ?? 0)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="arrow-down-circle-outline" size={16} color={theme.colors.success} />
              <Text style={styles.statLabel}>Total recebido</Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {formatBRL(report.totals?.totalIncome ?? 0)}
              </Text>
            </View>
            {Array.isArray(report.byCategory) && report.byCategory.length > 0 ? (
              <View style={styles.statRow}>
                <Ionicons name="grid-outline" size={16} color={theme.colors.muted} />
                <Text style={styles.statLabel}>Categorias</Text>
                <Text style={styles.statValue}>{report.byCategory.length}</Text>
              </View>
            ) : null}
            {Array.isArray(report.byMerchant) && report.byMerchant.length > 0 ? (
              <View style={styles.statRow}>
                <Ionicons name="storefront-outline" size={16} color={theme.colors.muted} />
                <Text style={styles.statLabel}>Estabelecimentos</Text>
                <Text style={styles.statValue}>{report.byMerchant.length}</Text>
              </View>
            ) : null}
            {Array.isArray(report.anomalies) && report.anomalies.length > 0 ? (
              <View style={styles.statRow}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
                <Text style={styles.statLabel}>Anomalias detectadas</Text>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {report.anomalies.length}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.meta}>Tipo: {safeText(route?.params?.type, '—')}</Text>
            <Text style={styles.meta}>Query: {safeText(route?.params?.q, '—')}</Text>
            <Text style={styles.meta}>Entity ID: {safeText(route?.params?.entityId, '—')}</Text>
            <Text style={styles.meta}>Origem: {safeText(route?.params?.source, '—')}</Text>
          </>
        )}
      </AppCard>

      <AppCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.colors.muted} />
          <Text style={styles.infoText}>
            Esta tela exibe uma prévia dos dados disponíveis para exportação. O download real (PDF/CSV) ainda não está implementado no backend — está previsto como endpoint <Text style={styles.infoCode}>POST /api/ledger/analytics/export</Text> na Sprint S2.
          </Text>
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(13,13,26,0.58)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6
  },
  pillText: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.lg
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
    marginTop: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  skeletonBlock: {
    gap: theme.spacing.sm
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  statLabel: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm
  },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  meta: {
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.sm
  },
  infoCard: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxxl
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm
  },
  infoText: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 20
  },
  infoCode: {
    fontFamily: 'monospace',
    color: theme.colors.secondary,
    fontSize: theme.typography.size.xs
  }
});
