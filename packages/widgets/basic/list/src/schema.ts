import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('列表').describe('Title'),
  showTitle: z.boolean().default(true).describe('Show title'),
  itemsText: z
    .string()
    .default('设备在线率\\n今日告警 3 条\\n待处理工单 2 条')
    .describe('Items'),
  bulletStyle: z.enum(['dot', 'check', 'number']).default('dot').describe('Bullet style'),
  fontSize: z.number().min(10).max(24).default(14).describe('Font size'),
  titleFontSize: z.number().min(12).max(28).default(16).describe('Title font size'),
  rowGap: z.number().min(4).max(24).default(10).describe('Row gap'),
  titleColor: z.string().default('').describe('Title color'),
  textColor: z.string().default('').describe('Text color'),
  accentColor: z.string().default('#2563eb').describe('Accent color'),
  backgroundColor: z.string().default('#ffffff').describe('Background color'),
  borderColor: z.string().default('rgba(148, 163, 184, 0.28)').describe('Border color'),
  borderWidth: z.number().min(0).max(8).default(1).describe('Border width'),
  cornerRadius: z.number().min(0).max(32).default(12).describe('Corner radius'),
  paddingSize: z.number().min(8).max(32).default(16).describe('Padding'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
