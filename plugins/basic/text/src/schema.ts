/**
 * 文本组件属性 Schema
 * 
 * ⭐ 这是开发者需要重点关注的文件
 * 
 * 📝 开发指南：
 * - 使用 Zod 定义组件的所有可配置属性
 * - 使用 .describe() 设置属性在面板中的显示标签
 * - 使用 .default() 设置属性默认值
 * - 属性会自动生成到 Studio 的属性面板中
 * 
 * 📌 属性分类建议：
 * - 内容属性：text, title, label 等（通常需要数据绑定）
 * - 样式属性：fill, fontSize, fontWeight 等（通常使用静态值）
 * 
 * 💡 提示：
 * - 使用 z.enum() 定义枚举属性，会自动生成下拉选择器
 * - 颜色属性需要在 controls.ts 中配置为 'color' 类型
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 内容属性（通常需要数据绑定）
  // ========================================
  
  /** 文本内容 */
  text: z.string().default('请输入文本').describe('文本内容'),

  // ========================================
  // 样式属性
  // ========================================
  
  /** 文字颜色 */
  fill: z.string().default('#000000').describe('文字颜色'),
  
  /** 字号（像素） */
  fontSize: z.number().min(1).max(999).default(16).describe('字号'),
  
  /** 字重 */
  fontWeight: z.enum(['normal', 'bold']).default('normal').describe('字重'),
  
  /** 文本对齐 */
  textAlign: z.enum(['left', 'center', 'right']).default('left').describe('对齐方式'),
  
  /** 字体 */
  fontFamily: z.string().default('sans-serif').describe('字体'),
});

/** 属性类型（用于 TypeScript 类型推导） */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
