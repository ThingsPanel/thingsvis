import { z } from 'zod';

export const ThresholdSchema = z.object({
  at: z.number().describe('props.thresholdAt'),
  color: z.string().describe('props.thresholdColor'),
});

export const PropsSchema = z.object({
  value: z.number().default(60).describe('props.value'),
  max: z.number().min(1).default(100).describe('props.max'),
  label: z.string().default('').describe('props.label'),
  unit: z.string().default('%').describe('props.unit'),
  showValue: z.boolean().default(true).describe('props.showValue'),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal').describe('props.orientation'),
  color: z.string().default('#3b82f6').describe('props.color'),
  trackColor: z.string().default('rgba(255,255,255,0.1)').describe('props.trackColor'),
  backgroundColor: z.string().default('#1e1e2e').describe('props.bgColor'),
  textColor: z.string().default('#e2e8f0').describe('props.textColor'),
  fontSize: z.number().min(10).max(32).default(13).describe('props.fontSize'),
  borderRadius: z.number().min(0).max(20).default(8).describe('props.borderRadius'),
  /** Threshold breakpoints: when value ≥ at, bar turns this color. Sorted ascending. */
  thresholds: z.array(ThresholdSchema).default([
    { at: 80, color: '#f59e0b' },
    { at: 95, color: '#ef4444' },
  ]).describe('props.thresholds'),
  animated: z.boolean().default(true).describe('props.animated'),
});

export type Props = z.infer<typeof PropsSchema>;
export type Threshold = z.infer<typeof ThresholdSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
