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
const CHART_PADDING = 16;
const TITLE_FONT_SIZE = 14;
const LEGEND_FONT_SIZE = 12;
const TITLE_LINE_HEIGHT = 18;
const LEGEND_BLOCK_HEIGHT = 20;
const STANDALONE_BAR_SERIES = [
    { name: 'Mon', value: 18 },
    { name: 'Tue', value: 24 },
    { name: 'Wed', value: 31 },
    { name: 'Thu', value: 27 },
];

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

function formatCategoryLabel(raw: unknown): string {
    if (raw instanceof Date) {
        return raw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (typeof raw === 'number') {
        if (raw > 1e9) {
            const ms = raw > 1e11 ? raw : raw * 1000;
            const date = new Date(ms);
            if (Number.isFinite(date.getTime())) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }
        return String(raw);
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return '';

        const asNum = Number(trimmed);
        if (Number.isFinite(asNum) && asNum > 1e9) {
            return formatCategoryLabel(asNum);
        }

        const parsed = Date.parse(trimmed);
        if (Number.isFinite(parsed)) {
            return formatCategoryLabel(parsed);
        }

        return trimmed;
    }

    return '';
}

function normalizeCategoryData(data: Props['data']) {
    if (Array.isArray(data)) {
        return data.flatMap((entry, index) => {
            if (Array.isArray(entry)) {
                const [nameRaw, valueRaw] = entry;
                const numericValue = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
                if (Number.isFinite(numericValue)) {
                    return [{ name: formatCategoryLabel(nameRaw) || `项 ${index + 1}`, value: numericValue }];
                }
                return [];
            }

            if (entry && typeof entry === 'object') {
                const record = entry as Record<string, unknown>;
                const name = record.name ?? record.label ?? record.x ?? record.category ?? record.time ?? record.timestamp ?? record.ts;
                const value = record.value ?? record.y;
                const numericValue = typeof value === 'number' ? value : Number(value);
                if (name != null && Number.isFinite(numericValue)) {
                    return [{ name: formatCategoryLabel(name) || `项 ${index + 1}`, value: numericValue }];
                }
            }

            const numericValue = typeof entry === 'number' ? entry : Number(entry);
            if (Number.isFinite(numericValue)) {
                return [{ name: `项 ${index + 1}`, value: numericValue }];
            }

            return [];
        });
    }

    if (data && typeof data === 'object') {
        return Object.entries(data as Record<string, unknown>).flatMap(([key, value]) => {
            const numericValue = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(numericValue)) {
                return [];
            }
            return [{ name: key, value: numericValue }];
        });
    }

    return [];
}

function resolveChartLeft(align: Props['titleAlign']): 'left' | 'center' | 'right' {
    if (align === 'center') return 'center';
    if (align === 'right') return 'right';
    return 'left';
}

function resolveTitleTextAlign(align: Props['titleAlign']): 'left' | 'center' | 'right' {
    if (align === 'center') return 'center';
    if (align === 'right') return 'right';
    return 'left';
}

/**
 * Build ECharts option from props and theme colors
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
    const { title, titleAlign, data, primaryColor, showLegend, showXAxis, showYAxis } = props;
    const normalizedData = normalizeCategoryData(data);
    const hasData = normalizedData.length > 0;

    const textColor = colors.fg;
    const splitLineColor = colors.axis;
    const seriesColor = pickSeriesColor(primaryColor, colors);
    const padding = Math.round(CHART_PADDING * scale);
    const titleSpace = title ? Math.round(TITLE_LINE_HEIGHT * scale) + padding : 0;
    const legendSpace = showLegend ? Math.round(LEGEND_BLOCK_HEIGHT * scale) + padding : 0;
    const seriesName = title || '数值';

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
            left: resolveChartLeft(titleAlign),
            textAlign: resolveTitleTextAlign(titleAlign),
            textStyle: { fontSize: Math.round(TITLE_FONT_SIZE * scale), color: textColor },
            top: padding,
        } : undefined,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
        },
        legend: {
            show: showLegend,
            data: [seriesName],
            bottom: padding,
            left: 'center',
            selectedMode: true,
            icon: 'roundRect',
            textStyle: { color: textColor, fontSize: Math.round(LEGEND_FONT_SIZE * scale) },
        },
        grid: {
            left: padding,
            right: padding,
            bottom: padding + legendSpace,
            top: padding + titleSpace,
            containLabel: true,
        },
        dataset: hasData ? {
            dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: seriesName }],
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
                name: seriesName,
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
    standaloneDefaults: { data: STANDALONE_BAR_SERIES },
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
