import { z } from 'zod';

export const PropsSchema = z.object({
  // 颜色设置 - 默认使用 #6965db (dawn主题的紫色)
  useThemeColor: z.boolean().default(true).describe('props.useThemeColor'),
  color: z.string().default('#6965db').describe('props.color'),
  glowColor: z.string().default('#6965db').describe('props.glowColor'),
  
  // 样式
  lineWidth: z.number().min(1).max(8).default(3).describe('props.lineWidth'),
  cornerLength: z.number().min(10).max(50).default(25).describe('props.cornerLength'),
  opacity: z.number().min(0.1).max(1).default(1).describe('props.opacity'),
  
  // 发光效果
  glowIntensity: z.number().min(0).max(3).default(1.5).describe('props.glowIntensity'),
  
  // 动画
  animated: z.boolean().default(true).describe('props.animated'),
  animationSpeed: z.number().min(0.5).max(10).default(2).describe('props.animationSpeed'),
});

export type Props = z.infer<typeof PropsSchema>;
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
