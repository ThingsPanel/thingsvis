import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 样式属性
  // ========================================

  /** 填充颜色 */
  fill: z.string().default('#dbeafe').describe('props.fillColor'),

  /** 边框颜色 */
  stroke: z.string().default('transparent').describe('props.borderColor'),

  /** 边框宽度 */
  strokeWidth: z.number().min(0).max(20).default(0).describe('props.borderWidth'),

  /** 圆角半径 */
  cornerRadius: z.number().min(0).max(100).default(0).describe('props.borderRadius'),

  /** 透明度 */
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
});

export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
