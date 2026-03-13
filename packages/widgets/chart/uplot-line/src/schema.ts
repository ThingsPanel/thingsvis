import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('props.chartTitle'),

    /** 标题对齐 */
    titleAlign: z.enum(['left', 'center', 'right']).default('left').describe('props.titleAlign'),

    /** 主色调 */
    primaryColor: z.string().default('#6965db').describe('props.primaryColor'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('props.showLegend'),

    /** 时间范围 */
    timeRangePreset: z.enum(['all', '1h', '6h', '24h', '7d', '30d']).default('all').describe('props.timeRangePreset'),

    /** 数据集 - uPlot requires precise format, but we accept ECharts style and convert it */
    data: z.array(z.any()).default([]).describe('props.dataset'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
