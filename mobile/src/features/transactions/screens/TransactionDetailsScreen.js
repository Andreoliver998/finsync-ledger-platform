import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ActionCard } from '@components/ActionCard';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { ErrorState } from '@components/ErrorState';
import { InsightBadge } from '@components/InsightBadge';
import { InsightCard } from '@components/InsightCard';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { SectionHeader } from '@components/SectionHeader';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import {
  openFinancialProfile,
  openFinancialSearch,
  openRelatedTransactions,
  openTimelineAnalysis
} from '@utils/analyticsNavigation';
import { normalizeTransaction } from '@utils/analyticsData';
import { safeText } from '@utils/safeText';
import { buildStableKey } from '@utils/buildStableKey';
import { formatBRL, formatSignedAmount } from '@utils/money';
import { formatLongDate, formatShortDate } from '@utils/date';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { fetchTransactionById } from '../api/transactionsApi';

function getKind(tx) {
  if (tx?.kind) return tx.kind;
  if (typeof tx?.amount === 'number') {
    if (tx.amount > 0) return 'INCOME';
    if (tx.amount < 0) return 'EXPENSE';
  }
  return 'UNKNOWN';
}

function inferType(value) {
  const s = String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
  if (!s) return 'person';
  if (['PIX', 'TED', 'DOC', 'BOLETO', 'CREDITO', 'DEBITO'].some((k) => s.includes(k))) return 'paymentMethod';
  if (['NUBANK', 'ITAU', 'BANCO', 'BRADESCO', 'SANTANDER', 'INTER', 'C6', 'CAIXA'].some((k) => s.includes(k))) return 'bank';
  if (['MERCADO', 'IFOOD', 'UBER', 'AMAZON', 'SHOPPEE', 'MAGALU'].some((k) => s.includes(k))) return 'merchant';
  return 'person';
}

function methodBadgeVariant(method) {
  if (!method) return null;
  const m = String(method).toLowerCase();
  if (m.includes('pix')) return 'pix';
  if (m.includes('débito') || m.includes('debito')) return 'debito';
  if (m.includes('crédito') || m.includes('credito')) return 'credito';
  if (m.includes('transfer')) return 'transferencia';
  if (m.includes('boleto')) return 'boleto';
  return null;
}

function MetaRow({ icon, label, value }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>
        <Ionicons name={icon} size={16} color={theme.colors.muted} />
      </View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
  );
}

