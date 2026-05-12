import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';
import { formatBRLCompact } from '@utils/money';

function MoneyFlowVisualizationCardComponent({ flow }) {
  if (!flow) return null;

  const total = Math.max(flow.total || 0, 1);
  const balance = flow.received - flow.sent;
  const segments = [
    { key: 'received', label: 'Entradas', value: flow.received, ratio: flow.received / total, color: theme.colors.success },
    { key: 'sent', label: 'Saídas', value: flow.sent, ratio: flow.sent / total, color: theme.colors.danger },
    { key: 'balance', label: 'Saldo relacional', value: balance, ratio: Math.abs(balance) / total, color: balance >= 0 ? theme.colors.secondary : theme.colors.action }
  ];

  const miniBars = segments.map((item) => ({
    ...item,
    height: Math.max(16, Math.round(item.ratio * 92))
  }));

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Money Flow</Text>
          <Text style={styles.title}>Como o dinheiro flui nesta entidade</Text>
        </View>
        <View style={styles.dominantPill}>
          <Ionicons
            name={flow.dominant === 'entrada' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
            size={14}
            color={flow.dominant === 'entrada' ? theme.colors.success : theme.colors.danger}
          />
          <Text style={styles.dominantText}>
            {flow.dominant === 'entrada' ? 'Entrada dominante' : 'Saída dominante'}
          </Text>
        </View>
      </View>

      <View style={styles.flowTrack}>
        <View style={[styles.flowSegment, { flex: flow.receivedRatio, backgroundColor: theme.colors.success }]} />
        <View style={styles.trackDivider} />
        <View style={[styles.flowSegment, { flex: flow.sentRatio, backgroundColor: theme.colors.danger }]} />
      </View>

      <View style={styles.metricsRow}>
        {segments.map((item) => (
          <View key={item.key} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={[styles.metricValue, { color: item.color }]}>
              {item.value >= 0 ? formatBRLCompact(item.value) : `-${formatBRLCompact(Math.abs(item.value))}`}
            </Text>
            <Text style={styles.metricHint}>{Math.round(item.ratio * 100)}% do fluxo</Text>
          </View>
        ))}
      </View>

      <View style={styles.compositionBlock}>
        <View style={styles.chartColumn}>
          <Text style={styles.blockTitle}>Distribuição visual</Text>
          <View style={styles.miniChart}>
            {miniBars.map((bar) => (
              <View key={bar.key} style={styles.miniBarWrap}>
                <View style={[styles.miniBar, { height: bar.height, backgroundColor: bar.color }]} />
                <Text style={styles.miniBarLabel}>{bar.label.split(' ')[0]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.narrativeColumn}>
          <Text style={styles.blockTitle}>Leitura do fluxo</Text>
          <Text style={styles.narrativeText}>{flow.dominantText}</Text>
          <Text style={styles.narrativeMeta}>
            Entradas e saídas foram convertidas em composição proporcional para leitura rápida do vínculo.
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

export const MoneyFlowVisualizationCard = memo(MoneyFlowVisualizationCardComponent);

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md
  },
  eyebrow: {
    color: theme.colors.secondary,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginTop: 2
  },
  dominantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  dominantText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm
  },
  flowTrack: {
    flexDirection: 'row',
    height: 18,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden'
  },
  flowSegment: { borderRadius: theme.radius.pill },
  trackDivider: { width: 2, backgroundColor: theme.colors.surface2 },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  metricCard: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm
  },
  metricValue: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    marginTop: 4
  },
  metricHint: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    marginTop: 4
  },
  compositionBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md
  },
  chartColumn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  narrativeColumn: {
    flex: 1.2,
    minWidth: 160,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  blockTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    height: 110
  },
  miniBarWrap: {
    alignItems: 'center',
    gap: 6
  },
  miniBar: {
    width: 24,
    borderRadius: theme.radius.pill
  },
  miniBarLabel: {
    color: theme.colors.muted,
    fontSize: 10
  },
  narrativeText: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    lineHeight: 21,
    marginTop: theme.spacing.sm
  },
  narrativeMeta: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: theme.spacing.sm
  }
});
