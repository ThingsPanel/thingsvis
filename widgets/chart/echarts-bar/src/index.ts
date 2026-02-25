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
function buildOption(props: Props, isDark: boolean, scale: number = 1): echarts.EChartsOption {
    const { title, data, primaryColor, showLegend, showXAxis, showYAxis } = props;

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
        // 拥抱 Dataset 规范，无需显式指明 xAxis 和 series 内部 data
        dataset: Array.isArray(data) && data.length > 0 ? {
            dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: title || '数值' }],
            source: data
        } : undefined,
        xAxis: {
            show: showXAxis !== false,
            type: 'category',
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            axisLine: { lineStyle: { color: splitLineColor } },
            // 补充刻度展示属性
            axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
        },
        yAxis: {
            show: showYAxis !== false,
            type: 'value',
            splitLine: { lineStyle: { color: splitLineColor } },
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            // 补充刻度展示属性
            axisLine: { show: true, lineStyle: { color: splitLineColor } },
            axisTick: { show: true, lineStyle: { color: splitLineColor } },
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
                    chart.setOption(buildOption(currentProps, isDark, scale), { replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis'] });
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

            // scheduleResize 将处理 setOption（包含 scale 逻辑）
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
