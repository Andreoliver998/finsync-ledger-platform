import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from './AppCard';
import { theme } from '@theme/index';
import { formatBRL } from '@utils/money';

const TONE_COLOR = {
  positive: theme.colors.success,
  negative: theme.colors.danger,
  accent: theme.colors.accent,
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  neutral: theme.colors.text
};

export function AmountTrendCard({ label, value, delta, trendUp, tone = 'neutral', caption, onPress, style }) {
  const color = TONE_COLOR[tone] ?? TONE_COLOR.neutral;
  const hasDelta = delta !== undefined && delta !== null && delta !== '';
  const isUp = trendUp !== undefined
    ? trendUp
    : typeof delta === 'number'
      ? delta >= 0
      : String(delta ?? '').startsWith('+');
  const deltaStr =
    typeof delta === 'number'
      ? `${isUp ? '+' : ''}${delta.toFixed(1)}%`
      : String(delta ?? '');

  return (
    <AppCard onPress={onPress} style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatBRL(value)}
      </Text>
      {hasDelta ? (
        <View style={styles.deltaRow}>
          <Ionicons
            name={isUp ? 'trending-up' : 'trending-down'}
            size={13}
            color={isUp ? theme.colors.success : theme.colors.danger}
          />
          <Text style={[styles.delta, { color: isUp ? theme.colors.success : theme.colors.danger }]}>
            {deltaStr}
          </Text>
        </View>
      ) : null}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.xs },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: theme.typography.weight.semibold
  },
  value: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    marginTop: 4
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  delta: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  caption: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  }
});
