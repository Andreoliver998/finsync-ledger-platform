import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@theme/index';

export function SectionHeader({ title, subtitle, actionLabel, onActionPress, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={10}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.2
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  },
  action: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.md
  }
});
