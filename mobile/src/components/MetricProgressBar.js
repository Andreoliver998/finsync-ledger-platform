import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@theme/index';

const TONE_COLOR = {
  positive: theme.colors.success,
  negative: theme.colors.danger,
  accent: theme.colors.accent,
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  warning: theme.colors.warning,
  neutral: theme.colors.muted
};

export function MetricProgressBar({ label, value, total, tone = 'primary', caption, style }) {
  const safeTotal = Math.abs(Number(total) || 0);
  const safeValue = Math.abs(Number(value) || 0);
  const ratio = safeTotal > 0 ? Math.min(safeValue / safeTotal, 1) : 0;
  const percent = Math.round(ratio * 100);
  const color = TONE_COLOR[tone] ?? TONE_COLOR.primary;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.percent, { color }]}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    flex: 1
  },
  percent: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    marginLeft: theme.spacing.sm
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 3
  },
  caption: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs
  }
});
