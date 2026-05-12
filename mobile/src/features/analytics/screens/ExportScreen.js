import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { theme } from '@theme/index';
import { safeText } from '@utils/safeText';

export function ExportScreen({ route }) {
  const title = safeText(route?.params?.title, 'Exportar dossiê');
  const scope = safeText(route?.params?.q || route?.params?.query, 'contexto atual');

  return (
    <AppScreen scroll>
      <LinearGradient
        colors={['rgba(251,155,54,0.2)', 'rgba(6,182,212,0.12)', 'rgba(157,255,44,0.08)']}
        style={styles.hero}
      >
        <View style={styles.pill}>
          <Ionicons name="download-outline" size={16} color={theme.colors.action} />
          <Text style={styles.pillText}>Exportação preparada</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          O fluxo de exportação foi registrado para {scope}. Esta tela evita que o botão quebre e deixa o caminho pronto para integrações futuras.
        </Text>
      </LinearGradient>

      <AppCard variant="elevated">
        <Text style={styles.sectionTitle}>Payload recebido</Text>
        <Text style={styles.meta}>Tipo: {safeText(route?.params?.type, '—')}</Text>
        <Text style={styles.meta}>Query: {safeText(route?.params?.q, '—')}</Text>
        <Text style={styles.meta}>Entity ID: {safeText(route?.params?.entityId, '—')}</Text>
        <Text style={styles.meta}>Origem: {safeText(route?.params?.source, '—')}</Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(13,13,26,0.58)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6
  },
  pillText: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.lg
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
    marginTop: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md
  },
  meta: {
    color: theme.colors.textSubtle,
    marginBottom: theme.spacing.sm
  }
});
