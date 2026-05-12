import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppInput } from '@components/AppInput';
import { InvestigationBreadcrumbs } from '@components/InvestigationBreadcrumbs';
import { InvestigationHeader } from '@components/InvestigationHeader';
import { InvestigationRail } from '@components/InvestigationRail';
import { AppScreen } from '@components/AppScreen';
import { ErrorState } from '@components/ErrorState';
import { InfoHint } from '@components/InfoHint';
import { InsightBadge } from '@components/InsightBadge';
import { ListSkeleton } from '@components/LoadingSkeleton';
import { RankingList } from '@components/RankingList';
import { SmartEmptyState } from '@components/SmartEmptyState';
import { TransactionRow } from '@components/TransactionRow';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import { buildProfileParams, openFinancialProfile } from '@utils/analyticsNavigation';
import { formatBRLCompact } from '@utils/money';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { searchLedger } from '../api/searchApi';

const PROFILE_TYPE_LABELS = {
  person: 'Pessoa',
  merchant: 'Empresa',
  bank: 'Banco',
  paymentMethod: 'Método',
  category: 'Categoria'
};

const QUICK_EXAMPLES = ['PIX', 'Nubank', 'Amazon', 'Mercado', 'Enilton'];
const SEARCH_SUGGESTIONS = ['iFood', 'Uber', 'Salário', 'Bradesco', 'Boleto'];

function inferProfileType(value) {
  const n = String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
  if (!n) return 'person';
  if (['PIX', 'TED', 'DOC', 'BOLETO', 'CREDITO', 'DEBITO', 'TRANSFERENCIA'].some((k) => n.includes(k))) return 'paymentMethod';
  if (['NUBANK', 'ITAU', 'BANCO', 'BRADESCO', 'SANTANDER', 'INTER', 'C6', 'CAIXA'].some((k) => n.includes(k))) return 'bank';
  if (['MERCADO', 'IFOOD', 'UBER', 'AMAZON', 'PREZUNIC', 'SHOPPEE', 'MAGALU'].some((k) => n.includes(k))) return 'merchant';
  if (['TRANSFERENCIAS', 'ALIMENTACAO', 'TRANSPORTE', 'SALARIO'].some((k) => n.includes(k))) return 'category';
  return 'person';
}

function normalize(payload) {
  if (Array.isArray(payload)) return { items: payload, meta: null };
  return {
    items: payload?.transactions || payload?.results || payload?.items || [],
    meta: payload?.meta || payload?.summary || null
  };
}

function ExampleChip({ label, onPress }) {
  return (
    <Pressable
      onPress={() => onPress(label)}
      android_ripple={{ color: theme.colors.secondarySoft }}
      style={({ pressed }) => [styles.exChip, pressed && styles.exChipPressed]}
    >
      <Text style={styles.exChipText}>{label}</Text>
    </Pressable>
  );
}

