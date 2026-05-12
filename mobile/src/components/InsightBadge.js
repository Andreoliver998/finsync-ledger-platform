import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';

const PRESETS = {
  positivo: { icon: 'trending-up', color: theme.colors.success, bg: theme.colors.successSoft, label: 'Positivo' },
  atencao: { icon: 'warning-outline', color: theme.colors.warning, bg: theme.colors.warningSoft, label: 'Atenção' },
  'alto-gasto': { icon: 'flame-outline', color: theme.colors.danger, bg: theme.colors.dangerSoft, label: 'Alto gasto' },
  'sem-dados': { icon: 'help-circle-outline', color: theme.colors.muted, bg: theme.colors.surfaceElevated, label: 'Sem dados' },
  pix: { icon: 'flash-outline', color: theme.colors.secondary, bg: theme.colors.secondarySoft, label: 'PIX' },
  debito: { icon: 'card-outline', color: theme.colors.accent, bg: theme.colors.accentSoft, label: 'Débito' },
  credito: { icon: 'card-outline', color: theme.colors.primary, bg: theme.colors.primarySoft, label: 'Crédito' },
  transferencia: { icon: 'swap-horizontal-outline', color: theme.colors.secondary, bg: theme.colors.secondarySoft, label: 'Transferência' },
  boleto: { icon: 'document-text-outline', color: theme.colors.action, bg: theme.colors.actionSoft, label: 'Boleto' },
  entrada: { icon: 'arrow-down-circle-outline', color: theme.colors.success, bg: theme.colors.successSoft, label: 'Entrada' },
  saida: { icon: 'arrow-up-circle-outline', color: theme.colors.danger, bg: theme.colors.dangerSoft, label: 'Saída' },
  neutro: { icon: 'remove-circle-outline', color: theme.colors.muted, bg: theme.colors.surfaceElevated, label: 'Neutro' }
};

export function InsightBadge({ variant, icon, label, color, bg, size = 'md', style }) {
  const preset = variant ? PRESETS[variant] : null;
  const resolvedIcon = icon ?? preset?.icon ?? 'information-circle-outline';
  const resolvedLabel = label ?? preset?.label ?? (variant ? String(variant) : '');
  const resolvedColor = color ?? preset?.color ?? theme.colors.muted;
  const resolvedBg = bg ?? preset?.bg ?? theme.colors.surfaceElevated;
  const small = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: resolvedBg }, small && styles.badgeSm, style]}>
      <Ionicons name={resolvedIcon} size={small ? 11 : 14} color={resolvedColor} />
      {resolvedLabel ? (
        <Text style={[styles.label, { color: resolvedColor }, small && styles.labelSm]}>
          {resolvedLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: theme.radius.pill
  },
  badgeSm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3
  },
  label: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold
  },
  labelSm: {
    fontSize: theme.typography.size.xs
  }
});
