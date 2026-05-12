import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '@theme/index';

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
  { label: 'Ano', value: 365 }
];

export function QuickPeriodChips({ selected, onSelect, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {PERIODS.map((period) => {
        const active = selected === period.value;
        return (
          <Pressable
            key={period.value}
            onPress={() => onSelect(period.value)}
            android_ripple={{ color: theme.colors.primarySoft }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.chipPressed
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{period.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8
  },
  chipIdle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border
  },
  chipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary
  },
  chipPressed: { opacity: 0.8 },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium
  },
  labelActive: {
    color: theme.colors.text,
    fontWeight: theme.typography.weight.semibold
  }
});
