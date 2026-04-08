import { z } from 'zod';

export const PropsSchema = z.object({
  // 变体选择
  variant: z.string().default('glow-beam'),

  // 颜色
  useThemeColor: z.boolean().default(true).describe('props.useThemeColor'),
  primaryColor: z.string().default('#00c2ff').describe('props.primaryColor'),
  secondaryColor: z.string().default('#00d4ff').describe('props.secondaryColor'),
  glowColor: z.string().default('#00c2ff').describe('props.glowColor'),

  // 动画
  animated: z.boolean().default(false).describe('props.animated'),
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),

  // 装饰开关
  showDecoration: z.boolean().default(true).describe('props.showDecoration'),

  // 文字内容（默认空，由变体自行决定是否显示）
  title: z.string().default('').describe('props.title'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
