import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';

export function ScreenIntro({ icon, title, description, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={theme.colors.primary} style={styles.icon} />
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.body}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.primary,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  icon: {
    marginBottom: theme.spacing.sm
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: 4
  },
  body: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  }
});
