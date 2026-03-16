/**
 * ECharts 折线图属性 Schema (极致精简版)
 */

import { z } from 'zod';

const DEFAULT_SAMPLE_DATA = [
  { time: '2026-03-16T08:00:00.000Z', value: 18 },
  { time: '2026-03-16T09:00:00.000Z', value: 24 },
  { time: '2026-03-16T10:00:00.000Z', value: 21 },
  { time: '2026-03-16T11:00:00.000Z', value: 29 },
  { time: '2026-03-16T12:00:00.000Z', value: 34 },
  { time: '2026-03-16T13:00:00.000Z', value: 31 },
] as const;

export const PropsSchema = z.object({
  /** 图表标题 */
  title: z.string().default('').describe('props.chartTitle'),

  /** 标题对齐 */
  titleAlign: z.enum(['left', 'center', 'right']).default('left').describe('props.titleAlign'),

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

  /** 时间范围 */
  timeRangePreset: z.enum(['all', '1h', '6h', '24h', '7d', '30d']).default('all').describe('props.timeRangePreset'),

  /** 数据集 */
  data: z.array(z.any()).default(() => DEFAULT_SAMPLE_DATA.map((point) => ({ ...point }))).describe('props.dataset'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
