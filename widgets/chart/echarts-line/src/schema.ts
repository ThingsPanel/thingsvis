/**
 * ECharts 折线图属性 Schema (极致精简版)
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  /** 图表标题 */
  title: z.string().default('').describe('props.chartTitle'),

  /** 主色调 */
  primaryColor: z.string().default('#6965db').describe('props.primaryColor'),

  /** 是否显示图例 */
  showLegend: z.boolean().default(true).describe('props.showLegend'),

  /** 显示X轴刻度 */
  showXAxis: z.boolean().default(true).describe('props.showXAxis'),

  /** 显示Y轴刻度 */
  showYAxis: z.boolean().default(true).describe('props.showYAxis'),

  /** 是否平滑曲线 */
  smooth: z.boolean().default(true).describe('props.smoothCurve'),

  /** 是否显示面积阴影 */
  showArea: z.boolean().default(true).describe('props.showArea'),

  /** 数据集 */
  data: z.array(z.any()).default([
    { name: '周一', value: 150 },
    { name: '周二', value: 230 },
    { name: '周三', value: 224 },
    { name: '周四', value: 218 },
    { name: '周五', value: 135 },
    { name: '周六', value: 147 },
    { name: '周日', value: 260 },
  ]).describe('props.dataset'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
