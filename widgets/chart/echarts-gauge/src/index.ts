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
                center: ['50%', '60%'], // 整体往下沉
                radius: '100%', // 撑满外框
                startAngle: 200,
                endAngle: -20,
                itemStyle: {
                    color: primaryColor, // 进度条采用主色调
                },
                progress: {
                    show: true,
                    width: 20,
                    roundCap: true // 圆润风格
                },
                axisLine: {
                    roundCap: true,
                    lineStyle: {
                        width: 20, // 背景轨
                        color: [[1, axisLineColor]]
                    }
                },
                pointer: {
                    show: false, // 隐藏老气的指针，采用更现代的纯环形数字显示
                },
                axisTick: { show: false }, // 隐藏小刻度
                splitLine: { show: false }, // 隐藏分割线
                axisLabel: { show: false }, // 隐藏外围刻度文字，保持极简
                title: {
                    show: true,
                    offsetCenter: [0, '25%'], // 标题放在中间下方
                    fontSize: 16,
                    color: textColor
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    fontSize: 40,
                    fontWeight: 'bolder',
                    color: textColor,
                    offsetCenter: [0, '-15%'] // 数字本身放在正中间稍上的位置
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
