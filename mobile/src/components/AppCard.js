import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@theme/index';

export function AppCard({ children, onPress, style, variant = 'default', disabled }) {
  const variantStyle =
    variant === 'elevated' ? styles.elevated : variant === 'outline' ? styles.outline : styles.default;

  const Container = onPress ? Pressable : View;
  const containerStyle = [styles.base, variantStyle, style];
  const pressableProps = onPress
    ? {
        onPress,
        disabled,
        android_ripple: { color: theme.colors.primarySoft },
        style: ({ pressed }) => [...containerStyle, pressed ? styles.pressed : null]
      }
    : {
        style: containerStyle
      };

  return (
    <Container {...pressableProps}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    overflow: 'hidden'
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border
  },
  elevated: {
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.997 }]
  }
});
