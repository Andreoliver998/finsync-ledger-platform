import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';
import { buildStableKey, uniqueByStableKey } from '@utils/buildStableKey';

export function InvestigationRail({ title, subtitle, items, icon = 'time-outline', onItemPress, emptyText }) {
  const uniqueItems = useMemo(
    () =>
      uniqueByStableKey(items, (item) => [
        item.id,
        item.entity,
        item.type,
        item.period,
        item.source,
        item.timestamp
      ]),
    [items]
  );

  if (!uniqueItems?.length) {
    if (!emptyText) return null;
    return (
      <AppCard variant="outline" style={styles.emptyCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </AppCard>
    );
  }

  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {uniqueItems.map((item) => (
          <Pressable
            key={buildStableKey(item.id, item.entity, item.type, item.period, item.source, item.timestamp)}
            onPress={() => onItemPress?.(item)}
            android_ripple={{ color: theme.colors.primarySoft }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name={icon} size={14} color={theme.colors.secondary} />
              </View>
              <Text style={styles.period}>{item.period || '90d'}</Text>
            </View>
            <Text style={styles.entity} numberOfLines={2}>
              {item.entity}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.type || 'entidade'}
            </Text>
            {item.summary ? (
              <Text style={styles.summary} numberOfLines={2}>
                {item.summary}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: theme.spacing.lg
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 2,
    marginBottom: theme.spacing.sm
  },
  row: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg
  },
  card: {
    width: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong
  },
  pressed: { opacity: 0.84 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondarySoft
  },
  period: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs
  },
  entity: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginTop: theme.spacing.sm
  },
  meta: {
    color: theme.colors.accent,
    fontSize: theme.typography.size.xs,
    textTransform: 'uppercase',
    marginTop: 4
  },
  summary: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: theme.spacing.sm
  },
  emptyCard: {
    marginTop: theme.spacing.lg
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm
  }
});
