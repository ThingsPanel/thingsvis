import type { ControlText } from '@thingsvis/schema';

type Translate = (key: string, options?: { defaultValue?: string }) => string;

function getLocaleCandidates(locale?: string): string[] {
  const exact = typeof locale === 'string' ? locale.trim() : '';
  const lower = exact.toLowerCase();
  const base = lower.split(/[-_]/)[0] ?? '';
  return [exact, lower, base].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index,
  );
}

function resolveLocaleMap(text: Record<string, string>, locale?: string): string {
  const entries = Object.entries(text);
  if (entries.length === 0) {
    return '';
  }

  const candidates = getLocaleCandidates(locale);

  for (const candidate of candidates) {
    const direct = text[candidate];
    if (typeof direct === 'string') {
      return direct;
    }

    const matched = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase());
    if (matched?.[1]) {
      return matched[1];
    }
  }

  const english = entries.find(([key]) => key === 'en' || key.toLowerCase() === 'en');
  return english?.[1] ?? entries[0]?.[1] ?? '';
}

export function resolveControlText(
  text: ControlText | undefined,
  locale: string | undefined,
  translate: Translate,
): string {
  if (!text) {
    return '';
  }

  if (typeof text === 'string') {
    return translate(text, { defaultValue: text });
  }

  return resolveLocaleMap(text, locale);
}
