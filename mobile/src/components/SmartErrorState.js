import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from './AppButton';
import { theme } from '@theme/index';
import { getErrorMessage } from '@utils/errors';

const ERROR_MAP = {
  NETWORK: {
    icon: 'wifi-outline',
    title: 'Sem conexão',
    hint: 'Verifique sua internet e tente novamente.'
  },
  HTTP_401: {
    icon: 'lock-closed-outline',
    title: 'Sessão expirada',
    hint: 'Faça login novamente para continuar.'
  },
  HTTP_403: {
    icon: 'shield-outline',
    title: 'Acesso negado',
    hint: 'Você não tem permissão para este recurso.'
  },
  HTTP_404: {
    icon: 'search-outline',
    title: 'Não encontrado',
    hint: 'Este recurso pode não existir.'
  },
  HTTP_500: {
    icon: 'server-outline',
    title: 'Falha no servidor',
    hint: 'Tente novamente em alguns instantes.'
  },
  DEFAULT: {
    icon: 'alert-circle-outline',
    title: 'Algo deu errado',
    hint: 'Tente novamente ou verifique sua conexão.'
  }
};

export function SmartErrorState({ error, onRetry, style }) {
  const code = error?.code ?? 'DEFAULT';
  const ctx = ERROR_MAP[code] ?? ERROR_MAP.DEFAULT;
  const message = getErrorMessage(error, ctx.hint);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={ctx.icon} size={30} color={theme.colors.danger} />
      </View>
      <Text style={styles.title}>{ctx.title}</Text>
      <Text style={styles.body}>{message}</Text>
      {message !== ctx.hint ? (
        <Text style={styles.hint}>{ctx.hint}</Text>
      ) : null}
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
  hint: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    maxWidth: 300
  },
  action: { marginTop: theme.spacing.xl, width: '100%', maxWidth: 320 }
});
