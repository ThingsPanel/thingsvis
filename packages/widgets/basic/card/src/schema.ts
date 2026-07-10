import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('卡片标题').describe('props.title'),
  subtitle: z.string().default('辅助说明').describe('props.subtitle'),
  body: z.string().default('用于承载摘要信息、说明文本或其他组件占位。').describe('props.body'),
  showSubtitle: z.boolean().default(true).describe('props.showSubtitle'),
  fillColor: z.string().default('#ffffff').describe('props.fillColor'),
  fillOpacity: z.number().min(0).max(1).default(0.1).describe('props.fillOpacity'),
  borderColor: z.string().default('rgba(148, 163, 184, 0.3)').describe('props.borderColor'),
  borderWidth: z.number().min(0).max(12).default(1).describe('props.borderWidth'),
  cornerRadius: z.number().min(0).max(32).default(0).describe('props.cornerRadius'),
  paddingSize: z.number().min(8).max(40).default(16).describe('props.paddingSize'),
  titleFontSize: z.number().int().min(10).max(100).default(16).describe('props.titleFontSize'),
  titleColor: z.string().default('').describe('props.titleColor'),
  subtitleColor: z.string().default('').describe('props.subtitleColor'),
  bodyColor: z.string().default('').describe('props.bodyColor'),
  shadowEnabled: z.boolean().default(true).describe('props.shadowEnabled'),
  shadowColor: z.string().default('rgba(15, 23, 42, 0.16)').describe('props.shadowColor'),
  shadowBlur: z.number().min(0).max(80).default(20).describe('props.shadowBlur'),
  shadowOffsetY: z.number().min(-40).max(40).default(10).describe('props.shadowOffsetY'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
