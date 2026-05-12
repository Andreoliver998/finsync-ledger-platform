import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { ErrorState } from '@components/ErrorState';
import { ListSkeleton } from '@components/LoadingSkeleton';
import { SectionHeader } from '@components/SectionHeader';
import { TransactionRow } from '@components/TransactionRow';
import { theme } from '@theme/index';
import { normalizeTransaction } from '@utils/analyticsData';
import { safeText } from '@utils/safeText';
import { buildStableKey } from '@utils/buildStableKey';
import { fetchAllTransactions } from '../api/analyticsApi';

export function RelatedTransactionsScreen({ navigation, route }) {
  const title = safeText(route?.params?.title, 'Transações relacionadas');
  const searchQuery = safeText(
    route?.params?.q || route?.params?.search || route?.params?.query,
    ''
  );

  const paramItems = useMemo(
    () => (Array.isArray(route?.params?.items) ? route.params.items.map(normalizeTransaction) : []),
    [route?.params?.items]
  );
  const hasParamItems = paramItems.length > 0;
  const canFetch = !hasParamItems && searchQuery.length > 0;

  // Busca dados reais quando não há itens nos params e há um termo de busca
  const query = useQuery({
    queryKey: ['related-transactions', searchQuery],
    queryFn: () => fetchAllTransactions({ search: searchQuery, limit: 50 }),
    enabled: canFetch,
    staleTime: 2 * 60 * 1000
  });

  const items = useMemo(() => {
    if (hasParamItems) return paramItems;
    const raw = query.data?.transactions ?? query.data ?? [];
    return (Array.isArray(raw) ? raw : []).map(normalizeTransaction);
  }, [hasParamItems, paramItems, query.data]);

  if (canFetch && query.isPending) {
    return (
      <AppScreen padded>
        <ListSkeleton rows={6} />
      </AppScreen>
    );
  }

  if (canFetch && query.isError) {
    return (
      <AppScreen padded>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </AppScreen>
    );
  }

  if (!items.length) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="git-compare-outline"
          title="Nenhuma transação relacionada"
          description="Abra esta tela a partir de um dossiê, insight ou detalhe de transação para ver o contexto completo."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll refreshing={canFetch && query.isFetching} onRefresh={canFetch ? () => query.refetch() : undefined}>
      <AppCard variant="elevated" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.secondary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{items.length} movimentações conectadas ao contexto atual.</Text>
          </View>
        </View>
      </AppCard>

      <SectionHeader title="Lista completa" subtitle="Toque para abrir o detalhe individual" />
      <View style={styles.list}>
        {items.map((item) => (
          <TransactionRow
            key={buildStableKey(item.id, item.date, item.description, item.amount, item.merchant)}
            transaction={item}
            onPress={() => item.id && navigation.navigate('TransactionDetails', { transactionId: item.id })}
          />
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroText: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  },
  list: {
    paddingBottom: theme.spacing.xxxl
  }
});
