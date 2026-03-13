/**
 * ECharts 柱状图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetOverlayContext } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const LEGACY_DEFAULT_PRIMARY = '#6965db';

function pickSeriesColor(primaryColor: string, colors: WidgetColors): string {
    return (colors.series[0] ?? colors.primary ?? (primaryColor ?? '').trim()) || LEGACY_DEFAULT_PRIMARY;
}

function withAlpha(color: string, alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    const normalized = color.trim();

    const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch && hexMatch[1]) {
        const hex = hexMatch[1];
        const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
        const num = Number.parseInt(fullHex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${clamped})`;
    }

    const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch && rgbMatch[1]) {
        const parts = rgbMatch[1].split(',').map((part) => part.trim());
        if (parts.length >= 3) {
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
        }
    }

    const hslMatch = normalized.match(/^hsla?\(([^)]+)\)$/i);
    if (hslMatch && hslMatch[1]) {
        const parts = hslMatch[1].split(',').map((part) => part.trim());
        if (parts.length >= 3) {
            return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
        }
    }

    return normalized;
}

function normalizeCategoryData(data: Props['data']) {
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry, index) => {
        if (entry && typeof entry === 'object') {
            const record = entry as Record<string, unknown>;
            const name = record.name ?? record.label ?? record.x;
            const value = record.value ?? record.y;
            const numericValue = typeof value === 'number' ? value : Number(value);
            if (name != null && Number.isFinite(numericValue)) {
                return [{ name: String(name), value: numericValue }];
            }
        }
        return [];
    });
}

/**
 * Build ECharts option from props and theme colors
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
    const { title, data, primaryColor, showLegend, showXAxis, showYAxis } = props;
    const normalizedData = normalizeCategoryData(data);
    const hasData = normalizedData.length > 0;

    const textColor = colors.fg;
    const splitLineColor = colors.axis;
    const seriesColor = pickSeriesColor(primaryColor, colors);

    const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: seriesColor },
        { offset: 1, color: withAlpha(seriesColor, 0.25) }
    ]);

    return {
        backgroundColor: 'transparent',
        color: colors.series,
        graphic: hasData ? undefined : {
            type: 'text',
            left: 'center',
            top: 'middle',
            silent: true,
            style: {
                text: '暂无数据',
                fill: textColor,
                opacity: 0.65,
                fontSize: Math.round(14 * scale),
            },
        },
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
        dataset: hasData ? {
            dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: title || 'props.value' }],
            source: normalizedData
        } : undefined,
        xAxis: {
            show: showXAxis !== false,
            type: 'category',
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            axisLine: { lineStyle: { color: splitLineColor } },
            axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
        },
        yAxis: {
            show: showYAxis !== false,
            type: 'value',
            splitLine: { lineStyle: { color: splitLineColor } },
            axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
            axisLine: { show: true, lineStyle: { color: splitLineColor } },
            axisTick: { show: true, lineStyle: { color: splitLineColor } },
        },
        series: hasData ? [
            {
                type: 'bar',
                encode: { x: 'name', y: 'value', tooltip: ['value'] },
                itemStyle: {
                    color: gradientColor,
                    borderRadius: [4, 4, 0, 0],
                },
            },
        ] : [],
    };
}

import { defineWidget, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

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
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let colors: WidgetColors = resolveWidgetColors(element);

        // Initialize ECharts
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
                        chart.setOption(buildOption(currentProps, colors, scale), { replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis'] });
                    }
                });
            } catch {
                if (!chart.isDisposed()) chart.resize();
            }
        };

        scheduleResize();

        let ro: ResizeObserver | null = null;
        let themeObserver: MutationObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => scheduleResize());
            ro.observe(element);
        }

        const themeTarget = element.closest('[data-canvas-theme]');
        if (themeTarget && typeof MutationObserver !== 'undefined') {
            themeObserver = new MutationObserver(() => {
                colors = resolveWidgetColors(element);
                scheduleResize();
            });
            themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
        }

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                colors = resolveWidgetColors(element);

                // scheduleResize handles setOption with scale logic
                if (newCtx.size || !newCtx.size) {
                    scheduleResize();
                }
            },
            destroy: () => {
                ro?.disconnect();
                themeObserver?.disconnect();
                chart.dispose();
            },
        };
    }
});

export default Main;
