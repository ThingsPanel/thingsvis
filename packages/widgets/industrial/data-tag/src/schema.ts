/**
 * Data Tag 组件 Props Schema
 * 
 * 数据标签：[标签名] [数值] [单位]
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 数据内容
  // ========================================
  
  /** 标签名称 */
  label: z.string().default('标签').describe('props.label'),
  
  /** 数值 (支持数据绑定) */
  value: z.union([z.string(), z.number()]).default('--').describe('props.value'),
  
  /** 单位 */
  unit: z.string().default('').describe('props.unit'),
  
  // ========================================
  // 颜色配置
  // ========================================
  
  /** 标签颜色 */
  labelColor: z.string().default('').describe('props.labelColor'),
  
  /** 数值颜色 (默认红色高亮) */
  valueColor: z.string().default('#ff4d4f').describe('props.valueColor'),
  
  /** 单位颜色 */
  unitColor: z.string().default('').describe('props.unitColor'),
  
  // ========================================
  // 字体大小
  // ========================================
  
  /** 基础字号 (px) */
  fontSize: z.number().min(8).max(72).default(14).describe('props.fontSize'),
  
  /** 数值字号比例 (相对于基础字号的倍数) */
  valueScale: z.number().min(0.5).max(3).default(1.2).describe('props.valueScale'),
  
  /** 单位字号比例 */
  unitScale: z.number().min(0.5).max(2).default(0.85).describe('props.unitScale'),
  
  /** 数值是否加粗 */
  valueBold: z.boolean().default(true).describe('props.valueBold'),
  
  // ========================================
  // 布局
  // ========================================
  
  /** 布局模式 */
  layout: z.enum(['row', 'compact']).default('row').describe('props.layout'),
  
  /** 元素间距 (px) */
  gap: z.number().min(0).max(20).default(6).describe('props.gap'),
  
  // ========================================
  // 背景与边框
  // ========================================
  
  /** 背景色 */
  backgroundColor: z.string().default('rgba(0,0,0,0.3)').describe('props.backgroundColor'),
  
  /** 边框色 */
  borderColor: z.string().default('').describe('props.borderColor'),
  
  /** 圆角 (px) */
  borderRadius: z.number().min(0).max(20).default(4).describe('props.borderRadius'),
  
  /** 内边距 (px) */
  padding: z.number().min(0).max(20).default(6).describe('props.padding'),
  
  // ========================================
  // 对齐
  // ========================================
  
  /** 水平对齐 */
  align: z.enum(['left', 'center', 'right']).default('center').describe('props.align'),
});

/** Props 类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取默认 Props */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
