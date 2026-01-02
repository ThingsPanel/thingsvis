import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 内容属性
  // ========================================
  
  /** 标题 */
  title: z.string().default('PM2.5').describe('标题'),
  
  /** 数值 */
  value: z.union([z.string(), z.number()]).default(27).describe('数值'),
  
  /** 单位 */
  unit: z.string().default('ug/m3').describe('单位'),
  
  /** 状态（true/1/'online' 表示在线，false/0/'offline' 表示离线） */
  status: z.union([z.boolean(), z.number(), z.string()]).default(true).describe('状态'),

  // ========================================
  // 样式属性
  // ========================================
  
  /** 卡片背景色 */
  backgroundColor: z.string().default('#ffffff').describe('背景颜色'),
  
  /** 标题颜色 */
  titleColor: z.string().default('#333333').describe('标题颜色'),
  
  /** 数值颜色 */
  valueColor: z.string().default('#333333').describe('数值颜色'),
  
  /** 单位颜色 */
  unitColor: z.string().default('#666666').describe('单位颜色'),
  
  /** 图标颜色 */
  iconColor: z.string().default('#333333').describe('图标颜色'),
  
  /** 字体 */
  fontFamily: z.string().default('sans-serif').describe('字体'),
});

export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
