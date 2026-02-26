import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('图表标题'),

    /** 主色调 */
    primaryColor: z.string().default('#6965db').describe('主色调'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('显示图例'),

    /** 数据集 - uPlot requires precise format, but we accept ECharts style and convert it */
    data: z.array(z.any()).default([
        { time: Date.now() - 3600000, value: 10 },
        { time: Date.now() - 1800000, value: 20 },
        { time: Date.now(), value: 15 }
    ]).describe('数据集'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
