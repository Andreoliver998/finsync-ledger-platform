import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';

const TONES = {
  primary: { color: theme.colors.primaryStrong, bg: theme.colors.primarySoft },
  accent: { color: theme.colors.accent, bg: theme.colors.accentSoft },
  warning: { color: theme.colors.warning, bg: theme.colors.warningSoft },
  info: { color: theme.colors.secondary, bg: theme.colors.secondarySoft }
};

function SignalCard({ signal }) {
  const tone = TONES[signal.tone] || TONES.primary;
  return (
    <View style={styles.signalCard}>
      <View style={styles.signalHeader}>
        <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          <Ionicons name={signal.icon} size={16} color={tone.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.signalTitle}>{signal.title}</Text>
          <Text style={styles.signalDescription}>{signal.description}</Text>
        </View>
      </View>

      <View style={styles.signalFooter}>
        <View style={styles.scoreTrack}>
          <View style={[styles.scoreFill, { width: `${Math.max(8, signal.score)}%`, backgroundColor: tone.color }]} />
        </View>
        <Text style={[styles.scoreText, { color: tone.color }]}>{Math.round(signal.score)}/100</Text>
      </View>
    </View>
  );
}

function EntitySignalsPanelComponent({ signals }) {
  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>Sinais Detectados</Text>
          <Text style={styles.title}>Leitura de intensidade e estabilidade</Text>
        </View>
        <Text style={styles.caption}>{signals.length} sinais ativos</Text>
      </View>

      {signals.length ? (
        <View style={styles.grid}>
          {signals.map((signal) => (
            <SignalCard key={signal.key} signal={signal} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={18} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Sem sinais fortes ainda</Text>
          <Text style={styles.emptyBody}>
            Reforce a leitura com mais período, grafo ou transações relacionadas para aumentar densidade analítica.
          </Text>
        </View>
      )}
    </AppCard>
  );
}

export const EntitySignalsPanel = memo(EntitySignalsPanelComponent);

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'flex-start'
  },
  eyebrow: {
    color: theme.colors.primaryStrong,
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
  caption: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  signalCard: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border
  },
  signalHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: { flex: 1 },
  signalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  signalDescription: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: 4
  },
  signalFooter: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  scoreTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden'
  },
  scoreFill: {
    height: '100%',
    borderRadius: theme.radius.pill
  },
  scoreText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  emptyState: {
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginTop: theme.spacing.sm
  },
  emptyBody: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: 4
  }
});
