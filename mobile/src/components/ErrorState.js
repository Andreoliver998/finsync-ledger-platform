import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from './AppButton';
import { theme } from '@theme/index';
import { getErrorMessage } from '@utils/errors';

export function ErrorState({ error, onRetry, title = 'Não foi possível carregar', style }) {
  const message = getErrorMessage(error, 'Tente novamente em instantes.');
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={30} color={theme.colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <AppButton label="Tentar novamente" variant="ghost" onPress={onRetry} />
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
    backgroundColor: theme.colors.dangerSoft,
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
  action: { marginTop: theme.spacing.xl, width: '100%', maxWidth: 320 }
});
