/**
 * 图片组件属性 Schema
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 内容属性
  // ========================================
  
  /** 图片数据URL（base64） */
  dataUrl: z.string().default('').describe('props.imageData'),
  
  // ========================================
  // 样式属性
  // ========================================
  
  /** 透明度 */
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
  
  /** 对象填充方式 */
  objectFit: z.enum(['contain', 'cover', 'fill', 'none']).default('fill').describe('props.objectFit'),
  
  /** 圆角半径 */
  cornerRadius: z.number().min(0).max(100).default(0).describe('props.borderRadius'),
  
  /** 边框颜色 */
  borderColor: z.string().default('transparent').describe('props.borderColor'),
  
  /** 边框宽度 */
  borderWidth: z.number().min(0).max(20).default(0).describe('props.borderWidth'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
