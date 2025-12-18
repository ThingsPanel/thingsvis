export const categories = [
  'basic',
  'layout',
  'media',
  'custom',
  'data',
  'chart',
  'interaction'
] as const;

export type Category = (typeof categories)[number];

export function normalizeCategory(input: string): Category {
  const v = input.trim().toLowerCase();
  const found = categories.find(c => c === v);
  if (!found) {
    throw new Error(`Invalid category "${input}". Expected one of: ${categories.join(', ')}`);
  }
  return found;
}


