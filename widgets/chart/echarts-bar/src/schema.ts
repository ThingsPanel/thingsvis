/**
 * ECharts 柱状图属性 Schema (极致精简版)
 */

import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('图表标题'),

    /** 主色调 */
    primaryColor: z.string().default('#5470c6').describe('主色调'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('显示图例'),

    /** 
     * 数据集 
     * 抛弃显式定义维度，交由 ECharts Dataset 自动推导
     */
    data: z.array(z.any()).default([
        { name: 'A', value: 120 },
        { name: 'B', value: 200 },
        { name: 'C', value: 150 },
    ]).describe('数据集（勿配静态JSON）'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
