import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '@theme/index';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FinSync</Text>
      <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: theme.spacing.lg }} />
      <Text style={styles.caption}>Restaurando sua sessão…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl
  },
  brand: {
    color: theme.colors.text,
    fontSize: theme.typography.size.hero,
    fontWeight: theme.typography.weight.black,
    letterSpacing: 0.5
  },
  caption: {
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.size.md
  }
});
