import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppInput } from '@components/AppInput';
import { AppScreen } from '@components/AppScreen';
import { ErrorState } from '@components/ErrorState';
import { InvestigationBreadcrumbs } from '@components/InvestigationBreadcrumbs';
import { InvestigationHeader } from '@components/InvestigationHeader';
import { InsightBadge } from '@components/InsightBadge';
import { ListSkeleton } from '@components/LoadingSkeleton';
import { SmartEmptyState } from '@components/SmartEmptyState';
import { TransactionRow } from '@components/TransactionRow';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import { buildStableKey } from '@utils/buildStableKey';
import { formatBRLCompact } from '@utils/money';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { fetchAllTransactions } from '../api/transactionsApi';

const KIND_CHIPS = [
  { label: 'Todas', icon: 'apps-outline', kindFilter: null, paymentFilter: null },
  { label: 'Entradas', icon: 'arrow-down-circle-outline', kindFilter: 'INCOME', paymentFilter: null },
  { label: 'Saídas', icon: 'arrow-up-circle-outline', kindFilter: 'EXPENSE', paymentFilter: null },
  { label: 'PIX', icon: 'flash-outline', kindFilter: null, paymentFilter: 'pix' },
  { label: 'Débito', icon: 'card-outline', kindFilter: null, paymentFilter: 'debito' },
  { label: 'Crédito', icon: 'card-outline', kindFilter: null, paymentFilter: 'credito' }
];

