import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { useAuth } from '@contexts/AuthContext';
import { apiMeta } from '@services/api';
import { theme } from '@theme/index';

function Row({ icon, label, value, onPress, danger }) {
  const Container = onPress ? Pressable : View;
  const containerStyle = [styles.row];
  const containerProps = onPress
    ? {
        onPress,
        android_ripple: { color: theme.colors.primarySoft },
        style: ({ pressed }) => [...containerStyle, pressed ? styles.rowPressed : null]
      }
    : {
        style: containerStyle
      };

  return (
    <Container {...containerProps}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={danger ? theme.colors.danger : theme.colors.muted} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: theme.colors.danger }]}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} /> : null}
    </Container>
  );
}

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const versionLabel = '0.1.0';

  const confirmLogout = () => {
    Alert.alert('Sair da conta', 'Deseja encerrar a sessão neste dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        }
      }
    ]);
  };

  return (
    <AppScreen scroll>
      <View style={styles.hero}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Conta, conexão e segurança</Text>
      </View>

      <AppCard variant="elevated">
        <Text style={styles.cardTitle}>Conta</Text>
        <Row icon="person-outline" label="Nome" value={user?.name || '—'} />
        <Row icon="mail-outline" label="E-mail" value={user?.email || '—'} />
        {user?.id ? <Row icon="finger-print-outline" label="ID" value={user.id} /> : null}
      </AppCard>

      <AppCard style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.cardTitle}>Conexão</Text>
        <Row icon="cloud-outline" label="API" value={apiMeta.baseURL} />
        <Row icon="time-outline" label="Timeout" value={`${apiMeta.timeout} ms`} />
      </AppCard>

      <AppCard style={{ marginTop: theme.spacing.lg }} variant="outline">
        <Text style={styles.cardTitle}>Segurança</Text>
        <Row icon="lock-closed-outline" label="Token JWT" value="Armazenado em Keystore" />
        <Row icon="shield-checkmark-outline" label="Sessão" value="Auto-expira após 401" />
      </AppCard>

      <AppButton
        label={loggingOut ? 'Saindo…' : 'Sair da conta'}
        variant="danger"
        loading={loggingOut}
        onPress={confirmLogout}
        style={{ marginTop: theme.spacing.xl }}
      />

      <Text style={styles.legal}>{`FinSync Mobile • v${versionLabel}`}</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold
  },
  subtitle: { color: theme.colors.muted, marginTop: 2 },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  rowPressed: { opacity: 0.85 },
  rowIcon: { width: 24 },
  rowLabel: { color: theme.colors.text, flex: 1, fontSize: theme.typography.size.md },
  rowValue: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    maxWidth: '55%',
    textAlign: 'right',
    paddingHorizontal: theme.spacing.sm
  },
  legal: {
    color: theme.colors.mutedStrong,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.size.sm
  }
});
