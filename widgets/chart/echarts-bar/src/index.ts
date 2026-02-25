/**
 * ECharts 柱状图主入口 (Overlay 模板)
 *
 * 基于 echarts-line 参考实现，
 * 使用 bar series 替代 line series。
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props, type DataPoint } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 根据 Props 生成 ECharts Option
 */
function buildOption(props: Props): echarts.EChartsOption {
    const { title, data, barColor, showLegend, showLabel, barWidth, barBorderRadius } = props;

    return {
        title: {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14 },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
        },
        legend: {
            show: showLegend,
            bottom: 0,
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: showLegend ? '15%' : '3%',
            top: title ? '15%' : '3%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: data.map((d: DataPoint) => d.name),
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                type: 'bar',
                data: data.map((d: DataPoint) => d.value),
                barWidth,
                itemStyle: {
                    color: barColor,
                    borderRadius: [barBorderRadius, barBorderRadius, 0, 0],
                },
                label: {
                    show: showLabel,
                    position: 'top',
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

    // 应用背景色
    element.style.backgroundColor = currentProps.backgroundColor;

    // 初始化 ECharts
    const chart = echarts.init(element);
    chart.setOption(buildOption(currentProps));

    const scheduleResize = () => {
        try {
            requestAnimationFrame(() => {
                if (!chart.isDisposed()) chart.resize();
            });
        } catch {
            if (!chart.isDisposed()) chart.resize();
        }
    };

    // 首次挂载后触发一次 resize
    scheduleResize();

    // 监听容器尺寸变化
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => scheduleResize());
        ro.observe(element);
    }

    return {
        element,

        update: (newCtx: WidgetOverlayContext) => {
            currentProps = { ...currentProps, ...(newCtx.props as Partial<Props>) };
            element.style.backgroundColor = currentProps.backgroundColor;
            chart.setOption(buildOption(currentProps));

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