function detectKind(tx) {
  if (tx?.kind) return tx.kind;
  if (typeof tx?.amount === 'number') {
    if (tx.amount > 0) return 'INCOME';
    if (tx.amount < 0) return 'EXPENSE';
  }
  if (tx?.type === 'income' || tx?.type === 'INCOME') return 'INCOME';
  if (tx?.type === 'expense' || tx?.type === 'EXPENSE') return 'EXPENSE';
  return 'UNKNOWN';
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function FilterChip({ label, icon, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipIdle,
        pressed && styles.chipPressed
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? theme.colors.primary : theme.colors.muted}
      />
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StatsSummaryBar({ filtered, isFiltered }) {
  if (!filtered.length) return null;

  const total = filtered.reduce((s, tx) => s + Math.abs(Number(tx?.amount ?? 0)), 0);
  const maxVal = Math.max(...filtered.map((tx) => Math.abs(Number(tx?.amount ?? 0))));

  return (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{filtered.length}</Text>
        <Text style={styles.statLabel}>transações</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{formatBRLCompact(total)}</Text>
        <Text style={styles.statLabel}>total</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{formatBRLCompact(maxVal)}</Text>
        <Text style={styles.statLabel}>maior</Text>
      </View>
    </View>
  );
}

const SEARCH_SUGGESTIONS = ['PIX', 'Nubank', 'iFood', 'Uber', 'Salário'];

export function TransactionsScreen({ navigation, route }) {
  const { state: investigationState } = useInvestigation();
  const initialKind = route?.params?.kindFilter ?? null;

  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState(() => {
    if (!initialKind) return 0;
    const idx = KIND_CHIPS.findIndex((c) => c.kindFilter === initialKind);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    if (initialKind) {
      const idx = KIND_CHIPS.findIndex((c) => c.kindFilter === initialKind);
      if (idx >= 0) setActiveChip(idx);
    }
  }, [initialKind]);

  const debounced = useDebouncedValue(search, 350);

  const query = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => fetchAllTransactions()
  });

  const rows = useMemo(() => normalizeList(query.data), [query.data]);
  const chip = KIND_CHIPS[activeChip] ?? KIND_CHIPS[0];
  const isFiltered = activeChip !== 0 || !!debounced;
  const contextualEntity = debounced || (chip.label !== 'Todas' ? chip.label : investigationState.activeEntity);

  const filtered = useMemo(() => {
    let list = rows;
    if (chip.kindFilter) list = list.filter((tx) => detectKind(tx) === chip.kindFilter);
    if (chip.paymentFilter) {
      const needle = chip.paymentFilter.toLowerCase();
      list = list.filter((tx) => String(tx?.paymentMethod ?? '').toLowerCase().includes(needle));
    }
    if (debounced) {
      const needle = debounced.toLowerCase();
      list = list.filter((tx) => {
        const hay =
          `${tx.description ?? ''} ${tx.merchant ?? ''} ${tx.category ?? ''} ${tx.bank ?? ''}`.toLowerCase();
        return hay.includes(needle);
      });
    }
    return list;
  }, [rows, chip, debounced]);

  const openDetails = useCallback(
    (tx) => {
      if (!tx?.id) return;
      navigation.navigate('TransactionDetails', { transactionId: tx.id });
    },
    [navigation]
  );

  const clearFilters = useCallback(() => {
    setActiveChip(0);
    setSearch('');
  }, []);

  const emptyDescription = useMemo(() => {
    if (debounced) return `Nenhuma transação encontrada para "${debounced}".`;
    if (chip.kindFilter === 'INCOME') return 'Nenhuma entrada encontrada para este filtro.';
    if (chip.kindFilter === 'EXPENSE') return 'Nenhuma saída encontrada para este filtro.';
    if (chip.paymentFilter) return `Nenhuma transação via ${chip.label} encontrada.`;
    return 'Conecte uma conta ou importe um extrato para ver transações aqui.';
  }, [debounced, chip]);

  const hasData = !query.isError && !query.isPending;

  useInvestigationScreen(
    {
      enabled: isFiltered,
      screen: 'Transactions',
      routeKey: route?.key,
      label: contextualEntity || 'Transações',
      activeEntity: contextualEntity,
      activeType: investigationState.activeType,
      activePeriod: investigationState.activePeriod,
      source: 'Transactions',
      params: { kindFilter: chip.kindFilter, paymentFilter: chip.paymentFilter, q: debounced },
      summary: chip.label !== 'Todas' ? `Filtro ${chip.label}` : debounced ? `Busca por ${debounced}` : 'Transações filtradas',
      trackRecent: Boolean(contextualEntity)
    },
    [isFiltered, route?.key, contextualEntity, investigationState.activeType, investigationState.activePeriod, chip.kindFilter, chip.paymentFilter, chip.label, debounced]
  );

  return (
    <AppScreen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Transações</Text>
            <Text style={styles.subtitle}>{rows.length ? `${rows.length} lançamentos` : '—'}</Text>
          </View>
          {isFiltered ? (
            <InsightBadge
              icon="funnel"
              label="Filtro ativo"
              color={theme.colors.primary}
              bg={theme.colors.primarySoft}
              size="sm"
            />
          ) : null}
        </View>
        {isFiltered ? (
          <>
            <InvestigationHeader
              navigation={navigation}
              summary={debounced ? `Resultados refinados para ${debounced}` : `Recorte financeiro: ${chip.label}`}
            />
            <InvestigationBreadcrumbs navigation={navigation} />
          </>
        ) : null}
        <AppInput
          placeholder="Buscar por descrição, categoria, banco…"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          containerStyle={{ marginTop: theme.spacing.md }}
        />
      </View>

      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {KIND_CHIPS.map((c, i) => (
            <FilterChip
              key={buildStableKey(c.label, c.kindFilter, c.paymentFilter)}
              label={c.label}
              icon={c.icon}
              active={activeChip === i}
              onPress={() => setActiveChip(i)}
            />
          ))}
        </ScrollView>
        {isFiltered ? (
          <AppButton
            label="Limpar"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={clearFilters}
            style={styles.clearBtn}
          />
        ) : null}
      </View>

      {hasData && filtered.length > 0 ? (
        <StatsSummaryBar filtered={filtered} isFiltered={isFiltered} />
      ) : null}

      {query.isError ? (
        <View style={styles.body}>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </View>
      ) : query.isPending ? (
        <View style={styles.body}>
          <ListSkeleton rows={8} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.body}>
          <SmartEmptyState
            icon="receipt-outline"
            title="Sem resultados"
            description={emptyDescription}
            suggestions={debounced ? SEARCH_SUGGESTIONS : null}
            onSuggestionPress={(s) => setSearch(s)}
          />
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id || `${item.description}-${item.date}-${item.amount}`}
          renderItem={({ item }) => (
            <TransactionRow transaction={item} onPress={() => openDetails(item)} />
          )}
          estimatedItemSize={76}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching}
              onRefresh={() => query.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: { color: theme.colors.text, fontSize: theme.typography.size.display, fontWeight: theme.typography.weight.bold },
  subtitle: { color: theme.colors.muted, marginTop: 2 },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.md
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  chipIdle: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  chipPressed: { opacity: 0.8 },
  chipLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  chipLabelActive: { color: theme.colors.text, fontWeight: theme.typography.weight.semibold },
  clearBtn: { marginRight: theme.spacing.sm },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: 'space-around'
  },
  statItem: { alignItems: 'center' },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold
  },
  statLabel: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border
  },
  body: { flex: 1, paddingHorizontal: theme.spacing.xl },
  listContent: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }
});
