import { z } from 'zod';

/**
 * 统一组件分类枚举（唯一权威来源）
 *
 * 所有消费方（CLI / deploy / Studio UI / defineWidget）均引用此处定义。
 */
export const WIDGET_CATEGORIES = [
  'basic',
  'chart',
  'interaction',
  'media',
  'resources',
  'data',
  'layout',
  'indicator',
  'geo',
  'custom',
] as const;

export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export const WidgetCategorySchema = z.enum(WIDGET_CATEGORIES);
