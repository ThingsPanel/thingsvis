/**
 * ECharts 折线图属性 Schema (极致精简版)
 */

import { z } from 'zod';
import { ChartAxisFontMixin } from '@thingsvis/widget-sdk';

const DEFAULT_SAMPLE_DATA = [
  { name: '示例1', value: 1048 },
  { name: '示例2', value: 735 },
  { name: '示例3', value: 580 },
  { name: '示例4', value: 984 },
  { name: '示例5', value: 700 },
] as const;

export const PropsSchema = z.object({
  /** 主色调 */
  primaryColor: z.string().default('').describe('props.primaryColor'),

  /** 轴文字颜色 */
  axisLabelColor: z.string().default('').describe('props.axisLabelColor'),

  /** 是否显示图例 */
  showLegend: z.boolean().default(true).describe('props.showLegend'),

  /** 显示X轴刻度 */
  showXAxis: z.boolean().default(true).describe('props.showXAxis'),

  /** 显示Y轴刻度 */
  showYAxis: z.boolean().default(true).describe('props.showYAxis'),

  /** 系列名称（图例与悬浮提示中的「数值」文案；留空则用内置默认） */
  seriesName: z.string().default('').describe('props.seriesName'),

  /** 是否平滑曲线 */
  smooth: z.boolean().default(false).describe('props.smoothCurve'),

  /** 是否显示面积阴影 */
  showArea: z.boolean().default(false).describe('props.showArea'),

  /** 时间范围 */
  timeRangePreset: z.enum(['all', '1h', '6h', '24h', '7d', '30d']).default('all').describe('props.timeRangePreset'),

  /** 数据集 */
  data: z.array(z.any()).default(() => DEFAULT_SAMPLE_DATA.map((point) => ({ ...point }))).describe('props.dataset'),
}).extend(ChartAxisFontMixin);

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
