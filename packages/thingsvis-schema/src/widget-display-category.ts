import { z } from 'zod';

export const WIDGET_DISPLAY_CATEGORIES = [
  'basic',
  'indicator',
  'charts',
  'controls',
  'industrial',
  'mediaDecoration',
] as const;

export type WidgetDisplayCategory = (typeof WIDGET_DISPLAY_CATEGORIES)[number];

export const WidgetDisplayCategorySchema = z.enum(WIDGET_DISPLAY_CATEGORIES);
