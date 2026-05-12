import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';

const PALETTES = {
  info: {
    bg: theme.colors.secondarySoft,
    border: theme.colors.secondary,
    icon: theme.colors.secondary,
    text: theme.colors.secondary
  },
  warning: {
    bg: theme.colors.warningSoft,
    border: theme.colors.warning,
    icon: theme.colors.warning,
    text: theme.colors.warning
  },
  success: {
    bg: theme.colors.successSoft,
    border: theme.colors.success,
    icon: theme.colors.success,
    text: theme.colors.success
  },
  primary: {
    bg: theme.colors.primarySoft,
    border: theme.colors.primary,
    icon: theme.colors.primary,
    text: theme.colors.textSubtle
  }
};

export function InfoHint({ text, tone = 'info', style }) {
  const palette = PALETTES[tone] ?? PALETTES.info;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={15}
        color={palette.icon}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  icon: { marginTop: 1 },
  text: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  }
});
