import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';

export function EmptyState({ icon = 'leaf-outline', title, description, action, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={theme.colors.muted} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.body}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    marginBottom: theme.spacing.lg
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center'
  },
  body: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20
  },
  action: { marginTop: theme.spacing.xl, width: '100%', maxWidth: 320 }
});
