/**
 * 属性 Schema 定义
 */
import { z } from 'zod';

/**
 * 组件属性 Schema
 */
export const PropsSchema = z.object({
  // 示例属性
  fill: z.string().default('#6965db').describe('填充颜色'),
  opacity: z.number().min(0).max(1).default(1).describe('不透明度'),
});

/**
 * 属性类型
 */
export type Props = z.infer<typeof PropsSchema>;

/**
 * 获取默认属性
 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
