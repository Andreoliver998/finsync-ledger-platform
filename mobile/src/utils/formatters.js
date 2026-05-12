import { theme } from '@theme/index';

export function formatEntityType(type) {
  const labels = {
    person: 'Pessoa',
    merchant: 'Empresa',
    bank: 'Banco',
    paymentMethod: 'Método',
    category: 'Categoria'
  };
  return labels[type] || (typeof type === 'string' ? type : 'Entidade');
}

export function getEntityColor(type) {
  const map = {
    person: theme.colors.accent,
    merchant: theme.colors.secondary,
    bank: theme.colors.primary,
    paymentMethod: theme.colors.action,
    category: theme.colors.primary
  };
  return map[type] || theme.colors.muted;
}

export function getEntityBg(type) {
  const map = {
    person: theme.colors.accentSoft,
    merchant: theme.colors.secondarySoft,
    bank: theme.colors.primarySoft,
    paymentMethod: theme.colors.actionSoft,
    category: theme.colors.primarySoft
  };
  return map[type] || theme.colors.surface2;
}

export function getEntityIcon(type) {
  const map = {
    person: 'person-outline',
    merchant: 'storefront-outline',
    bank: 'business-outline',
    paymentMethod: 'card-outline',
    category: 'pricetag-outline'
  };
  return map[type] || 'help-circle-outline';
}

export function getDirectionColor(direction) {
  if (!direction) return theme.colors.muted;
  const d = String(direction)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (d.includes('in') || d.includes('entrada') || d.includes('recebid')) return theme.colors.success;
  if (d.includes('out') || d.includes('saida') || d.includes('enviado')) return theme.colors.danger;
  return theme.colors.muted;
}

export function getMethodIcon(method) {
  if (!method) return 'card-outline';
  const m = String(method)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (m.includes('pix')) return 'flash-outline';
  if (m.includes('ted') || m.includes('doc') || m.includes('transfer')) return 'swap-horizontal-outline';
  if (m.includes('boleto')) return 'barcode-outline';
  if (m.includes('debito')) return 'card-outline';
  if (m.includes('credito')) return 'card-outline';
  if (m.includes('dinheiro') || m.includes('cash')) return 'cash-outline';
  return 'card-outline';
}

export function formatPercent(value, decimals = 0) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '—';
  // Values between -1 and 1 are treated as decimal fractions (e.g. 0.36 → "36%")
  const pct = num > -1 && num < 1 && num !== 0 ? num * 100 : num;
  return `${pct.toFixed(decimals)}%`;
}

export function inferEntityType(name) {
  const s = String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
  if (!s) return 'person';
  if (['PIX', 'TED', 'DOC', 'BOLETO', 'CREDITO', 'DEBITO', 'TRANSFERENCIA'].some((k) => s.includes(k)))
    return 'paymentMethod';
  if (['NUBANK', 'ITAU', 'BANCO', 'BRADESCO', 'SANTANDER', 'INTER', 'C6', 'CAIXA'].some((k) => s.includes(k)))
    return 'bank';
  if (['MERCADO', 'IFOOD', 'UBER', 'AMAZON', 'PREZUNIC', 'SHOPPEE', 'MAGALU'].some((k) => s.includes(k)))
    return 'merchant';
  if (['TRANSFERENCIAS', 'ALIMENTACAO', 'TRANSPORTE', 'SALARIO'].some((k) => s.includes(k)))
    return 'category';
  return 'person';
}
