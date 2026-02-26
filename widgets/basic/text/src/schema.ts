/**
 * 文本组件属性 Schema
 * 
 * ⭐ 使用 @thingsvis/widget-sdk 重构
 * 
 * 📝 属性分类：
 * - 内容属性：text（需要数据绑定）
 * - 字体属性：fontSize, fontFamily, fontWeight, fontStyle
 * - 排版属性：textAlign, lineHeight, letterSpacing
 * - 颜色属性：fill, backgroundColor
 * - 效果属性：opacity, textShadow
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 内容属性
  // ========================================
  
  /** 文本内容 */
  text: z.string().default('请输入文本').describe('props.textContent'),

  // ========================================
  // 字体属性
  // ========================================
  
  /** 字号（像素） */
  fontSize: z.number().min(8).max(200).default(16).describe('字号'),
  
  /** 字体 */
  fontFamily: z.enum([
    'sans-serif',
    'serif',
    'monospace',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Microsoft YaHei',
    'PingFang SC',
    'SimHei',
    'SimSun',
  ]).default('sans-serif').describe('字体'),
  
  /** 字重 */
  fontWeight: z.enum(['normal', 'bold', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal').describe('字重'),
  
  /** 字体样式（斜体） */
  fontStyle: z.enum(['normal', 'italic', 'oblique']).default('normal').describe('斜体'),

  // ========================================
  // 排版属性
  // ========================================
  
  /** 文本对齐 */
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left').describe('对齐方式'),
  
  /** 垂直对齐 */
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top').describe('props.alignVertical'),
  
  /** 行高 */
  lineHeight: z.number().min(0.5).max(5).default(1.4).describe('行高'),
  
  /** 字间距 */
  letterSpacing: z.number().min(-10).max(50).default(0).describe('字间距'),
  
  /** 文本装饰 */
  textDecoration: z.enum(['none', 'underline', 'line-through']).default('none').describe('装饰线'),

  // ========================================
  // 颜色属性
  // ========================================
  
  /** 文字颜色 */
  fill: z.string().default('#333333').describe('文字颜色'),
  
  /** 背景颜色 */
  backgroundColor: z.string().default('transparent').describe('背景颜色'),

  // ========================================
  // 效果属性
  // ========================================
  
  /** 不透明度 */
  opacity: z.number().min(0).max(1).default(1).describe('props.opacity'),
  
  /** 文字阴影 */
  textShadowEnabled: z.boolean().default(false).describe('启用阴影'),
  
  /** 阴影颜色 */
  textShadowColor: z.string().default('rgba(0,0,0,0.3)').describe('阴影颜色'),
  
  /** 阴影模糊 */
  textShadowBlur: z.number().min(0).max(50).default(4).describe('阴影模糊'),
  
  /** 阴影 X 偏移 */
  textShadowOffsetX: z.number().min(-50).max(50).default(1).describe('阴影X偏移'),
  
  /** 阴影 Y 偏移 */
  textShadowOffsetY: z.number().min(-50).max(50).default(1).describe('阴影Y偏移'),

  // ========================================
  // 其他属性
  // ========================================
  
  /** 内边距 */
  padding: z.number().min(0).max(100).default(0).describe('内边距'),
});

/** 属性类型（用于 TypeScript 类型推导） */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
