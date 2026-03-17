import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('总览数值').describe('Card title label'),
  value: z.union([z.number(), z.string()]).default(0).describe('Primary value (number or string)'),
  unit: z.string().default('元').describe('Unit suffix (e.g., %, °C, kW)'),
  showUnit: z.boolean().default(true).describe('Display unit suffix'),
  precision: z.number().int().min(0).max(6).default(0).describe('Decimal precision'),
  trend: z.number().default(12.5).describe('Trend percentage (positive=up, negative=down)'),
  trendLabel: z.string().default('较上月').describe('Trend context label'),
  showTrend: z.boolean().default(true).describe('Display trend indicator'),
  valueColor: z.enum(['auto', 'theme', 'success', 'warning', 'danger']).default('auto').describe('Value color mode'),
  thresholds: z.string().default('[]').describe('Threshold rules JSON array'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
