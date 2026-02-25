/**
 * ECharts 柱状图属性 Schema
 *
 * 使用 Zod 定义所有可配置属性
 */

import { z } from 'zod';

/** 数据点 Schema */
const DataPointSchema = z.object({
    name: z.string(),
    value: z.number(),
});

export const PropsSchema = z.object({
    // ========================================
    // 数据属性
    // ========================================

    /** 图表标题 */
    title: z.string().default('柱状图').describe('图表标题'),

    /** 数据系列 */
    data: z.array(DataPointSchema).default([
        { name: '周一', value: 120 },
        { name: '周二', value: 200 },
        { name: '周三', value: 150 },
        { name: '周四', value: 80 },
        { name: '周五', value: 70 },
        { name: '周六', value: 110 },
        { name: '周日', value: 130 },
    ]).describe('数据系列'),

    // ========================================
    // 样式属性
    // ========================================

    /** 柱子颜色 */
    barColor: z.string().default('#5470c6').describe('柱子颜色'),

    /** 柱子宽度（百分比或数值） */
    barWidth: z.string().default('40%').describe('柱子宽度'),

    /** 是否显示数据标签 */
    showLabel: z.boolean().default(false).describe('显示数据标签'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(false).describe('显示图例'),

    /** 是否圆角柱子 */
    barBorderRadius: z.number().default(0).describe('柱子圆角'),

    /** 背景色 */
    backgroundColor: z.string().default('#ffffff').describe('背景色'),
});

/** 数据点类型 */
export type DataPoint = z.infer<typeof DataPointSchema>;

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
