/**
 * ECharts 柱状图属性 Schema (极致精简版)
 */

import { z } from 'zod';

const DEFAULT_SAMPLE_DATA = [
    { name: 'Mon', value: 18 },
    { name: 'Tue', value: 24 },
    { name: 'Wed', value: 31 },
    { name: 'Thu', value: 27 },
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

    /** 
     * 数据集 
     * 抛弃显式定义维度，交由 ECharts Dataset 自动推导
     */
    data: z.array(z.any()).default(() => DEFAULT_SAMPLE_DATA.map((item) => ({ ...item }))).describe('props.dataset'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
