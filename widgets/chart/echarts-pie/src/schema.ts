/**
 * ECharts 饼图属性 Schema (极致精简版)
 */

import { z } from 'zod';

export const PropsSchema = z.object({
    /** 图表标题 */
    title: z.string().default('').describe('props.chartTitle'),

    /** 主色调 (供扩展用或单色场景，但饼图默认使用ECharts自带的色板最佳) */
    primaryColor: z.string().default('#6965db').describe('props.primaryColor'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('props.showLegend'),

    /** 是否为环形图 */
    isDoughnut: z.boolean().default(false).describe('是否为环形图'),

    /** 数据集 */
    data: z.array(z.any()).default([
        { name: '直接访问', value: 335 },
        { name: '邮件营销', value: 310 },
        { name: '联盟广告', value: 234 },
    ]).describe('props.dataset'),
});

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
