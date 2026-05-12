import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';

function MiniTimelineCardComponent({ points, narrative }) {
  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Mini Timeline</Text>
          <Text style={styles.title}>Atividade mensal e sazonalidade</Text>
        </View>
        <Ionicons name="analytics-outline" size={18} color={theme.colors.secondary} />
      </View>

      {points.length ? (
        <>
          <View style={styles.chartRow}>
            {points.map((point) => (
              <View key={point.key} style={styles.barWrap}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(10, point.ratio)}%` }]} />
                </View>
                <Text style={styles.barValue}>{point.value}</Text>
                <Text style={styles.barLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.narrative}>{narrative}</Text>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Timeline em formação</Text>
          <Text style={styles.emptyBody}>
            Ainda não há eventos suficientes para desenhar picos ou sazonalidade. Tente ampliar o período ou abrir a timeline completa.
          </Text>
        </View>
      )}
    </AppCard>
  );
}

export const MiniTimelineCard = memo(MiniTimelineCardComponent);

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eyebrow: {
    color: theme.colors.secondary,
    fontSize: theme.typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginTop: 2
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    height: 148,
    marginTop: theme.spacing.sm
  },
  barWrap: {
    flex: 1,
    alignItems: 'center'
  },
  barTrack: {
    width: '100%',
    height: 96,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    borderRadius: theme.radius.md,
    padding: 6
  },
  barFill: {
    width: '100%',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary
  },
  barValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    marginTop: 8
  },
  barLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'capitalize'
  },
  narrative: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 21
  },
  emptyState: {
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  emptyBody: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: 4
  }
});
