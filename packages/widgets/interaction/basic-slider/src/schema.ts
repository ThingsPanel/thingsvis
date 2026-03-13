import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('滑块').describe('props.label'),
  value: z.number().default(50).describe('props.value'),
  min: z.number().default(0).describe('props.min'),
  max: z.number().default(100).describe('props.max'),
  step: z.number().min(0.01).default(1).describe('props.step'),
  unit: z.string().default('').describe('props.unit'),
  showValue: z.boolean().default(true).describe('props.showValue'),
  trackColor: z.string().default('#3b82f6').describe('props.trackColor'),
  backgroundColor: z.string().default('#1e293b').describe('props.bgColor'),
  textColor: z.string().default('#f1f5f9').describe('props.textColor'),
  disabled: z.boolean().default(false).describe('props.disabled'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
