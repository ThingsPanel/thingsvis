/**
 * ECharts 饼图主入口 (极致精简版 + 数据驱动)
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
    const { title, data, showLegend, isDoughnut } = props;

    const textColor = isDark ? '#ddd' : '#333';

    return {
        backgroundColor: 'transparent',
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: Math.round(14 * scale), color: textColor },
            top: Math.round(10 * scale),
        } : undefined,
        tooltip: {
            trigger: 'item',
        },
        legend: {
            show: showLegend,
            bottom: 10,
            left: 'center',
            textStyle: { color: textColor, fontSize: Math.round(12 * scale) },
        },
        dataset: Array.isArray(data) && data.length > 0 ? {
            source: data
        } : undefined,
        series: [
            {
                type: 'pie',
                radius: isDoughnut ? ['30%', '48%'] : '48%',
                center: ['50%', '45%'],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: isDark ? '#141414' : '#fff',
                    borderWidth: 2
                },
                encode: { value: 'value', itemName: 'name' }, // 明确指定 dataset 的字段映射
                labelLine: {
                    length: Math.round(10 * scale),
                    length2: Math.round(15 * scale),
                    smooth: true,
                },
                avoidLabelOverlap: true,
                minAngle: 10,
                label: {
                    color: textColor,
                    show: true,
                    fontSize: Math.max(10, Math.round(12 * scale)),
                    position: 'outer',
                    distanceToLabelLine: 5,
                    // 不进行人为的截断，交给充裕的边距展示完整标签
                    formatter: '{b}: {d}%'
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
    let isDark = ctx.theme?.isDark ?? false;    // 初始化 ECharts
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
