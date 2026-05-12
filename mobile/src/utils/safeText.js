export function safeText(value, fallback = '') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    return String(
      value.summary ||
        value.label ||
        value.title ||
        value.name ||
        value.normalizedName ||
        value.relationshipSummary?.summary ||
        value.relationshipSummary?.label ||
        fallback
    );
  }
  return fallback;
}
