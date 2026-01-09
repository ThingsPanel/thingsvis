/**
 * 矩形组件属性 Schema
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 样式属性
  // ========================================
  
  /** 填充颜色 */
  fill: z.string().default('#6965db').describe('填充颜色'),
  
  /** 边框颜色 */
  stroke: z.string().default('#4845a5').describe('边框颜色'),
  
  /** 边框宽度 */
  strokeWidth: z.number().min(0).max(20).default(2).describe('边框宽度'),
  
  /** 圆角半径 */
  cornerRadius: z.number().min(0).max(100).default(0).describe('圆角半径'),
  
  /** 透明度 */
  opacity: z.number().min(0).max(1).default(1).describe('透明度'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
