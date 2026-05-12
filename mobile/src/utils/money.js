const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const COMPACT = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1
});

/**
 * Format BRL currency. Accepts number or numeric string.
 * Falls back to 0 if value is invalid.
 */
export function formatBRL(value) {
  const num = toNumber(value);
  return BRL.format(num);
}

export function formatBRLCompact(value) {
  const num = toNumber(value);
  if (Math.abs(num) < 10_000) return formatBRL(num);
  return `R$ ${COMPACT.format(num)}`;
}

/** Returns the formatted amount with a leading sign for income/expense. */
export function formatSignedAmount(value, { kind } = {}) {
  const num = toNumber(value);
  const sign = kind === 'INCOME' ? '+' : kind === 'EXPENSE' ? '-' : num >= 0 ? '+' : '-';
  return `${sign} ${BRL.format(Math.abs(num))}`;
}

export function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}
