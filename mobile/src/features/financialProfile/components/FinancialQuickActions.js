import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';
import { buildStableKey } from '@utils/buildStableKey';

const TONES = {
  primary: { color: theme.colors.primaryStrong, bg: theme.colors.primarySoft },
  secondary: { color: theme.colors.secondary, bg: theme.colors.secondarySoft },
  accent: { color: theme.colors.accent, bg: theme.colors.accentSoft },
  action: { color: theme.colors.action, bg: theme.colors.actionSoft },
  muted: { color: theme.colors.textSubtle, bg: theme.colors.surface2 }
};

function ActionPill({ item }) {
  const tone = TONES[item.tone] || TONES.primary;
  return (
    <Pressable
      onPress={item.onPress}
      android_ripple={{ color: tone.bg }}
      style={({ pressed }) => [
        styles.pill,
        pressed && styles.pillPressed,
        item.selected ? { borderColor: tone.color, backgroundColor: tone.bg } : null
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={item.icon} size={16} color={tone.color} />
      </View>
      <Text style={styles.pillLabel}>{item.label}</Text>
    </Pressable>
  );
}

function FinancialQuickActionsComponent({ items }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={{ opacity: fade }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.wrap}
      >
        {items.map((item) => (
          <ActionPill key={buildStableKey(item.key, item.label, item.icon)} item={item} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

export const FinancialQuickActions = memo(FinancialQuickActionsComponent);

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.lg
  },
  content: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  pillPressed: {
    opacity: 0.85
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pillLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  }
});
