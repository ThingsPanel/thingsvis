/**
 * ECharts 仪表盘主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';

import zh from './locales/zh.json';
import en from './locales/en.json';

const CHART_PADDING = 16;
const STANDALONE_GAUGE_SERIES = [{ name: 'CPU', value: 67 }];

type RuntimeMessages = {
    runtime?: {
        emptyState?: string;
    };
};

function getRuntimeMessages(locale?: string): RuntimeMessages {
    return locale?.toLowerCase().startsWith('zh') ? (zh as RuntimeMessages) : (en as RuntimeMessages);
}

function parseGaugeData(raw: Props['data'], fallbackName: string): { value: number; name: string } | null {
    const entry = Array.isArray(raw) ? raw[raw.length - 1] : raw;

    if (typeof entry === 'number' || typeof entry === 'string') {
        const value = typeof entry === 'number' ? entry : Number(entry);
        if (!Number.isFinite(value)) return null;
        return { value, name: fallbackName };
    }

    if (!entry || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const valueRaw = record.value ?? record.y ?? record.current ?? record.score;
    const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
    if (!Number.isFinite(value)) return null;
    return {
        value,
        name: typeof record.name === 'string'
            ? record.name
            : typeof record.label === 'string'
                ? record.label
                : fallbackName,
    };
}


/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(
    props: Props,
    colors: WidgetColors,
    locale: string | undefined,
    scale: number = 1,
): echarts.EChartsOption {
    const { title, data, primaryColor, max } = props;
    const runtimeMessages = getRuntimeMessages(locale);

    const textColor = colors.fg;
    const splitLineColor = colors.axis;
    const axisLineColor = colors.axis;
    const padding = Math.round(CHART_PADDING * scale);

    // Extract current value and name
    const dataEntry = parseGaugeData(data, title || '');
    const val = dataEntry?.value ?? 0;
    const itemName = dataEntry?.name ?? (title || '');
    const hasData = dataEntry !== null;

    return {
        backgroundColor: 'transparent',
        color: colors.series,
        graphic: hasData ? undefined : {
            type: 'text',
            left: 'center',
            top: 'middle',
            silent: true,
            style: {
                text: runtimeMessages.runtime?.emptyState || 'Add a numeric value or bind a metric',
                fill: colors.fg,
                opacity: 0.65,
                fontSize: Math.round(14 * scale),
            },
        },
        title: title ? {
            text: title,
            left: 'center',
            textStyle: {
                fontSize: Math.round(14 * scale),
                color: textColor,
                fontWeight: 'normal'
            },
            top: padding,
        } : undefined,
        series: hasData ? [
            {
                type: 'gauge',
                center: ['50%', title ? '58%' : '54%'],
                radius: '76%',
                startAngle: 210,
                endAngle: -30,
                min: 0,
                max: max,
                splitNumber: 10,
                axisLine: {
                    lineStyle: {
                        width: Math.round(8 * scale),
                        color: [[1, axisLineColor]]
                    }
                },
                progress: {
                    show: true,
                    width: Math.round(12 * scale),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: colors.series[0] || primaryColor },
                            { offset: 1, color: colors.series[1] || primaryColor }
                        ]),
                        borderRadius: Math.round(6 * scale)
                    }
                },
                pointer: {
                    show: true,
                    length: '60%',
                    width: Math.round(4 * scale),
                    offsetCenter: [0, '5%'],
                    itemStyle: {
                        color: primaryColor
                    }
                },
                axisTick: {
                    show: true,
                    distance: Math.round(-15 * scale),
                    lineStyle: {
                        color: splitLineColor,
                        width: 1
                    }
                },
                splitLine: {
                    show: true,
                    distance: Math.round(-15 * scale),
                    length: Math.round(10 * scale),
                    lineStyle: {
                        color: splitLineColor,
                        width: 2
                    }
                },
                axisLabel: {
                    show: true,
                    distance: Math.round(-30 * scale),
                    color: textColor,
                    fontSize: Math.round(10 * scale)
                },
                anchor: {
                    show: true,
                    showAbove: true,
                    size: Math.round(14 * scale),
                    itemStyle: {
                        borderWidth: Math.round(3 * scale),
                        borderColor: primaryColor,
                        color: '#fff',
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,0,0,0.2)'
                    }
                },
                title: {
                    show: true,
                    offsetCenter: [0, '40%'],
                    fontSize: Math.round(12 * scale),
                    color: textColor,
                    opacity: 0.8
                },
                detail: {
                    valueAnimation: true,
                    offsetCenter: [0, '75%'],
                    formatter: '{value}',
                    color: textColor,
                    fontSize: Math.round(26 * scale),
                    fontWeight: 'bold'
                },
                data: [{ value: val, name: itemName }]
            }
        ] : [],
    };
}

import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    defaultSize: metadata.defaultSize,
    constraints: metadata.constraints,
    resizable: metadata.resizable,
    locales: { zh, en },
    schema: PropsSchema,
    standaloneDefaults: { data: STANDALONE_GAUGE_SERIES },
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let colors: WidgetColors = resolveWidgetColors(element);

        const chart = echarts.init(element);
        chart.setOption(buildOption(currentProps, colors, ctx.locale, 1));

        const scheduleResize = () => {
            try {
                requestAnimationFrame(() => {
                    if (!chart.isDisposed()) {
                        chart.resize();
                        const cw = element.clientWidth || 300;
                        const ch = element.clientHeight || 200;
                        const minDim = Math.min(cw, ch);
                        const scale = Math.max(0.6, Math.min(1.5, minDim / 300));
                        chart.setOption(buildOption(currentProps, colors, ctx.locale, scale), { replaceMerge: ['dataset', 'series'] });
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

                chart.setOption(buildOption(currentProps, colors, newCtx.locale), { replaceMerge: ['dataset', 'series'] });

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
