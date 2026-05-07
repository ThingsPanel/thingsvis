import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('说明').describe('Title'),
  body: z
    .string()
    .default('支持多段说明文本\\n可用于公告、备注或操作说明。')
    .describe('Body'),
  showTitle: z.boolean().default(true).describe('Show title'),
  titleFontSize: z.number().min(12).max(32).default(18).describe('Title font size'),
  bodyFontSize: z.number().min(10).max(24).default(14).describe('Body font size'),
  lineHeight: z.number().min(1).max(2.4).default(1.6).describe('Line height'),
  align: z.enum(['left', 'center', 'right']).default('left').describe('Align'),
  titleColor: z.string().default('').describe('Title color'),
  bodyColor: z.string().default('').describe('Body color'),
  backgroundColor: z.string().default('#ffffff').describe('Background color'),
  backgroundOpacity: z.number().min(0).max(1).default(0.92).describe('Background opacity'),
  borderColor: z.string().default('rgba(148, 163, 184, 0.28)').describe('Border color'),
  borderWidth: z.number().min(0).max(8).default(1).describe('Border width'),
  cornerRadius: z.number().min(0).max(32).default(12).describe('Corner radius'),
  paddingSize: z.number().min(8).max(40).default(18).describe('Padding'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
