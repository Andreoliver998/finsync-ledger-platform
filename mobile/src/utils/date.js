const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const SHORT_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short'
});

const LONG_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

export function formatDate(input) {
  const d = toDate(input);
  if (!d) return '—';
  return DATE_FMT.format(d);
}

export function formatShortDate(input) {
  const d = toDate(input);
  if (!d) return '—';
  return SHORT_FMT.format(d);
}

export function formatLongDate(input) {
  const d = toDate(input);
  if (!d) return '—';
  return LONG_FMT.format(d);
}

export function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function relativeFromNow(input) {
  const d = toDate(input);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  return formatDate(d);
}
