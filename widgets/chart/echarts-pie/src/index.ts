/**
 * ECharts 饼图主入口 (Overlay 模板)
 *
 * 支持普通饼图、环形图、南丁格尔玫瑰图
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props, type PieDataPoint } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 根据 labelType 生成 label formatter
 */
function getLabelFormatter(labelType: Props['labelType']): string | ((params: { name: string; percent: number }) => string) {
    switch (labelType) {
        case 'name':
            return '{b}';
        case 'value':
            return '{c}';
        case 'percent':
            return '{d}%';
        case 'name-percent':
        default:
            return (params: { name: string; percent: number }) => `${params.name} ${params.percent}%`;
    }
}

/**
 * 根据 Props 生成 ECharts Option
 */
function buildOption(props: Props): echarts.EChartsOption {
    const { title, data, radius, innerRadius, showLegend, showLabel, labelType, roseType } = props;

    return {
        title: {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14 },
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
            show: showLegend,
            orient: 'horizontal',
            bottom: 0,
        },
        series: [
            {
                name: title,
                type: 'pie',
                radius: innerRadius === '0%' ? radius : [innerRadius, radius],
                roseType: roseType ? 'area' : undefined,
                data: data.map((d: PieDataPoint) => ({
                    name: d.name,
                    value: d.value,
                })),
                label: {
                    show: showLabel,
                    formatter: getLabelFormatter(labelType) as string,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: () => Math.random() * 200,
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
