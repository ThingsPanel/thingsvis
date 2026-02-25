/**
 * ECharts 仪表盘属性 Schema (极致精简版)
 */

import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('图表标题'),

    /** 主色调 */
    primaryColor: z.string().default('#5470c6').describe('主色调'),

    /** 刻度最大值 */
    max: z.number().default(100).describe('最大值'),

    /** 数据集 */
    data: z.array(z.any()).default([
        { name: '综合评分', value: 85 }
    ]).describe('数据集'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
