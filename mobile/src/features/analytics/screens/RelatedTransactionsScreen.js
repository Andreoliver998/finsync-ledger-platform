import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { TransactionRow } from '@components/TransactionRow';
import { theme } from '@theme/index';
import { normalizeTransaction } from '@utils/analyticsData';
import { safeText } from '@utils/safeText';
import { buildStableKey } from '@utils/buildStableKey';

export function RelatedTransactionsScreen({ navigation, route }) {
  const title = safeText(route?.params?.title, 'Transações relacionadas');
  const items = useMemo(
    () => (Array.isArray(route?.params?.items) ? route.params.items.map(normalizeTransaction) : []),
    [route?.params?.items]
  );

  if (!items.length) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="git-compare-outline"
          title="Nenhuma transação relacionada"
          description="Abra esta tela a partir de um dossiê, insight ou detalhe de transação para ver o contexto completo."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <AppCard variant="elevated" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.secondary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{items.length} movimentações conectadas ao contexto atual.</Text>
          </View>
        </View>
      </AppCard>

      <SectionHeader title="Lista completa" subtitle="Toque para abrir o detalhe individual" />
      <View style={styles.list}>
        {items.map((item) => (
          <TransactionRow
            key={buildStableKey(item.id, item.date, item.description, item.amount, item.merchant)}
            transaction={item}
            onPress={() => item.id && navigation.navigate('TransactionDetails', { transactionId: item.id })}
          />
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroText: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold
  },
  subtitle: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  },
  list: {
    paddingBottom: theme.spacing.xxxl
  }
});
