import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@theme/index';

export function ActionCard({ icon, iconColor, iconBg, title, subtitle, onPress, style, disabled = false }) {
  const color = iconColor ?? theme.colors.primary;
  const bg = iconBg ?? theme.colors.primarySoft;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [styles.card, disabled && styles.disabled, pressed && styles.pressed, style]}
    >
      <LinearGradient
        colors={[bg, theme.colors.surfaceElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <Ionicons name={icon} size={20} color={color} />
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.52 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  }
});
