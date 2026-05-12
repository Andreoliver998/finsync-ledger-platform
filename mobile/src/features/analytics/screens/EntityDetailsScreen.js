import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { theme } from '@theme/index';
import { normalizeProfile } from '@utils/analyticsData';
import { formatBRL } from '@utils/money';
import { buildProfileParams, openFinancialProfile, openRelationshipGraph } from '@utils/analyticsNavigation';
import { safeText } from '@utils/safeText';
import { fetchFinancialProfile } from '../api/analyticsApi';

export function EntityDetailsScreen({ navigation, route }) {
  // Normaliza campos alternativos antes de buildProfileParams:
  // entity/entityName podem vir de diferentes callers (RelationshipGraph, Search, etc.)
  const rawParams = route?.params || {};
  const normalizedInput = {
    ...rawParams,
    // buildProfileParams já lê: q, query, label, name, counterparty, merchant, description
    // Adicionamos entity e entityName como alias de q para cobertura completa
    q:
      rawParams.q ||
      rawParams.entityName ||
      rawParams.entity ||
      rawParams.name ||
      rawParams.label,
    type: rawParams.type || rawParams.entityType
  };
  const params = buildProfileParams(normalizedInput);
  const name = params.q || safeText(rawParams.label, 'Entidade');
  const canFetch = Boolean((params.type && params.q) || params.entityId);

  const profileQuery = useQuery({
    queryKey: ['entity-details-profile', params.type, params.q, params.entityId],
    queryFn: () =>
      fetchFinancialProfile({
        type: params.type,
        q: params.q,
        entityId: params.entityId
      }),
    enabled: canFetch,
    retry: 1,
    staleTime: 2 * 60 * 1000
  });

  const profile = profileQuery.data ? normalizeProfile(profileQuery.data) : null;

  return (
    <AppScreen scroll>
      <LinearGradient
        colors={['rgba(6,182,212,0.18)', 'rgba(124,58,237,0.18)', 'rgba(157,255,44,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroBadge}>
          <Ionicons name="scan-outline" size={16} color={theme.colors.secondary} />
          <Text style={styles.heroBadgeText}>Prévia de entidade</Text>
        </View>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>
          Use esta superfície para abrir o dossiê completo ou aprofundar os relacionamentos da entidade selecionada.
        </Text>
      </LinearGradient>

      {/* Card com dados reais quando disponíveis, fallback para params */}
      {canFetch ? (
        <AppCard variant="elevated">
          {profileQuery.isPending ? (
            <View style={styles.skeletonBlock}>
              <LoadingSkeleton width="60%" height={14} />
              <LoadingSkeleton width="80%" height={14} style={{ marginTop: theme.spacing.md }} />
              <LoadingSkeleton width="50%" height={14} style={{ marginTop: theme.spacing.md }} />
            </View>
          ) : profile && !profileQuery.isError ? (
            <>
              <Text style={styles.cardTitle}>Resumo financeiro</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Transações</Text>
                  <Text style={styles.metricValue}>{profile.transactionCount}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total enviado</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.danger }]}>
                    {formatBRL(profile.totalSent)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total recebido</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.success }]}>
                    {formatBRL(profile.totalReceived)}
                  </Text>
                </View>
                {profile.score !== null ? (
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Score relacional</Text>
                    <Text style={styles.metricValue}>{Math.round(profile.score * 100)}%</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Contexto recebido</Text>
              <Text style={styles.meta}>Tipo: {safeText(params.type, '—')}</Text>
              <Text style={styles.meta}>Query: {safeText(params.q, '—')}</Text>
              <Text style={styles.meta}>Entity ID: {safeText(params.entityId, '—')}</Text>
              <Text style={styles.meta}>Origem: {safeText(params.source, '—')}</Text>
            </>
          )}
        </AppCard>
      ) : (
        <AppCard variant="elevated">
          <Text style={styles.cardTitle}>Contexto recebido</Text>
          <Text style={styles.meta}>Tipo: {safeText(params.type, '—')}</Text>
          <Text style={styles.meta}>Query: {safeText(params.q, '—')}</Text>
          <Text style={styles.meta}>Entity ID: {safeText(params.entityId, '—')}</Text>
          <Text style={styles.meta}>Origem: {safeText(params.source, '—')}</Text>
        </AppCard>
      )}

      <View style={styles.actions}>
        <AppButton label="Abrir dossiê" onPress={() => openFinancialProfile(navigation, params)} />
        <AppButton
          label="Abrir grafo"
          variant="secondary"
          onPress={() => openRelationshipGraph(navigation, params)}
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(13,13,26,0.55)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6
  },
  heroBadgeText: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.hero,
    fontWeight: theme.typography.weight.black,
    marginTop: theme.spacing.lg
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
    marginTop: theme.spacing.sm
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  meta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.sm
  },
  skeletonBlock: {
    gap: theme.spacing.sm
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.xs
  },
  actions: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl
  }
});
