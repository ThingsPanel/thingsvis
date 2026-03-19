import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('时间范围').describe('props.label'),
  startTime: z.string().default('').describe('props.startTime'),
  endTime: z.string().default('').describe('props.endTime'),
  showPresets: z.boolean().default(true).describe('props.showPresets'),
  textColor: z.string().default('#e2e8f0').describe('props.textColor'),
  accentColor: z.string().default('#3b82f6').describe('props.accentColor'),
  fontSize: z.number().min(10).max(20).default(12).describe('props.fontSize'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
