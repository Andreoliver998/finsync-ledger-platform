import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from './AppCard';
import { theme } from '@theme/index';

const TONE_PALETTE = {
  primary: { color: theme.colors.primary, bg: theme.colors.primarySoft },
  accent: { color: theme.colors.accent, bg: theme.colors.accentSoft },
  warning: { color: theme.colors.warning, bg: theme.colors.warningSoft },
  danger: { color: theme.colors.danger, bg: theme.colors.dangerSoft },
  info: { color: theme.colors.secondary, bg: theme.colors.secondarySoft }
};

function safeText(value, fallback = '') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    return String(
      value.summary ||
        value.label ||
        value.title ||
        value.name ||
        value.normalizedName ||
        value.relationshipSummary?.summary ||
        value.relationshipSummary?.label ||
        fallback
    );
  }
  return fallback;
}

export function InsightCard({ icon = 'sparkles', title, description, tone = 'primary', footer, style }) {
  const palette = TONE_PALETTE[tone] ?? TONE_PALETTE.primary;
  const safeTitle = safeText(title, 'Insight');
  const safeDescription = safeText(description);

  return (
    <AppCard variant="elevated" style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
          <Ionicons name={icon} size={18} color={palette.color} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {safeTitle}
        </Text>
      </View>
      {safeDescription ? (
        <Text style={styles.body} numberOfLines={6}>
          {safeDescription}
        </Text>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold
  },
  body: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 20,
    marginTop: 4
  },
  footer: { marginTop: theme.spacing.sm }
});
