import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';
import { formatBRLCompact } from '@utils/money';

function LegendItem({ color, label, value }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={[styles.legendValue, { color }]}>{formatBRLCompact(value)}</Text>
      </View>
    </View>
  );
}

export function FinancialMiniChart({ income = 0, expenses = 0, style }) {
  const absExpenses = Math.abs(expenses);
  const total = income + absExpenses;
  const savings = income - absExpenses;
  const savingsRatio = income > 0 ? savings / income : 0;

  const incomeRatio = total > 0 ? Math.max(income / total, 0.02) : 0.5;
  const expenseRatio = total > 0 ? Math.max(absExpenses / total, 0.02) : 0.5;

  const trendUp = savingsRatio >= 0;
  const trendColor = trendUp ? theme.colors.accent : theme.colors.danger;
  const trendIcon = trendUp ? 'trending-up' : 'trending-down';
  const trendLabel = `${trendUp ? '+' : ''}${Math.round(savingsRatio * 100)}% de resultado`;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.compositionTrack}>
        <View style={[styles.segment, { flex: incomeRatio, backgroundColor: theme.colors.success }]} />
        <View style={[styles.divider]} />
        <View style={[styles.segment, { flex: expenseRatio, backgroundColor: theme.colors.danger }]} />
      </View>

      <View style={styles.legend}>
        <LegendItem color={theme.colors.success} label="Receitas" value={income} />
        <LegendItem color={theme.colors.danger} label="Despesas" value={absExpenses} />
      </View>

      {income > 0 || absExpenses > 0 ? (
        <View style={styles.trendRow}>
          <Ionicons name={trendIcon} size={14} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  compositionTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden'
  },
  segment: { height: '100%' },
  divider: { width: 2, backgroundColor: theme.colors.background },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs
  },
  legendValue: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  trendText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  }
});
