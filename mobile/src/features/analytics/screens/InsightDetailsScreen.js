import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { theme } from '@theme/index';
import { normalizeInsight } from '@utils/analyticsData';
import { safeText } from '@utils/safeText';
import { openFinancialProfile, openRelatedTransactions } from '@utils/analyticsNavigation';
import { fetchAllTransactions } from '../api/analyticsApi';

// MongoDB ObjectIds são strings hexadecimais de 24 chars — não servem como texto de busca
function isMongoId(v) {
  return typeof v === 'string' && /^[0-9a-f]{24}$/i.test(v.trim());
}

export function InsightDetailsScreen({ navigation, route }) {
  // Mantém acesso ao payload bruto para extrair campos não normalizados (entity, category, etc.)
  const rawInsightPayload = route?.params?.insight || route?.params || {};
  const insight = normalizeInsight(rawInsightPayload);

  const paramRelated = Array.isArray(route?.params?.relatedTransactions)
    ? route.params.relatedTransactions
    : [];
  const hasParamRelated = paramRelated.length > 0;

  // Derivação de searchQuery em ordem de prioridade:
  // 1. params explícitos: q > search > query
  // 2. insight.entity / entityName do payload bruto (se não for ObjectId)
  // 3. entityId normalizado (se não for ObjectId)
  // 4. category ou paymentMethod do insight como fallback textual
  const searchQuery = safeText(
    route?.params?.q ||
      route?.params?.search ||
      route?.params?.query ||
      (rawInsightPayload.entity && !isMongoId(rawInsightPayload.entity)
        ? rawInsightPayload.entity
        : null) ||
      (rawInsightPayload.entityName && !isMongoId(rawInsightPayload.entityName)
        ? rawInsightPayload.entityName
        : null) ||
      (insight.entityId && !isMongoId(insight.entityId) ? insight.entityId : null) ||
      rawInsightPayload.category ||
      rawInsightPayload.paymentMethod ||
      '',
    ''
  );

  const canFetchRelated = !hasParamRelated && searchQuery.length > 0;

  const relatedQuery = useQuery({
    queryKey: ['insight-related', searchQuery],
    queryFn: () => fetchAllTransactions({ search: searchQuery, limit: 30 }),
    enabled: canFetchRelated,
    staleTime: 2 * 60 * 1000
  });

  const relatedTransactions = useMemo(() => {
    if (hasParamRelated) return paramRelated;
    const raw = relatedQuery.data?.transactions ?? relatedQuery.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [hasParamRelated, paramRelated, relatedQuery.data]);

  const relatedCount = relatedTransactions.length;

  if (!insight.title && !insight.description) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="sparkles-outline"
          title="Insight indisponível"
          description="Abra esta tela a partir de uma leitura inteligente ou de um dossiê com insight selecionado."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <AppCard variant="elevated" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name={insight.icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.description}>{insight.description || 'Sem descrição adicional.'}</Text>
      </AppCard>

      <AppCard style={styles.contextCard}>
        <Text style={styles.sectionTitle}>Contexto</Text>
        <Text style={styles.meta}>Origem: {insight.source || '—'}</Text>
        <Text style={styles.meta}>
          Entidade:{' '}
          {rawInsightPayload.entity ||
            rawInsightPayload.entityName ||
            (!isMongoId(insight.entityId) ? insight.entityId : null) ||
            '—'}
        </Text>
        <Text style={styles.meta}>Transaction ID: {insight.transactionId || '—'}</Text>
        {canFetchRelated && relatedQuery.isPending ? (
          <View style={styles.skeletonRow}>
            <LoadingSkeleton width={160} height={14} />
          </View>
        ) : relatedCount > 0 ? (
          <Text style={styles.metaHighlight}>{relatedCount} transações relacionadas encontradas</Text>
        ) : null}
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          label="Abrir entidade"
          onPress={() => openFinancialProfile(navigation, route?.params || {})}
        />
        <AppButton
          label={relatedCount > 0 ? `Ver ${relatedCount} relacionadas` : 'Ver relacionadas'}
          variant="secondary"
          onPress={() =>
            openRelatedTransactions(navigation, {
              title: insight.title,
              items: relatedTransactions,
              q: searchQuery  // propaga q para que RelatedTransactionsScreen busque se items vier vazio
            })
          }
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: theme.spacing.md
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold
  },
  description: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
    marginTop: theme.spacing.sm
  },
  contextCard: {
    marginTop: theme.spacing.lg
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  meta: {
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.sm
  },
  metaHighlight: {
    color: theme.colors.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    marginTop: theme.spacing.sm
  },
  skeletonRow: {
    marginTop: theme.spacing.sm
  },
  actions: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl
  }
});
