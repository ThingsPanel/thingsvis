/**
 * ECharts 仪表盘属性 Schema (极致精简版)
 */

import { z } from 'zod';
import { ChartGaugeFontMixin } from '@thingsvis/widget-sdk';

export const PropsSchema = z.object({
    /** 主色调 */
    primaryColor: z.string().default('').describe('props.primaryColor'),

    /** 刻度颜色 */
    axisLabelColor: z.string().default('').describe('props.axisLabelColor'),

    /** 数值颜色 */
    detailColor: z.string().default('').describe('props.detailColor'),

    /** 刻度最大值 */
    max: z.number().default(100).describe('props.max'),
    min: z.number().default(0).describe('props.min'),
    unit: z.string().default('').describe('props.unit'),
    // null preserves the legacy ECharts value formatting.
    precision: z.number().int().min(0).max(6).nullable().default(null).describe('props.precision'),
    startAngle: z.number().min(-360).max(360).default(210).describe('props.startAngle'),
    endAngle: z.number().min(-360).max(360).default(-30).describe('props.endAngle'),
    splitNumber: z.number().int().min(1).max(100).default(10).describe('props.splitNumber'),
    showProgress: z.boolean().default(true).describe('props.showProgress'),
    showPointer: z.boolean().default(true).describe('props.showPointer'),
    showAxisTicks: z.boolean().default(true).describe('props.showAxisTicks'),
    showSplitLines: z.boolean().default(true).describe('props.showSplitLines'),
    showAxisLabels: z.boolean().default(true).describe('props.showAxisLabels'),
    colorMode: z.enum(['single', 'three', 'aqi']).default('single').describe('props.colorMode'),
    aqiInputType: z.enum(['aqi', 'pm25']).default('aqi').describe('props.aqiInputType'),
    lowMax: z.number().default(50).describe('props.lowMax'),
    mediumMax: z.number().default(80).describe('props.mediumMax'),
    lowColor: z.string().default('#22c55e').describe('props.lowColor'),
    mediumColor: z.string().default('#f59e0b').describe('props.mediumColor'),
    highColor: z.string().default('#ef4444').describe('props.highColor'),

    /** 数据集 */
    data: z.any().default(null).describe('props.dataset'),
}).extend(ChartGaugeFontMixin);

/** 属性类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取所有属性的默认值 */
export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
