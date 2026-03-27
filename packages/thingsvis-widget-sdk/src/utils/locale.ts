function getLocaleCandidates(locale?: string): string[] {
  const exact = typeof locale === 'string' ? locale.trim() : '';
  const lower = exact.toLowerCase();
  const base = lower.split(/[-_]/)[0] ?? '';
  return [exact, lower, base].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index);
}

export function resolveLocaleRecord<T>(
  records: Record<string, T>,
  locale?: string,
  fallbackLocale = 'en',
): T {
  const entries = Object.entries(records);
  if (entries.length === 0) {
    throw new Error('resolveLocaleRecord() requires at least one locale record.');
  }

  const candidates = [...getLocaleCandidates(locale), ...getLocaleCandidates(fallbackLocale)];

  for (const candidate of candidates) {
    const direct = records[candidate];
    if (direct !== undefined) {
      return direct;
    }

    const matched = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase());
    if (matched) {
      return matched[1];
    }
  }

  return entries[0]![1];
}
