/**
 * ECharts 仪表盘主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';


/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
    const { title, data, primaryColor, max } = props;

    const textColor = colors?.fg ?? '#333';
    const splitLineColor = colors?.axis ?? '#00000010';
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
                name: title || 'props.value',
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

import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

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
        let isDark = true;

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
                        chart.setOption(buildOption(currentProps, colors, scale), { replaceMerge: ['dataset', 'series'] });
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
                isDark = true;

                chart.setOption(buildOption(currentProps, colors), { replaceMerge: ['dataset', 'series'] });

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
});

export default Main;
