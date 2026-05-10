import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('列表').describe('Title'),
  showTitle: z.boolean().default(true).describe('Show title'),

  /** 每行以 Tab 分列：两列为「左边」「右边」，三列为「图标」「左边」「右边」；图标可为文字/emoji 或 http(s) / data:image 图片链接 */
  itemsText: z
    .string()
    .default(
      `运行时间\t6.5 h
累计供热量\t125.6 GJ
供水泵\t运行
回水泵\t正常
供水温度\t47.2 ℃`,
    )
    .describe('Items'),

  listMode: z.enum(['unordered', 'ordered']).default('unordered').describe('List mode'),

  unorderedMarker: z.enum(['disc', 'circle', 'square', 'dash', 'check', 'custom']).default('disc').describe('Bullet'),
  /** 当 unorderedMarker 为 custom 时使用 */
  customBullet: z.string().default('•').describe('Custom bullet'),

  /** 有序列表序号样式：1. / 1) / (1) / 无前缀后缀 */
  numberStyle: z.enum(['dot', 'parenClose', 'parenAround', 'plain']).default('dot').describe('Number style'),
  /** 有序列表起始序号（整数） */
  orderStart: z.number().int().min(-99999).max(99999).default(1).describe('Order start'),

  showLeading: z.boolean().default(true).describe('Show leading icon or list marker'),
  showLeftText: z.boolean().default(true).describe('Show left label'),
  showRightText: z.boolean().default(true).describe('Show right value'),

  leftFontSize: z.number().min(8).max(36).default(14).describe('Left font size'),
  rightFontSize: z.number().min(8).max(36).default(14).describe('Right font size'),
  leadingFontSize: z.number().min(8).max(36).default(14).describe('Leading / bullet size'),

  titleFontSize: z.number().min(12).max(28).default(16).describe('Title font size'),
  rowGap: z.number().min(0).max(64).default(10).describe('Row gap'),

  titleColor: z.string().default('').describe('Title color'),
  leftColor: z.string().default('').describe('Left text color'),
  rightColor: z.string().default('').describe('Right text color'),
  leadingColor: z.string().default('').describe('Leading marker / icon tint'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
