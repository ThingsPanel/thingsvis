import { WIDGET_CATEGORIES, type WidgetCategory } from '@thingsvis/schema';

/** 统一引用 @thingsvis/schema 中的权威分类 */
export const categories = WIDGET_CATEGORIES;
export type Category = WidgetCategory;

export function normalizeCategory(input: string): Category {
  const v = input.trim().toLowerCase();
  const found = categories.find(c => c === v);
  if (!found) {
    throw new Error(`Invalid category "${input}". Expected one of: ${categories.join(', ')}`);
  }
  return found;
}


