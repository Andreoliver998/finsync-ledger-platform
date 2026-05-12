import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';
import { formatBRL, formatSignedAmount } from '@utils/money';
import { formatShortDate } from '@utils/date';

const ICON_BY_KIND = {
  INCOME: { name: 'arrow-down-circle', color: theme.colors.success, bg: theme.colors.successSoft },
  EXPENSE: { name: 'arrow-up-circle', color: theme.colors.danger, bg: theme.colors.dangerSoft },
  TRANSFER: { name: 'swap-horizontal', color: theme.colors.secondary, bg: theme.colors.secondarySoft },
  UNKNOWN: { name: 'ellipsis-horizontal-circle', color: theme.colors.muted, bg: theme.colors.surfaceElevated }
};

function detectKind(tx) {
  if (tx?.kind) return tx.kind;
  if (typeof tx?.amount === 'number') {
    if (tx.amount > 0) return 'INCOME';
    if (tx.amount < 0) return 'EXPENSE';
  }
  if (tx?.type === 'income' || tx?.type === 'INCOME') return 'INCOME';
  if (tx?.type === 'expense' || tx?.type === 'EXPENSE') return 'EXPENSE';
  return 'UNKNOWN';
}

function TransactionRowBase({ transaction, onPress }) {
  const kind = detectKind(transaction);
  const icon = ICON_BY_KIND[kind] ?? ICON_BY_KIND.UNKNOWN;
  const amount = Number(transaction?.amount ?? 0);
  const showSigned = kind === 'INCOME' || kind === 'EXPENSE';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.kindStripe, { backgroundColor: icon.color }]} />
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction?.description || transaction?.merchant || 'Lançamento'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {[transaction?.category, transaction?.bank, formatShortDate(transaction?.date)]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            kind === 'INCOME' && { color: theme.colors.success },
            kind === 'EXPENSE' && { color: theme.colors.danger }
          ]}
          numberOfLines={1}
        >
          {showSigned ? formatSignedAmount(amount, { kind }) : formatBRL(amount)}
        </Text>
        {transaction?.paymentMethod ? (
          <Text style={styles.method} numberOfLines={1}>
            {String(transaction.paymentMethod).toLowerCase()}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const TransactionRow = memo(TransactionRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: 'hidden'
  },
  kindStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3
  },
  rowPressed: { opacity: 0.88 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  middle: { flex: 1, paddingRight: theme.spacing.sm },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 2
  },
  right: { alignItems: 'flex-end' },
  amount: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold
  },
  method: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginTop: 2,
    textTransform: 'capitalize'
  }
});
