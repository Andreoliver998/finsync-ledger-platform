import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';
import { buildStableKey } from '@utils/buildStableKey';

function HeroMetric({ label, value, toneColor }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricLabel, toneColor ? { color: toneColor } : null]}>{label}</Text>
    </View>
  );
}

function FinancialProfileHeroCardComponent({
  visualIdentity,
  typeLabel,
  entityName,
  archetype,
  summary,
  periodLabel,
  executiveSummary,
  relevanceScore,
  metrics
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 280, useNativeDriver: true })
    ]).start();
  }, [fade, translate]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: translate }] }}>
      <AppCard style={styles.card}>
        <LinearGradient colors={visualIdentity.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <View style={[styles.heroGlow, { backgroundColor: visualIdentity.glow }]} />
          <View style={styles.topRow}>
            <View style={styles.identityColumn}>
              <Text style={styles.eyebrow}>Dossiê Financeiro</Text>
              <View style={styles.identityRow}>
                <View style={[styles.avatarWrap, { backgroundColor: visualIdentity.soft, borderColor: visualIdentity.glow }]}>
                  <View style={[styles.avatarGlow, { backgroundColor: visualIdentity.glow }]} />
                  <Ionicons name={visualIdentity.icon} size={28} color={visualIdentity.color} />
                </View>

                <View style={styles.identityText}>
                  <Text style={styles.entityName} numberOfLines={2}>
                    {entityName}
                  </Text>
                  <Text style={styles.archetype} numberOfLines={2}>
                    {archetype}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.scoreColumn}>
              <View style={[styles.scoreHalo, { borderColor: visualIdentity.glow, shadowColor: visualIdentity.color }]}>
                <LinearGradient colors={[visualIdentity.color, 'rgba(13, 13, 26, 0.9)']} style={styles.scoreCore}>
                  <Text style={styles.scoreValue}>{relevanceScore.value}</Text>
                  <Text style={styles.scoreCaption}>/100</Text>
                </LinearGradient>
              </View>
              <Text style={styles.scoreLabel}>Financial Relevance Score</Text>
              <Text style={styles.scoreTone}>{relevanceScore.label}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: visualIdentity.soft }]}>
              <Text style={[styles.badgeText, { color: visualIdentity.color }]}>{typeLabel}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.muted} />
              <Text style={styles.badgeTextMuted}>{periodLabel}</Text>
            </View>
          </View>

          <Text style={styles.summary} numberOfLines={3}>
            {summary}
          </Text>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveHeadline}>{executiveSummary.headline}</Text>
            <Text style={styles.executiveBody}>{executiveSummary.body}</Text>
            <Text style={styles.relevanceCaption}>{relevanceScore.caption}</Text>
          </View>

          <View style={styles.metricsRow}>
            {metrics.map((item) => (
              <HeroMetric
                key={buildStableKey(item.label, item.value)}
                label={item.label}
                value={item.value}
                toneColor={item.toneColor}
              />
            ))}
          </View>
        </LinearGradient>
      </AppCard>
    </Animated.View>
  );
}

export const FinancialProfileHeroCard = memo(FinancialProfileHeroCardComponent);

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginTop: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface
  },
  gradient: {
    padding: theme.spacing.xl,
    overflow: 'hidden'
  },
  heroGlow: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.5
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md
  },
  identityColumn: { flex: 1 },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  identityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden'
  },
  avatarGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    opacity: 0.3
  },
  identityText: { flex: 1 },
  entityName: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    lineHeight: 32
  },
  archetype: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    marginTop: 4,
    lineHeight: 20
  },
  scoreColumn: {
    width: 120,
    alignItems: 'center'
  },
  scoreHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5
  },
  scoreCore: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: theme.typography.weight.bold
  },
  scoreCaption: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: theme.typography.size.xs,
    marginTop: -2
  },
  scoreLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    textAlign: 'center',
    marginTop: theme.spacing.sm
  },
  scoreTone: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
    marginTop: 4
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 18, 43, 0.86)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  badgeText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  badgeTextMuted: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  summary: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: 24,
    marginTop: theme.spacing.lg
  },
  executiveBlock: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(9, 9, 24, 0.42)',
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    padding: theme.spacing.lg,
    gap: 6
  },
  executiveHeadline: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  executiveBody: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 21
  },
  relevanceCaption: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    lineHeight: 18,
    marginTop: 4
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  metricPill: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.12)'
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  }
});
