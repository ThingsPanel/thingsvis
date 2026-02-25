/**
 * ECharts 仪表盘主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(props: Props, isDark: boolean): echarts.EChartsOption {
    const { title, data, primaryColor, max } = props;

    const textColor = isDark ? '#ddd' : '#333';
    const splitLineColor = isDark ? '#ffffff20' : '#00000010';
    const axisLineColor = isDark ? '#333' : '#E6EBF8';

    return {
        backgroundColor: 'transparent',
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, color: textColor },
            top: 10,
        } : undefined,
        tooltip: {
            formatter: '{b} : {c}'
        },
        dataset: Array.isArray(data) && data.length > 0 ? {
            source: data
        } : undefined,
        series: [
            {
                type: 'gauge',
                max: max,
                center: ['50%', '55%'],
                radius: '80%',
                startAngle: 210,
                endAngle: -30,
                splitNumber: 5,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: primaryColor + '40' },
                        { offset: 1, color: primaryColor }
                    ]),
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowBlur: 10,
                },
                progress: {
                    show: true,
                    width: 14,
                    roundCap: true
                },
                axisLine: {
                    roundCap: true,
                    lineStyle: {
                        width: 14,
                        color: [[1, axisLineColor]]
                    }
                },
                pointer: {
                    show: true,
                    length: '60%',
                    width: 6,
                    itemStyle: { color: primaryColor }
                },
                axisTick: {
                    show: true,
                    distance: -20,
                    length: 8,
                    lineStyle: { color: splitLineColor, width: 2 }
                },
                splitLine: {
                    show: true,
                    distance: -20,
                    length: 14,
                    lineStyle: { color: splitLineColor, width: 3 }
                },
                axisLabel: {
                    show: true,
                    distance: 25,
                    color: textColor,
                    fontSize: 12
                },
                title: {
                    show: true,
                    offsetCenter: [0, '30%'],
                    fontSize: 14,
                    color: textColor
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    fontSize: 36,
                    fontWeight: 700,
                    color: textColor,
                    offsetCenter: [0, '65%']
                }
            },
        ],
    };
}

/**
 * 创建 ECharts Overlay 实例
 */
function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
    const element = document.createElement('div');
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.pointerEvents = 'auto';

    const defaults = getDefaultProps();
    let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
    let isDark = ctx.theme?.isDark ?? false;

    const chart = echarts.init(element);
    chart.setOption(buildOption(currentProps, isDark));

    const scheduleResize = () => {
        try {
            requestAnimationFrame(() => {
                if (!chart.isDisposed()) chart.resize();
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
        element,
        update: (newCtx: WidgetOverlayContext) => {
            currentProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
            isDark = newCtx.theme?.isDark ?? false;

            chart.setOption(buildOption(currentProps, isDark), { replaceMerge: ['dataset', 'series'] });

            if (newCtx.size) {
                scheduleResize();
            }
        },
        destroy: () => {
            ro?.disconnect();
            chart.dispose();
        },
    };
}

/**
 * 插件主模块
 */
export const Main: WidgetMainModule = {
    ...metadata,
    schema: PropsSchema,
    controls,
    createOverlay,
};

export default Main;
