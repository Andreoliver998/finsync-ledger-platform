export function buildStableKey(...parts) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part) => part !== undefined && part !== null && String(part).trim() !== '')
    .map((part) => String(part).trim())
    .join('__');
}

export function uniqueByStableKey(items, getParts) {
  if (!Array.isArray(items) || !items.length) return [];

  const seen = new Set();
  const unique = [];

  items.forEach((item) => {
    const parts = typeof getParts === 'function' ? getParts(item) : [item];
    const key = buildStableKey(parts);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique;
}
