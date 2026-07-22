import { z } from 'zod';
import { ChartAxisFontMixin } from '@thingsvis/widget-sdk';

export const PropsSchema = z
  .object({
    /** 主色调 */
    primaryColor: z.string().default('').describe('props.primaryColor'),

    /** 坐标文字颜色 */
    axisLabelColor: z.string().default('').describe('props.axisLabelColor'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('props.showLegend'),

    /** 是否显示 X 轴 */
    showXAxis: z.boolean().default(true).describe('props.showXAxis'),

    /** 是否显示 Y 轴 */
    showYAxis: z.boolean().default(true).describe('props.showYAxis'),

    /** Y 轴最小值（空=自动）；标签与说明见 controls overrides */
    yAxisMin: z.number().nullable().default(null),

    /** Y 轴最大值（空=自动）；标签与说明见 controls overrides */
    yAxisMax: z.number().nullable().default(null),

    /** 线条宽度 */
    lineWidth: z.number().min(1).max(10).default(1.5).describe('props.lineWidth'),

    /** 是否显示面积填充 */
    showArea: z.boolean().default(false).describe('props.showArea'),

    /** 面积填充透明度 */
    areaFillAlpha: z.number().min(0).max(1).default(0.18).describe('props.areaFillAlpha'),

    /** 是否平滑曲线 */
    smooth: z.boolean().default(false).describe('props.smoothCurve'),

    /** 时间范围 */
    timeRangePreset: z
      .enum(['all', '1h', '6h', '24h', '7d', '30d'])
      .default('all')
      .describe('props.timeRangePreset'),

    /** 数据集 - uPlot requires precise format, but we accept ECharts style and convert it */
    data: z.array(z.any()).default([]).describe('props.dataset'),
  })
  .extend(ChartAxisFontMixin);

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
