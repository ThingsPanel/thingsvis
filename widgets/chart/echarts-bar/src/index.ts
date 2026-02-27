/**
 * ECharts 柱状图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetOverlayContext } from '@thingsvis/widget-sdk';

/**
 * Build ECharts option from props and theme colors
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
    const { title, data, primaryColor, showLegend, showXAxis, showYAxis } = props;

    const textColor = colors?.fg ?? '#333';
    const splitLineColor = colors?.axis ?? '#00000010';

    const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: primaryColor },
        { offset: 1, color: primaryColor + '40' }
    ]);

    return {
        backgroundColor: 'transparent',
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: Math.round(14 * scale), color: textColor },
            top: Math.round(10 * scale),
        } : undefined,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
        },
        legend: {
            show: showLegend,
            bottom: 0,
            textStyle: { color: textColor, fontSize: Math.round(12 * scale) },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: showLegend ? Math.round(35 * scale) : Math.round(10 * scale),
            top: title ? Math.round(35 * scale) : Math.round(15 * scale),
            containLabel: true,
        },
        dataset: Array.isArray(data) && data.length > 0 ? {
            dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: title || 'props.value' }],
            source: data
        } : undefined,
        xAxis: {
            show: showXAxis !== false,
            type: 'category',
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            axisLine: { lineStyle: { color: splitLineColor } },
            axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
        },
        yAxis: {
            show: showYAxis !== false,
            type: 'value',
            splitLine: { lineStyle: { color: splitLineColor } },
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            axisLine: { show: true, lineStyle: { color: splitLineColor } },
            axisTick: { show: true, lineStyle: { color: splitLineColor } },
        },
        series: [
            {
                type: 'bar',
                encode: { x: 'name', y: 'value', tooltip: ['value'] },
                itemStyle: {
                    color: gradientColor,
                    borderRadius: [4, 4, 0, 0],
                },
            },
        ],
    };
}

import { defineWidget, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    locales: metadata.locales,
    schema: PropsSchema,
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let colors: WidgetColors = resolveWidgetColors(element);

        // Initialize ECharts
        const chart = echarts.init(element);
        chart.setOption(buildOption(currentProps, colors, 1));

        const scheduleResize = () => {
            try {
                requestAnimationFrame(() => {
                    if (!chart.isDisposed()) {
                        chart.resize();
                        const cw = element.clientWidth || 300;
                        const ch = element.clientHeight || 200;
                        const minDim = Math.min(cw, ch);
                        const scale = Math.max(0.6, Math.min(1.5, minDim / 300));
                        chart.setOption(buildOption(currentProps, colors, scale), { replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis'] });
                    }
                });
            } catch {
                if (!chart.isDisposed()) chart.resize();
            }
        };

        scheduleResize();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => scheduleResize());
            ro.observe(element);
        }

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                colors = resolveWidgetColors(element);

                // scheduleResize handles setOption with scale logic
                if (newCtx.size || !newCtx.size) {
                    scheduleResize();
                }
            },
            destroy: () => {
                ro?.disconnect();
                chart.dispose();
            },
        };
    }
});

export default Main;
