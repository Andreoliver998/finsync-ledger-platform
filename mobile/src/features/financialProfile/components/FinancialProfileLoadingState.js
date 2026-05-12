import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@components/AppScreen';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { theme } from '@theme/index';

export function FinancialProfileLoadingState() {
  return (
    <AppScreen padded scroll>
      <LoadingSkeleton width="26%" height={12} />
      <LoadingSkeleton
        width="100%"
        height={260}
        style={{ marginTop: theme.spacing.lg, borderRadius: theme.radius.xl }}
      />
      <View style={styles.row}>
        <LoadingSkeleton width={140} height={44} radius={theme.radius.pill} />
        <LoadingSkeleton width={140} height={44} radius={theme.radius.pill} />
        <LoadingSkeleton width={140} height={44} radius={theme.radius.pill} />
      </View>
      <LoadingSkeleton width="100%" height={220} style={styles.block} />
      <LoadingSkeleton width="100%" height={240} style={styles.block} />
      <LoadingSkeleton width="100%" height={190} style={styles.block} />
      <LoadingSkeleton width="100%" height={210} style={styles.block} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  block: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.xl
  }
});
