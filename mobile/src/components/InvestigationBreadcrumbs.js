import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import { buildStableKey, uniqueByStableKey } from '@utils/buildStableKey';

function navigateTrailItem(navigation, item) {
  if (!item?.screen) return;
  const parent = navigation?.getParent?.();

  if (item.screen === 'Dashboard') {
    parent?.navigate?.('DashboardTab');
    return;
  }

  if (item.screen === 'Transactions') {
    parent?.navigate?.('TransactionsTab', {
      screen: 'Transactions',
      params: item.params
    });
    return;
  }

  navigation?.navigate?.(item.screen, item.params);
}

export function InvestigationBreadcrumbs({ navigation, style }) {
  const {
    state: { navigationTrail },
    restoreTrailItem
  } = useInvestigation();

  const uniqueTrail = useMemo(
    () =>
      uniqueByStableKey(navigationTrail, (item) => [
        item.id,
        item.screen,
        item.label,
        item.activeEntity,
        item.timestamp
      ]),
    [navigationTrail]
  );

  if (!uniqueTrail.length) return null;

  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {uniqueTrail.map((item, index) => (
          <React.Fragment
            key={buildStableKey(item.id, item.screen, item.label, item.activeEntity, item.timestamp)}
          >
            <Pressable
              onPress={() => {
                restoreTrailItem(item);
                navigateTrailItem(navigation, item);
              }}
              android_ripple={{ color: theme.colors.primarySoft }}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>{item.label}</Text>
            </Pressable>
            {index < uniqueTrail.length - 1 ? (
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.colors.mutedStrong}
                style={styles.separator}
              />
            ) : null}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.md
  },
  row: {
    alignItems: 'center',
    paddingRight: theme.spacing.md
  },
  chip: {
    backgroundColor: 'rgba(18,18,43,0.92)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  pressed: { opacity: 0.82 },
  chipText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  separator: {
    marginHorizontal: theme.spacing.xs
  }
});
