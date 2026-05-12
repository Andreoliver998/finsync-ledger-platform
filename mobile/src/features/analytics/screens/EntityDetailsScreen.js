import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { theme } from '@theme/index';
import { buildProfileParams, openFinancialProfile, openRelationshipGraph } from '@utils/analyticsNavigation';
import { safeText } from '@utils/safeText';

export function EntityDetailsScreen({ navigation, route }) {
  const params = buildProfileParams(route?.params || {});
  const name = params.q || safeText(route?.params?.label, 'Entidade');

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

      <AppCard variant="elevated">
        <Text style={styles.cardTitle}>Contexto recebido</Text>
        <Text style={styles.meta}>Tipo: {safeText(params.type, '—')}</Text>
        <Text style={styles.meta}>Query: {safeText(params.q, '—')}</Text>
        <Text style={styles.meta}>Entity ID: {safeText(params.entityId, '—')}</Text>
        <Text style={styles.meta}>Origem: {safeText(params.source, '—')}</Text>
      </AppCard>

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
  actions: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl
  }
});
