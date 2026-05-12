import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@theme/index';
import { safeText } from '@utils/safeText';
import { formatBRLCompact } from '@utils/money';
import { buildStableKey } from '@utils/buildStableKey';

const TONE_COLOR = {
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  accent: theme.colors.accent,
  positive: theme.colors.success,
  negative: theme.colors.danger,
  warning: theme.colors.warning,
  neutral: theme.colors.muted
};

export function RankingList({
  items,
  labelKey = 'label',
  valueKey = 'value',
  tone = 'primary',
  maxItems = 5,
  showAmount = true,
  style
}) {
  const safeItems = Array.isArray(items) ? items.slice(0, maxItems) : [];
  if (!safeItems.length) return null;

  const color = TONE_COLOR[tone] ?? TONE_COLOR.primary;
  const maxVal = Math.max(...safeItems.map((i) => Math.abs(Number(i[valueKey] ?? 0))), 1);

  return (
    <View style={[styles.wrap, style]}>
      {safeItems.map((item, idx) => {
        const val = Math.abs(Number(item[valueKey] ?? 0));
        const ratio = maxVal > 0 ? val / maxVal : 0;
        const lbl = safeText(item[labelKey] ?? item.name ?? item.category ?? item.method, '—');

        return (
          <View
            key={buildStableKey(item.id, item.type, lbl, item[valueKey], item[labelKey], item.name, item.category, item.method)}
            style={styles.row}
          >
            <Text style={styles.rank}>#{idx + 1}</Text>
            <View style={styles.content}>
              <View style={styles.labelRow}>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {lbl}
                </Text>
                {showAmount ? (
                  <Text style={[styles.value, { color }]}>{formatBRLCompact(val)}</Text>
                ) : null}
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max(Math.round(ratio * 100), 2)}%`, backgroundColor: color }
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md
  },
  rank: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold,
    width: 22,
    marginTop: 2
  },
  content: { flex: 1, gap: 5 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    flex: 1,
    paddingRight: theme.spacing.sm
  },
  value: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 2
  }
});
