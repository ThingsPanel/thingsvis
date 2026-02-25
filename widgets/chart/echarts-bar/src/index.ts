/**
 * ECharts 柱状图主入口 (极致精简版 + 数据驱动)
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
    const { title, data, primaryColor, showLegend } = props;

    // 根据亮暗色主题自动适配文本颜色和坐标轴辅助线颜色
    const textColor = isDark ? '#ddd' : '#333';
    const splitLineColor = isDark ? '#ffffff20' : '#00000010';

    // 智能构建渐变色
    const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: primaryColor },
        { offset: 1, color: primaryColor + '40' } // 加点透明度
    ]);

    return {
        // 背景完全交给上层容器或 theme
        backgroundColor: 'transparent',
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, color: textColor },
        } : undefined,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
        },
        legend: {
            show: showLegend,
            bottom: 0,
            textStyle: { color: textColor },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: showLegend ? 40 : 10,
            top: title ? 40 : 20,
            containLabel: true,
        },
        // 拥抱 Dataset 规范，无需显式指明 xAxis 和 series 内部 data
        dataset: Array.isArray(data) && data.length > 0 ? {
            dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: title || '数值' }],
            source: data
        } : undefined,
        xAxis: {
            type: 'category',
            axisLabel: { color: textColor },
            axisLine: { lineStyle: { color: splitLineColor } },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: splitLineColor } },
            axisLabel: { color: textColor },
        },
        series: [
            {
                type: 'bar',
                // 确保 ECharts 正确提取 dataset 中的 name (X轴) 和 value (Y轴) 并且作为图例/Tooltip显示
                encode: { x: 'name', y: 'value', tooltip: ['value'] },
                itemStyle: {
                    color: gradientColor,
                    borderRadius: [4, 4, 0, 0], // 给点微小圆角更精致
                },
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

    // 合并默认值和传入的 props
    const defaults = getDefaultProps();
    let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
    let isDark = ctx.theme?.isDark ?? false;

    // 初始化 ECharts
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

            // 使用 notMerge: false, lazyUpdate: false
            chart.setOption(buildOption(currentProps, isDark), { replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis'] });

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
