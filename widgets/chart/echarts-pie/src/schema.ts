/**
 * ECharts 饼图属性 Schema
 *
 * 使用 Zod 定义所有可配置属性
 */

import { z } from 'zod';

/** 饼图数据点 Schema */
const PieDataPointSchema = z.object({
    name: z.string(),
    value: z.number(),
});

export const PropsSchema = z.object({
    // ========================================
    // 数据属性
    // ========================================

    /** 图表标题 */
    title: z.string().default('饼图').describe('图表标题'),

    /** 数据系列 */
    data: z.array(PieDataPointSchema).default([
        { name: '直接访问', value: 335 },
        { name: '邮件营销', value: 310 },
        { name: '联盟广告', value: 234 },
        { name: '视频广告', value: 135 },
        { name: '搜索引擎', value: 548 },
    ]).describe('数据系列'),

    // ========================================
    // 样式属性
    // ========================================

    /** 饼图半径（外半径百分比） */
    radius: z.string().default('55%').describe('饼图半径'),

    /** 内半径（设置后变为环形图） */
    innerRadius: z.string().default('0%').describe('内半径（环形图）'),

    /** 是否显示图例 */
    showLegend: z.boolean().default(true).describe('显示图例'),

    /** 是否显示数据标签 */
    showLabel: z.boolean().default(true).describe('显示数据标签'),

    /** 标签内容格式 */
    labelType: z.enum(['name', 'value', 'percent', 'name-percent']).default('name-percent').describe('标签内容'),

    /** 是否为南丁格尔玫瑰图 */
    roseType: z.boolean().default(false).describe('玫瑰图'),

    /** 背景色 */
    backgroundColor: z.string().default('#ffffff').describe('背景色'),
});

/** 饼图数据点类型 */
export type PieDataPoint = z.infer<typeof PieDataPointSchema>;

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
