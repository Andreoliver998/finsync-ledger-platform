import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { theme } from '@theme/index';

/**
 * Pulse skeleton block. Sizes are configurable; uses native driver for 60fps.
 */
export function LoadingSkeleton({ width = '100%', height = 16, radius = theme.radius.sm, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: radius, opacity: anim },
        style
      ]}
    />
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <LoadingSkeleton width={40} height={40} radius={20} />
          <View style={styles.rowText}>
            <LoadingSkeleton width="70%" height={14} />
            <LoadingSkeleton width="40%" height={12} style={{ marginTop: 8 }} />
          </View>
          <LoadingSkeleton width={70} height={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: theme.colors.surfaceElevated },
  list: { gap: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border
  },
  rowText: { flex: 1, marginHorizontal: theme.spacing.md }
});
