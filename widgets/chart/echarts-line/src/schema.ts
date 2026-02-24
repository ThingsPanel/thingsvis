/**
 * ECharts 折线图属性 Schema
 * 
 * ⭐ 这是开发者需要重点关注的文件
 * 
 * 📝 开发指南：
 * - 使用 Zod 定义组件的所有可配置属性
 * - 图表组件通常需要 data 属性用于数据绑定
 * - 样式属性控制图表外观
 */

import { z } from 'zod';

/** 数据点 Schema */
const DataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const PropsSchema = z.object({
  // ========================================
  // 数据属性（需要数据绑定）
  // ========================================
  
  /** 图表标题 */
  title: z.string().default('折线图').describe('图表标题'),
  
  /** 数据系列 */
  data: z.array(DataPointSchema).default([
    { name: '周一', value: 150 },
    { name: '周二', value: 230 },
    { name: '周三', value: 224 },
    { name: '周四', value: 218 },
    { name: '周五', value: 135 },
    { name: '周六', value: 147 },
    { name: '周日', value: 260 },
  ]).describe('数据系列'),

  // ========================================
  // 样式属性
  // ========================================
  
  /** 线条颜色 */
  lineColor: z.string().default('#5470c6').describe('线条颜色'),
  
  /** 是否显示区域填充 */
  showArea: z.boolean().default(false).describe('区域填充'),
  
  /** 是否平滑曲线 */
  smooth: z.boolean().default(true).describe('平滑曲线'),
  
  /** 是否显示数据点 */
  showSymbol: z.boolean().default(true).describe('显示数据点'),
  
  /** 是否显示图例 */
  showLegend: z.boolean().default(false).describe('显示图例'),
  
  /** 背景色 */
  backgroundColor: z.string().default('#ffffff').describe('背景色'),
});

/** 数据点类型 */
export type DataPoint = z.infer<typeof DataPointSchema>;

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
