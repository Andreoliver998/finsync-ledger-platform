import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { theme } from '@theme/index';
import { buildStableKey } from '@utils/buildStableKey';

function ConnectionRow({ item, maxAmount }) {
  const ratio = maxAmount > 0 ? Math.max(10, Math.round((item.amount / maxAmount) * 100)) : 12;
  return (
    <View style={styles.connectionRow}>
      <View style={styles.connectionHeader}>
        <Text style={styles.connectionLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.connectionMeta}>{item.value} eventos</Text>
      </View>
      <View style={styles.connectionTrack}>
        <View style={[styles.connectionFill, { width: `${ratio}%` }]} />
      </View>
    </View>
  );
}

function RelationshipSnapshotCardComponent({ snapshot, onOpenGraph }) {
  const safeConnections = Array.isArray(snapshot?.topConnections) ? snapshot.topConnections : [];
  const maxAmount = safeConnections.reduce((max, item) => Math.max(max, item.amount), 0);

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Relationship Snapshot</Text>
          <Text style={styles.title}>Preview do mapa relacional</Text>
        </View>
        <View style={styles.clusterPill}>
          <Ionicons name="git-network-outline" size={14} color={theme.colors.primaryStrong} />
          <Text style={styles.clusterText}>{snapshot.dominantCluster}</Text>
        </View>
      </View>

      {snapshot?.hasData ? (
        <>
          <View style={styles.canvas}>
            {safeConnections.map((item, index) => (
              <View key={buildStableKey(item.label, item.value, item.amount)} style={styles.nodeColumn}>
                <View style={styles.nodeLabelBlock}>
                  <Text style={styles.nodeLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.nodeAmount}>{item.value}x</Text>
                </View>
                <View style={[styles.nodeDot, { opacity: 1 - index * 0.12 }]} />
              </View>
            ))}
          </View>

          <View style={styles.connectionsList}>
            {safeConnections.map((item) => (
              <ConnectionRow
                key={buildStableKey(item.label, item.value, item.amount, 'connection')}
                item={item}
                maxAmount={maxAmount}
              />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Mapa em construção</Text>
          <Text style={styles.emptyBody}>
            O dossiê ainda não tem massa relacional suficiente. Abra o grafo completo para explorar novas conexões.
          </Text>
        </View>
      )}

      <AppButton
        label="Abrir mapa completo"
        size="sm"
        fullWidth={false}
        onPress={onOpenGraph}
        iconRight={<Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
      />
    </AppCard>
  );
}

export const RelationshipSnapshotCard = memo(RelationshipSnapshotCardComponent);

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md
  },
  headerRow: {
    gap: theme.spacing.sm
  },
  eyebrow: {
    color: theme.colors.primaryStrong,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginTop: 2
  },
  clusterPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  clusterText: {
    color: theme.colors.primaryStrong,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  canvas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm
  },
  nodeColumn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  nodeLabelBlock: {
    alignItems: 'center'
  },
  nodeLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  nodeAmount: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  nodeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primaryStrong,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.primaryStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 3
  },
  connectionsList: {
    gap: theme.spacing.sm
  },
  connectionRow: {
    gap: 6
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm
  },
  connectionLabel: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.sm
  },
  connectionMeta: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs
  },
  connectionTrack: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden'
  },
  connectionFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryStrong
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
