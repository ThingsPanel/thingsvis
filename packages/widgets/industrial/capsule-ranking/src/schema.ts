/**
 * Capsule Ranking 组件 Props Schema
 * 
 * 胶囊状水平进度排行榜
 */

import { z } from 'zod';

// 数据项 Schema
const DataItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
});

export const PropsSchema = z.object({
  // ========================================
  // 数据
  // ========================================
  
  /** 排行榜数据 */
  data: z.array(DataItemSchema).default([
    { name: '项目1', value: 100, unit: '' },
    { name: '项目2', value: 80, unit: '' },
    { name: '项目3', value: 60, unit: '' },
  ]).describe('props.data'),
  
  /** 标题 */
  title: z.string().default('排行榜').describe('props.title'),
  
  // ========================================
  // 排序
  // ========================================
  
  /** 排序方式 */
  sortBy: z.enum(['value', 'name', 'none']).default('value').describe('props.sortBy'),
  
  /** 排序顺序 */
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('props.sortOrder'),
  
  /** 最大值（用于计算比例，0 表示自动） */
  maxValue: z.number().min(0).default(0).describe('props.maxValue'),
  
  // ========================================
  // 胶囊样式
  // ========================================
  
  /** 胶囊高度 (px) */
  capsuleHeight: z.number().min(4).max(40).default(12).describe('props.capsuleHeight'),
  
  /** 胶囊圆角 */
  capsuleRadius: z.number().min(0).max(20).default(6).describe('props.capsuleRadius'),
  
  /** 胶囊颜色数组（循环使用） */
  capsuleColors: z.array(z.string()).default([
    '#0ea5e9', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'
  ]).describe('props.capsuleColors'),
  
  /** 是否启用渐变 */
  gradientEnabled: z.boolean().default(true).describe('props.gradientEnabled'),
  
  // ========================================
  // 标签与数值
  // ========================================
  
  /** 显示排名序号 */
  showRank: z.boolean().default(true).describe('props.showRank'),
  
  /** 显示名称 */
  showName: z.boolean().default(true).describe('props.showName'),
  
  /** 显示数值 */
  showValue: z.boolean().default(true).describe('props.showValue'),
  
  /** 显示单位 */
  showUnit: z.boolean().default(true).describe('props.showUnit'),
  
  /** 标签宽度 (px) */
  labelWidth: z.number().min(40).max(200).default(80).describe('props.labelWidth'),
  
  // ========================================
  // 特殊排名样式
  // ========================================
  
  /** 前三名颜色 */
  top1Color: z.string().default('#ff4d4f').describe('props.top1Color'),
  top2Color: z.string().default('#faad14').describe('props.top2Color'),
  top3Color: z.string().default('#52c41a').describe('props.top3Color'),
  
  /** 其他排名颜色 */
  otherRankColor: z.string().default('').describe('props.otherRankColor'),
  
  // ========================================
  // 布局
  // ========================================
  
  /** 行高 (px) */
  rowHeight: z.number().min(20).max(80).default(36).describe('props.rowHeight'),
  
  /** 行间距 (px) */
  rowGap: z.number().min(0).max(20).default(8).describe('props.rowGap'),
  
  /** 字体大小 */
  fontSize: z.number().min(10).max(24).default(13).describe('props.fontSize'),
  
  // ========================================
  // 动画
  // ========================================
  
  /** 启用加载动画 */
  animated: z.boolean().default(true).describe('props.animated'),
  
  /** 动画持续时间 (秒) */
  animationDuration: z.number().min(0.3).max(3).default(0.8).describe('props.animationDuration'),
  
  // ========================================
  // 样式
  // ========================================
  
  /** 轨道背景色 */
  trackColor: z.string().default('rgba(255,255,255,0.1)').describe('props.trackColor'),
  
  /** 文字颜色 */
  textColor: z.string().default('').describe('props.textColor'),
  
  /** 数值颜色 */
  valueColor: z.string().default('').describe('props.valueColor'),
});

/** Props 类型 */
export type Props = z.infer<typeof PropsSchema>;
export type DataItem = z.infer<typeof DataItemSchema>;

/** 获取默认 Props */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
