import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@theme/index';

const VARIANT_STYLES = {
  primary: {
    bg: theme.colors.primary,
    bgPressed: theme.colors.primaryStrong,
    fg: '#FFFFFF',
    border: 'transparent'
  },
  secondary: {
    bg: theme.colors.secondarySoft,
    bgPressed: theme.colors.secondary,
    fg: theme.colors.secondary,
    border: theme.colors.secondary
  },
  ghost: {
    bg: 'transparent',
    bgPressed: theme.colors.primarySoft,
    fg: theme.colors.text,
    border: theme.colors.border
  },
  danger: {
    bg: theme.colors.dangerSoft,
    bgPressed: theme.colors.danger,
    fg: theme.colors.danger,
    border: theme.colors.danger
  },
  accent: {
    bg: theme.colors.accent,
    bgPressed: '#7FE51E',
    fg: '#0D0D1A',
    border: 'transparent'
  }
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  fullWidth = true
}) {
  const palette = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  const sizing = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      android_ripple={{ color: theme.colors.primarySoft, borderless: false }}
      style={({ pressed }) => [
        styles.base,
        sizing,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: pressed && !isDisabled ? palette.bgPressed : palette.bg,
          borderColor: palette.border
        },
        isDisabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <View style={styles.iconSlot}>{iconLeft}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              size === 'lg' && styles.labelLg,
              { color: palette.fg },
              textStyle
            ]}
          >
            {label}
          </Text>
          {iconRight ? <View style={styles.iconSlot}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  md: { paddingVertical: 13, paddingHorizontal: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 22 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  iconSlot: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: 0.2
  },
  labelSm: { fontSize: theme.typography.size.md },
  labelLg: { fontSize: theme.typography.size.xl }
});