function buildResultStats(items) {
  if (!items.length) return null;
  const total = items.reduce((s, tx) => s + Math.abs(Number(tx?.amount ?? 0)), 0);
  const maxTx = items.reduce(
    (best, tx) => (Math.abs(Number(tx?.amount ?? 0)) > Math.abs(Number(best?.amount ?? 0)) ? tx : best),
    items[0]
  );
  const methodCounts = items.reduce((acc, tx) => {
    const m = String(tx?.paymentMethod ?? tx?.method ?? 'Outro').trim();
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { count: items.length, total, maxTx, topMethod };
}

function buildCategoryRanking(items) {
  if (!items.length) return [];
  const acc = items.reduce((map, tx) => {
    const cat = String(tx?.category ?? 'Outros').trim();
    map[cat] = (map[cat] || 0) + Math.abs(Number(tx?.amount ?? 0));
    return map;
  }, {});
  return Object.entries(acc)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function methodBadgeVariant(method) {
  if (!method) return null;
  const m = method.toLowerCase();
  if (m.includes('pix')) return 'pix';
  if (m.includes('débito') || m.includes('debito')) return 'debito';
  if (m.includes('crédito') || m.includes('credito')) return 'credito';
  if (m.includes('transfer')) return 'transferencia';
  if (m.includes('boleto')) return 'boleto';
  return null;
}

export function FinancialSearchScreen({ navigation, route }) {
  const { state: investigationState } = useInvestigation();
  const prefill = route?.params?.prefill ?? '';
  const [term, setTerm] = useState(typeof prefill === 'string' ? prefill : '');

  useEffect(() => {
    if (typeof prefill === 'string' && prefill.trim()) setTerm(prefill.trim());
  }, [prefill]);

  const debounced = useDebouncedValue(term.trim(), 400);
  const enabled = debounced.length >= 2;

  const query = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchLedger({ q: debounced, query: debounced, limit: 100 }),
    enabled
  });

  const { items, meta } = normalize(query.data);
  const dossierType = inferProfileType(term);
  const dossierQuery = term.trim();
  const dossierParams = buildProfileParams({ type: dossierType, q: dossierQuery, source: 'FinancialSearch' });
  const canOpenDossier = enabled && dossierQuery.length >= 2;

  const resultStats = useMemo(() => buildResultStats(items), [items]);
  const categoryRanking = useMemo(() => buildCategoryRanking(items), [items]);

  useInvestigationScreen(
    {
      screen: 'FinancialSearch',
      routeKey: route?.key,
      label: dossierQuery || 'Busca',
      activeEntity: dossierQuery || investigationState.activeEntity,
      activeType: dossierQuery ? dossierType : investigationState.activeType,
      activePeriod: investigationState.activePeriod,
      source: route?.params?.source || 'FinancialSearch',
      params: { prefill: dossierQuery || prefill, source: route?.params?.source || 'FinancialSearch' },
      summary: meta?.headline || meta?.subheadline || (dossierQuery ? `Busca por ${dossierQuery}` : 'Busca contextual'),
      trackRecent: Boolean(dossierQuery)
    },
    [route?.key, route?.params?.source, dossierQuery, dossierType, meta?.headline, meta?.subheadline, prefill, investigationState.activeEntity, investigationState.activeType, investigationState.activePeriod]
  );

  return (
    <AppScreen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Busca Inteligente</Text>
        <Text style={styles.subtitle}>Pesquise pessoas, empresas, bancos, métodos ou categorias.</Text>
        <InvestigationHeader
          navigation={navigation}
          summary={meta?.headline || meta?.subheadline || (dossierQuery ? `Buscando padrões ligados a ${dossierQuery}` : '')}
        />
        <InvestigationBreadcrumbs navigation={navigation} />

        <AppInput
          placeholder="ex: Nubank, iFood, PIX, Enilton…"
          value={term}
          onChangeText={setTerm}
          leftIcon={<Ionicons name="search" size={18} color={theme.colors.muted} />}
          containerStyle={{ marginTop: theme.spacing.md }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examplesRow}
        >
          {QUICK_EXAMPLES.map((ex) => (
            <ExampleChip key={ex} label={ex} onPress={setTerm} />
          ))}
        </ScrollView>

        <InfoHint
          text="A busca cruza descrição, categoria, estabelecimento, banco e período."
          tone="info"
          style={{ marginTop: theme.spacing.sm }}
        />

        {/* Meta card from API */}
        {meta?.headline ? (
          <AppCard variant="outline" style={styles.metaCard}>
            <Text style={styles.metaTitle}>{meta.headline}</Text>
            {meta.subheadline ? <Text style={styles.metaBody}>{meta.subheadline}</Text> : null}
            <Text style={styles.metaHint}>
              Tipo sugerido: {PROFILE_TYPE_LABELS[dossierType] || dossierType}
            </Text>
          </AppCard>
        ) : null}

        {/* Result stats panel */}
        {resultStats && !query.isPending ? (
          <AppCard variant="elevated" style={styles.resultPanel}>
            <View style={styles.resultRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{resultStats.count}</Text>
                <Text style={styles.resultStatLabel}>encontradas</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{formatBRLCompact(resultStats.total)}</Text>
                <Text style={styles.resultStatLabel}>movimentados</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{formatBRLCompact(Math.abs(resultStats.maxTx?.amount ?? 0))}</Text>
                <Text style={styles.resultStatLabel}>maior</Text>
              </View>
            </View>
            {resultStats.topMethod ? (
              <View style={styles.methodRow}>
                <Text style={styles.methodLabel}>Método predominante</Text>
                <InsightBadge
                  variant={methodBadgeVariant(resultStats.topMethod)}
                  label={resultStats.topMethod}
                  size="sm"
                />
              </View>
            ) : null}
          </AppCard>
        ) : null}

        {/* Dossier CTA */}
        {canOpenDossier ? (
          <Pressable
            onPress={() => openFinancialProfile(navigation, dossierParams)}
            android_ripple={{ color: theme.colors.accentSoft }}
            style={({ pressed }) => [styles.dossierCta, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.dossierCtaIcon}>
              <Ionicons name="person-circle-outline" size={20} color={theme.colors.accent} />
            </View>
            <View style={styles.dossierCtaText}>
              <Text style={styles.dossierCtaTitle}>Abrir dossiê financeiro</Text>
              <Text style={styles.dossierCtaSub}>
                {dossierParams.q} · {PROFILE_TYPE_LABELS[dossierParams.type] || dossierParams.type}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
          </Pressable>
        ) : null}

        <InvestigationRail
          title="Investigações recentes"
          subtitle="Termos e entidades que você investigou"
          items={investigationState.recentInvestigations}
          onItemPress={(item) =>
            item.screen === 'FinancialSearch'
              ? setTerm(item.entity)
              : openFinancialProfile(navigation, {
                  q: item.entity,
                  type: item.type,
                  period: item.period,
                  summary: item.summary
                })
          }
        />
      </View>

      {!enabled ? (
        <View style={styles.body}>
          <SmartEmptyState
            icon="search-outline"
            title="O que você quer investigar?"
            description="Digite ao menos 2 caracteres. A busca encontra padrões em todo o seu histórico financeiro."
            suggestions={QUICK_EXAMPLES}
            onSuggestionPress={setTerm}
          />
        </View>
      ) : query.isError ? (
        <View style={styles.body}>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </View>
      ) : query.isPending ? (
        <View style={styles.body}>
          <ListSkeleton rows={6} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.body}>
          <SmartEmptyState
            icon="leaf-outline"
            title="Nada encontrado"
            description={`Nenhuma transação corresponde a "${debounced}". Tente outro termo.`}
            suggestions={SEARCH_SUGGESTIONS}
            onSuggestionPress={setTerm}
          />
        </View>
      ) : (
        <>
          {categoryRanking.length > 0 ? (
            <View style={styles.rankingBlock}>
              <Text style={styles.rankingTitle}>Distribuição por categoria</Text>
              <RankingList
                items={categoryRanking}
                labelKey="label"
                valueKey="value"
                tone="secondary"
                maxItems={5}
              />
            </View>
          ) : null}
          <FlashList
            data={items}
            keyExtractor={(item, i) => item.id || `${i}-${item.description}`}
            renderItem={({ item }) => (
              <TransactionRow
                transaction={item}
                onPress={() => item.id && navigation.navigate('TransactionDetails', { transactionId: item.id })}
              />
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
        </>
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
  title: { color: theme.colors.text, fontSize: theme.typography.size.display, fontWeight: theme.typography.weight.bold },
  subtitle: { color: theme.colors.muted, fontSize: theme.typography.size.md, marginTop: 2 },
  examplesRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs
  },
  exChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  exChipPressed: { opacity: 0.8 },
  exChipText: { color: theme.colors.textSubtle, fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.medium },
  metaCard: { marginTop: theme.spacing.md },
  metaTitle: { color: theme.colors.text, fontWeight: theme.typography.weight.semibold, fontSize: theme.typography.size.lg },
  metaBody: { color: theme.colors.textSubtle, marginTop: 4, fontSize: theme.typography.size.md },
  metaHint: { color: theme.colors.muted, fontSize: theme.typography.size.sm, marginTop: theme.spacing.sm },
  resultPanel: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  resultStat: { alignItems: 'center' },
  resultStatValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold
  },
  resultStatLabel: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  resultDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: theme.colors.border },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  methodLabel: { color: theme.colors.muted, fontSize: theme.typography.size.sm },
  dossierCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  dossierCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dossierCtaText: { flex: 1 },
  dossierCtaTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  dossierCtaSub: { color: theme.colors.muted, fontSize: theme.typography.size.sm, marginTop: 2 },
  rankingBlock: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  rankingTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  body: { flex: 1, paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg },
  listContent: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }
});
