import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppButton } from '@components/AppButton';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import {
  openExportScreen,
  openFinancialSearch,
  openIntelligentReading,
  openRelationshipGraph,
  openTimelineAnalysis
} from '@utils/analyticsNavigation';
import { safeText } from '@utils/safeText';

const TYPE_LABELS = {
  person: 'Pessoa',
  merchant: 'Empresa',
  bank: 'Banco',
  paymentMethod: 'Método',
  category: 'Categoria'
};

const PERIOD_LABELS = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '1y': 'Último ano'
};

export function InvestigationHeader({ navigation, summary, style }) {
  const {
    state,
    pinEntity
  } = useInvestigation();

  const activeLabel = safeText(state.activeEntity, '').trim();
  if (!activeLabel) return null;

  const typeLabel = TYPE_LABELS[state.activeType] || safeText(state.activeType, 'Entidade');
  const periodLabel = PERIOD_LABELS[state.activePeriod] || 'Período livre';
  const contextSummary =
    safeText(summary, '').trim() ||
    safeText(state.currentInsight, '').trim() ||
    safeText(state.activeFilters?.summary, '').trim() ||
    `${typeLabel} em investigação`;

  const isPinned = state.pinnedEntities.some(
    (item) => item.entity === state.activeEntity && item.type === state.activeType
  );

  const sharedMessage = [
    `Investigando: ${activeLabel}`,
    `Tipo: ${typeLabel}`,
    `Período: ${periodLabel}`,
    contextSummary
  ]
    .filter(Boolean)
    .join('\n');

  const baseParams = {
    q: state.activeEntity,
    type: state.activeType,
    period: state.activePeriod,
    source: 'InvestigationHeader',
    summary: contextSummary,
    filters: state.activeFilters
  };

  return (
    <LinearGradient
      colors={['rgba(6,182,212,0.18)', 'rgba(124,58,237,0.18)', 'rgba(157,255,44,0.10)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.topText}>
          <Text style={styles.label}>Investigando</Text>
          <Text style={styles.entity}>{activeLabel}</Text>
        </View>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeLabel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{periodLabel}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.summary}>{contextSummary}</Text>

      <View style={styles.quickGrid}>
        <AppButton
          label="Ver Grafo"
          size="sm"
          fullWidth={false}
          variant="secondary"
          onPress={() => openRelationshipGraph(navigation, baseParams)}
          style={styles.cta}
        />
        <AppButton
          label="Abrir Leitura"
          size="sm"
          fullWidth={false}
          variant="ghost"
          onPress={() => openIntelligentReading(navigation, baseParams)}
          style={styles.cta}
        />
        <AppButton
          label="Ver Timeline"
          size="sm"
          fullWidth={false}
          variant="ghost"
          onPress={() =>
            openTimelineAnalysis(navigation, {
              ...baseParams,
              items: state.activeFilters?.relatedTransactions || []
            })
          }
          style={styles.cta}
        />
        <AppButton
          label="Comparar"
          size="sm"
          fullWidth={false}
          variant="ghost"
          onPress={() => openFinancialSearch(navigation, { prefill: state.activeEntity })}
          style={styles.cta}
        />
      </View>

      <View style={styles.iconRow}>
        <Pressable
          onPress={() => pinEntity(baseParams)}
          style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
        >
          <Ionicons
            name={isPinned ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={theme.colors.accent}
          />
          <Text style={styles.iconLabel}>{isPinned ? 'Fixado' : 'Fixar'}</Text>
        </Pressable>
        <Pressable
          onPress={() => Share.share({ message: sharedMessage })}
          style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
        >
          <Ionicons name="share-social-outline" size={16} color={theme.colors.secondary} />
          <Text style={styles.iconLabel}>Compartilhar</Text>
        </Pressable>
        <Pressable
          onPress={() => openExportScreen(navigation, { ...baseParams, title: `Exportar ${activeLabel}` })}
          style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
        >
          <Ionicons name="download-outline" size={16} color={theme.colors.action} />
          <Text style={styles.iconLabel}>Exportar</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md
  },
  topText: { flex: 1 },
  label: {
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontSize: theme.typography.size.xs
  },
  entity: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.xs
  },
  badges: {
    gap: theme.spacing.xs,
    alignItems: 'flex-end'
  },
  badge: {
    backgroundColor: 'rgba(13,13,26,0.55)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6
  },
  badgeText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  summary: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 20,
    marginTop: theme.spacing.md
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  cta: {
    minWidth: 128
  },
  iconRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    flexWrap: 'wrap'
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pressed: { opacity: 0.82 },
  iconLabel: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  }
});
