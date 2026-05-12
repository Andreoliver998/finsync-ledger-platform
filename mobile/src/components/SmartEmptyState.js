import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';
import { buildStableKey } from '@utils/buildStableKey';

export function SmartEmptyState({
  icon = 'leaf-outline',
  title,
  description,
  suggestions,
  onSuggestionPress,
  style
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={theme.colors.muted} />
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.body}>{description}</Text> : null}

      {suggestions?.length ? (
        <View style={styles.suggestionsBlock}>
          <Text style={styles.suggestLabel}>Tente pesquisar:</Text>
          <View style={styles.chipsRow}>
            {suggestions.map((s, i) => (
              <Pressable
                key={buildStableKey('suggestion', s, i + 1)}
                onPress={() => onSuggestionPress?.(s)}
                android_ripple={{ color: theme.colors.primarySoft }}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
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
  suggestionsBlock: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320
  },
  suggestLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm
  },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 7
  },
  chipPressed: { opacity: 0.8 },
  chipText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  }
});
