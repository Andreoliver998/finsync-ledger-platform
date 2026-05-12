import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { theme } from '@theme/index';
import { formatShortDate } from '@utils/date';
import { formatBRLCompact } from '@utils/money';
import { normalizeTransaction } from '@utils/analyticsData';
import { buildStableKey } from '@utils/buildStableKey';

function groupByDay(items) {
  return items.reduce((acc, item) => {
    const key = item.date ? formatShortDate(item.date) : 'Sem data';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function TimelineAnalysisScreen({ route }) {
  const items = useMemo(
    () => (Array.isArray(route?.params?.items) ? route.params.items.map(normalizeTransaction) : []),
    [route?.params?.items]
  );
  const grouped = useMemo(() => groupByDay(items), [items]);
  const days = Object.entries(grouped);

  if (!days.length) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="pulse-outline"
          title="Timeline indisponível"
          description="Abra a timeline a partir de um dossiê, transação ou insight com histórico associado."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <LinearGradient
        colors={['rgba(6,182,212,0.14)', 'rgba(124,58,237,0.16)', 'rgba(157,255,44,0.08)']}
        style={styles.hero}
      >
        <Text style={styles.label}>Timeline Analítica</Text>
        <Text style={styles.title}>Fluxo temporal do contexto atual</Text>
        <Text style={styles.subtitle}>Veja picos, recorrência e sequência das movimentações relacionadas.</Text>
      </LinearGradient>

      <View style={styles.timeline}>
        {days.map(([day, entries]) => {
          const total = entries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
          return (
            <View key={buildStableKey(day)} style={styles.timelineRow}>
              <View style={styles.dotColumn}>
                <View style={styles.dot} />
                {day !== days[days.length - 1][0] ? <View style={styles.line} /> : null}
              </View>
              <AppCard style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  <Text style={styles.dayTotal}>{formatBRLCompact(total)}</Text>
                </View>
                {entries.map((entry) => (
                  <View
                    key={buildStableKey(entry.id, day, entry.date, entry.description, entry.amount, entry.merchant)}
                    style={styles.entryRow}
                  >
                    <Ionicons name="ellipse" size={8} color={theme.colors.secondary} />
                    <Text style={styles.entryText} numberOfLines={2}>
                      {entry.description || entry.merchant || 'Movimentação'}
                    </Text>
                    <Text style={styles.entryAmount}>{formatBRLCompact(entry.amount)}</Text>
                  </View>
                ))}
              </AppCard>
            </View>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl
  },
  label: {
    color: theme.colors.secondary,
    fontSize: theme.typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.sm
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
    marginTop: theme.spacing.sm
  },
  timeline: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.md
  },
  dotColumn: {
    width: 18,
    alignItems: 'center'
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
    marginTop: theme.spacing.lg
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.borderStrong,
    marginTop: theme.spacing.xs
  },
  dayCard: {
    flex: 1,
    marginBottom: theme.spacing.md
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md
  },
  dayTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  dayTotal: {
    color: theme.colors.accent,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  entryText: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm
  },
  entryAmount: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  }
});
