/**
 * ECharts 仪表盘属性 Schema (极致精简版)
 */

import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('props.chartTitle'),

    /** 主色调 */
    primaryColor: z.string().default('#6965db').describe('props.primaryColor'),

    /** 刻度最大值 */
    max: z.number().default(100).describe('props.max'),

    /** 数据集 */
    data: z.array(z.any()).default([
        { name: '评分', value: 85 }
    ]).describe('props.dataset'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
