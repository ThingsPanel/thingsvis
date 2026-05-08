import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('标题').describe('Card title label'),
  value: z.union([z.number(), z.string()]).default(0).describe('Primary value (number or string)'),
  unit: z.string().default('').describe('Unit suffix (e.g., %, °C, kW)'),
  showUnit: z.boolean().default(false).describe('Display unit suffix'),
  precision: z.number().int().min(0).max(6).default(0).describe('Decimal precision'),
  trend: z.number().default(12.5).describe('Trend percentage (positive=up, negative=down)'),
  trendLabel: z.string().default('').describe('Trend context label'),
  showTrend: z.boolean().default(false).describe('Display trend indicator'),
  titleFontSize: z.number().int().min(10).max(100).default(12).describe('props.titleFontSize'),
  showIcon: z.boolean().default(false).describe('props.showIcon'),
  icon: z.string().default('i-lucide:thermometer').describe('props.icon'),
  iconPosition: z.enum(['top', 'left', 'right']).default('top').describe('props.iconPosition'),
  iconSize: z.number().int().min(12).max(100).default(32).describe('props.iconSize'),
  iconColor: z.string().default('').describe('props.iconColor'),
  iconBackgroundColor: z.string().default('').describe('props.iconBackgroundColor'),
  valueColor: z.enum(['auto', 'theme', 'success', 'warning', 'danger']).default('auto').describe('Value color mode'),
  thresholds: z.string().default('[]').describe('Threshold rules JSON array'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
