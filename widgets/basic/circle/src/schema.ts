import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 样式属性
  // ========================================

  /** 填充颜色 */
  fill: z.string().default('transparent').describe('填充颜色'),

  /** 边框颜色 */
  stroke: z.string().default('#000000').describe('props.borderColor'),

  /** 边框宽度 */
  strokeWidth: z.number().min(0).max(20).default(2).describe('边框宽度'),

  /** 透明度 */
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
});

export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