function RelatedRow({ rt, onPress }) {
  const kind = rt?.kind || (typeof rt?.amount === 'number' && rt.amount >= 0 ? 'INCOME' : 'EXPENSE');
  const isIncome = kind === 'INCOME';
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [styles.relatedRow, pressed && { opacity: 0.82 }]}
    >
      <View style={styles.relatedLeft}>
        <Text style={styles.relatedTitle} numberOfLines={1}>
          {safeText(rt?.description || rt?.merchant, 'Lançamento')}
        </Text>
        <Text style={styles.relatedSub} numberOfLines={1}>
          {[rt?.category, formatShortDate(rt?.date)].filter(Boolean).join(' • ')}
        </Text>
      </View>
      <Text
        style={[
          styles.relatedAmount,
          isIncome ? { color: theme.colors.success } : { color: theme.colors.danger }
        ]}
      >
        {formatBRL(rt?.amount ?? 0)}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.mutedStrong} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export function TransactionDetailsScreen({ navigation, route }) {
  const { state: investigationState } = useInvestigation();
  const transactionId = route?.params?.transactionId;
  const query = useQuery({
    queryKey: ['transactions', 'detail', transactionId],
    queryFn: () => fetchTransactionById(transactionId),
    enabled: !!transactionId
  });

  const data = query.data;
  const tx = useMemo(() => normalizeTransaction(data?.transaction ?? data ?? {}), [data]);
  const explanation = data?.explanation ?? data?.intelligentReading ?? null;
  const relatedTransactions = useMemo(
    () => (Array.isArray(data?.related ?? data?.similarTransactions) ? (data?.related ?? data?.similarTransactions).map(normalizeTransaction) : []),
    [data]
  );

  const counterparty = safeText(tx?.merchant || tx?.description, '');
  const counterpartyType = inferType(counterparty);

  useInvestigationScreen(
    {
      enabled: Boolean(transactionId && counterparty),
      screen: 'TransactionDetails',
      routeKey: route?.key,
      label: counterparty || 'Transação',
      activeEntity: counterparty || investigationState.activeEntity,
      activeType: counterpartyType || investigationState.activeType,
      activePeriod: investigationState.activePeriod,
      source: 'TransactionDetails',
      params: { transactionId },
      summary: tx?.category || tx?.paymentMethod || 'Detalhe transacional',
      trackRecent: Boolean(counterparty)
    },
    [route?.key, transactionId, counterparty, counterpartyType, investigationState.activeEntity, investigationState.activeType, investigationState.activePeriod, tx?.category, tx?.paymentMethod]
  );

  const goToProfile = useCallback(() => {
    if (!counterparty) return;
    openFinancialProfile(navigation, {
      type: counterpartyType,
      q: counterparty,
      source: 'TransactionDetails',
      transactionId
    });
  }, [navigation, counterparty, counterpartyType, transactionId]);

  const goToSearch = useCallback(() => {
    const term = safeText(tx?.merchant || tx?.description, '');
    openFinancialSearch(navigation, { prefill: term });
  }, [navigation, tx]);

  const goToTimeline = useCallback(() => {
    openTimelineAnalysis(navigation, {
      title: counterparty || 'Timeline da transação',
      items: [tx, ...relatedTransactions],
      transactionId,
      q: counterparty || ''  // permite filtrar por período na TimelineAnalysisScreen se items vier vazio
    });
  }, [navigation, counterparty, relatedTransactions, transactionId, tx]);

  const goToRelatedTransactions = useCallback(() => {
    openRelatedTransactions(navigation, {
      title: counterparty ? `Relacionadas a ${counterparty}` : 'Transações relacionadas',
      items: relatedTransactions,
      transactionId,
      q: counterparty || ''  // habilita busca na RelatedTransactionsScreen se items vier vazio
    });
  }, [navigation, counterparty, relatedTransactions, transactionId]);

  const openRelated = useCallback(
    (rt) => {
      if (!rt?.id) return;
      if (navigation.push) {
        navigation.push('TransactionDetails', { transactionId: rt.id });
      } else {
        navigation.navigate('TransactionDetails', { transactionId: rt.id });
      }
    },
    [navigation]
  );

  if (!transactionId) {
    return (
      <AppScreen padded>
        <ErrorState title="Transação não encontrada" error={{ message: 'ID ausente.' }} />
      </AppScreen>
    );
  }

  if (query.isError) {
    return (
      <AppScreen padded>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </AppScreen>
    );
  }

  if (query.isPending) {
    return (
      <AppScreen padded scroll>
        <LoadingSkeleton width="60%" height={20} />
        <LoadingSkeleton width="40%" height={36} style={{ marginTop: theme.spacing.md }} />
        <LoadingSkeleton width="100%" height={120} style={{ marginTop: theme.spacing.xl }} />
        <LoadingSkeleton width="100%" height={160} style={{ marginTop: theme.spacing.md }} />
      </AppScreen>
    );
  }

  const kind = getKind(tx);
  const amount = Number(tx?.amount ?? 0);

  return (
    <AppScreen scroll>
      <View style={styles.heroBlock}>
        <Text style={styles.category} numberOfLines={1}>
          {safeText(tx?.category || tx?.merchant, 'Lançamento')}
        </Text>
        <Text
          style={[
            styles.amount,
            kind === 'INCOME' && { color: theme.colors.success },
            kind === 'EXPENSE' && { color: theme.colors.danger }
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {kind === 'UNKNOWN' ? formatBRL(amount) : formatSignedAmount(amount, { kind })}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {safeText(tx?.description || tx?.merchant, '—')}
        </Text>
        <View style={styles.badgesRow}>
          <InsightBadge
            variant={kind === 'INCOME' ? 'entrada' : kind === 'EXPENSE' ? 'saida' : 'neutro'}
            size="sm"
          />
          {tx?.paymentMethod ? (
            <InsightBadge
              variant={methodBadgeVariant(tx.paymentMethod)}
              label={safeText(tx.paymentMethod)}
              size="sm"
            />
          ) : null}
        </View>
      </View>

      <SectionHeader title="Ações" subtitle="O que você pode fazer com esta transação" />

      <View style={styles.actionsBlock}>
        {counterparty ? (
          <ActionCard
            icon="person-circle-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accentSoft}
            title="Abrir dossiê da contraparte"
            subtitle={counterparty}
            onPress={goToProfile}
            style={styles.actionItem}
          />
        ) : null}
        <ActionCard
          icon="search-outline"
          iconColor={theme.colors.secondary}
          iconBg={theme.colors.secondarySoft}
          title="Buscar semelhantes"
          subtitle="Ver transações parecidas no histórico"
          onPress={goToSearch}
          style={styles.actionItem}
        />
        <ActionCard
          icon="analytics-outline"
          iconColor={theme.colors.primary}
          iconBg={theme.colors.primarySoft}
          title="Ver contexto financeiro"
          subtitle="Perfil e padrões do período"
          onPress={goToProfile}
          style={styles.actionItem}
        />
        <ActionCard
          icon="git-compare-outline"
          iconColor={theme.colors.secondary}
          iconBg={theme.colors.secondarySoft}
          title="Buscar relacionadas"
          subtitle="Agrupar movimentos parecidos e encadeados"
          onPress={goToRelatedTransactions}
          style={styles.actionItem}
        />
        <ActionCard
          icon="pulse-outline"
          iconColor={theme.colors.action}
          iconBg={theme.colors.actionSoft}
          title="Abrir timeline"
          subtitle="Entender sequência e recorrência"
          onPress={goToTimeline}
          style={styles.actionItem}
        />
      </View>

      <AppCard variant="elevated" style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.cardTitle}>Detalhes</Text>
        <MetaRow icon="calendar-outline" label="Data" value={formatLongDate(tx?.date)} />
        <MetaRow icon="business-outline" label="Banco" value={safeText(tx?.bank)} />
        <MetaRow icon="card-outline" label="Método" value={safeText(tx?.paymentMethod)} />
        <MetaRow icon="pricetag-outline" label="Categoria" value={safeText(tx?.category)} />
        <MetaRow icon="storefront-outline" label="Estabelecimento" value={safeText(tx?.merchant)} />
        <MetaRow icon="layers-outline" label="Origem" value={safeText(tx?.source)} />
        <MetaRow icon="finger-print-outline" label="ID" value={safeText(tx?.id)} />
      </AppCard>

      {explanation ? (
        <InsightCard
          icon="reader-outline"
          tone="primary"
          title={safeText(explanation.title, 'Leitura desta transação')}
          description={safeText(explanation.description || explanation.summary, '')}
          style={{ marginTop: theme.spacing.lg }}
        />
      ) : null}

      {Array.isArray(relatedTransactions) && relatedTransactions.length ? (
        <AppCard style={{ marginTop: theme.spacing.lg }}>
          <Text style={styles.cardTitle}>Movimentos relacionados</Text>
          <Text style={styles.relatedHint}>Toque para ver o detalhe</Text>
          {relatedTransactions.slice(0, 8).map((rt, idx) => (
            <RelatedRow
              key={buildStableKey(rt?.id, rt?.date, rt?.description, rt?.amount, rt?.merchant, idx + 1)}
              rt={rt}
              onPress={() => openRelated(rt)}
            />
          ))}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroBlock: { paddingTop: theme.spacing.lg },
  category: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  amount: {
    color: theme.colors.text,
    fontSize: theme.typography.size.hero,
    fontWeight: theme.typography.weight.black,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.2
  },
  description: {
    color: theme.colors.textSubtle,
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.size.md
  },
  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm
  },
  actionsBlock: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm
  },
  actionItem: {},
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  metaIcon: { width: 24 },
  metaLabel: { color: theme.colors.muted, width: 100, fontSize: theme.typography.size.sm },
  metaValue: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    textAlign: 'right'
  },
  relatedHint: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginBottom: theme.spacing.sm
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  relatedLeft: { flex: 1, paddingRight: 8 },
  relatedTitle: { color: theme.colors.text, fontSize: theme.typography.size.md },
  relatedSub: { color: theme.colors.muted, fontSize: theme.typography.size.xs, marginTop: 2 },
  relatedAmount: { fontWeight: theme.typography.weight.semibold, fontSize: theme.typography.size.md }
});
