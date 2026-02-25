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
function buildOption(props: Props, isDark: boolean, scale: number = 1): echarts.EChartsOption {
    const { title, data, primaryColor, max } = props;

    const textColor = isDark ? '#ddd' : '#333';
    const splitLineColor = isDark ? '#ffffff20' : '#00000010';
    const axisLineColor = isDark ? '#333' : '#E6EBF8';

    return {
        backgroundColor: 'transparent',
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: Math.round(14 * scale), color: textColor },
            top: Math.round(10 * scale),
        } : undefined,
        tooltip: {
            formatter: '{a} <br/>{b} : {c}'
        },
        series: [
            {
                name: title || '数值',
                type: 'gauge',
                max: max,
                progress: {
                    show: true,
                    itemStyle: { color: primaryColor }
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    color: textColor,
                    fontSize: Math.round(28 * scale)
                },
                pointer: {
                    itemStyle: { color: primaryColor }
                },
                data: Array.isArray(data) && data.length > 0 ? [{ value: data[0]?.value || 0, name: data[0]?.name || title }] : [{ value: 50, name: 'SCORE' }]
            }
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
    chart.setOption(buildOption(currentProps, isDark, 1));

    const scheduleResize = () => {
        try {
            requestAnimationFrame(() => {
                if (!chart.isDisposed()) {
                    chart.resize();
                    const cw = element.clientWidth || 300;
                    const ch = element.clientHeight || 200;
                    const minDim = Math.min(cw, ch);
                    const scale = Math.max(0.6, Math.min(1.5, minDim / 300));
                    chart.setOption(buildOption(currentProps, isDark, scale), { replaceMerge: ['dataset', 'series'] });
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
