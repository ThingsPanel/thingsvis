import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('PM2.5').describe('标题'),
  value: z.string().default('35').describe('数值'),
  unit: z.string().default('µg/m³').describe('单位'),
  textColor: z.string().default('#111827').describe('文字颜色'),
  accentColor: z.string().default('#16a34a').describe('强调色'),
  backgroundColor: z.string().default('rgba(255,255,255,0.9)').describe('背景色')
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
