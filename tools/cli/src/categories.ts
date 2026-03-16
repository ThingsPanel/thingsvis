export const categories = [
  'basic',
  'chart',
  'interaction',
  'media',
  'data',
  'layout',
  'indicator',
  'geo',
  'custom',
] as const;

export type Category = (typeof categories)[number];

export function normalizeCategory(input: string): Category {
  const value = input.trim().toLowerCase();
  const found = categories.find((category) => category === value);

  if (!found) {
    throw new Error(`Invalid category "${input}". Expected one of: ${categories.join(', ')}`);
  }

  return found;
}
