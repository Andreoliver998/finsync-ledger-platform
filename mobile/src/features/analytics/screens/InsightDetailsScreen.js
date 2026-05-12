import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { theme } from '@theme/index';
import { normalizeInsight } from '@utils/analyticsData';
import { openFinancialProfile, openRelatedTransactions } from '@utils/analyticsNavigation';

export function InsightDetailsScreen({ navigation, route }) {
  const insight = normalizeInsight(route?.params?.insight || route?.params || {});
  const related = Array.isArray(route?.params?.relatedTransactions) ? route.params.relatedTransactions : [];

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
        <Text style={styles.meta}>Entity ID: {insight.entityId || '—'}</Text>
        <Text style={styles.meta}>Transaction ID: {insight.transactionId || '—'}</Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          label="Abrir entidade"
          onPress={() => openFinancialProfile(navigation, route?.params || {})}
        />
        <AppButton
          label="Ver relacionadas"
          variant="secondary"
          onPress={() =>
            openRelatedTransactions(navigation, {
              title: insight.title,
              items: related
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
  actions: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl
  }
});
