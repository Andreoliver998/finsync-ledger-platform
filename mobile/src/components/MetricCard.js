import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from './AppCard';
import { theme } from '@theme/index';
import { formatBRLCompact } from '@utils/money';

const TONE_STYLES = {
  neutral: { color: theme.colors.text, soft: theme.colors.surfaceElevated, border: theme.colors.border },
  positive: { color: theme.colors.success, soft: theme.colors.successSoft, border: theme.colors.success },
  negative: { color: theme.colors.danger, soft: theme.colors.dangerSoft, border: theme.colors.danger },
  primary: { color: theme.colors.primary, soft: theme.colors.primarySoft, border: theme.colors.primary },
  accent: { color: theme.colors.accent, soft: theme.colors.accentSoft, border: theme.colors.accent }
};

/**
 * Compact KPI card.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {number|string} props.value     formatted automatically if a number
 * @param {string} [props.caption]
 * @param {'neutral'|'positive'|'negative'|'primary'|'accent'} [props.tone]
 * @param {string} [props.delta]          e.g. "+12,4%"
 */
export function MetricCard({ label, value, caption, tone = 'neutral', delta, style }) {
  const palette = TONE_STYLES[tone] ?? TONE_STYLES.neutral;
  const displayValue = typeof value === 'number' ? formatBRLCompact(value) : value ?? '—';

  return (
    <AppCard style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {delta ? (
          <View style={[styles.deltaPill, { backgroundColor: palette.soft, borderColor: palette.border }]}>
            <Text style={[styles.deltaText, { color: palette.color }]}>{delta}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: palette.color }]} numberOfLines={1} adjustsFontSizeToFit>
        {displayValue}
      </Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
    justifyContent: 'space-between'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  value: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.2
  },
  caption: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    marginTop: 4
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth
  },
  deltaText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  }
});
