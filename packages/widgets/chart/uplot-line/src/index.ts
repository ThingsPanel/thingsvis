import 'uplot/dist/uPlot.min.css';
import uPlot from 'uplot';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
    defineWidget,
    resolveLayeredColor,
    resolveLocaleRecord,
    type WidgetOverlayContext,
    resolveWidgetColors,
    type WidgetColors,
} from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const localeCatalog = { zh, en } as const;

const LEGACY_DEFAULT_PRIMARY = '#6965db';
const WIDGET_PADDING = 16;
const TIME_RANGE_SEC: Record<Exclude<Props['timeRangePreset'], 'all'>, number> = {
    '1h': 60 * 60,
    '6h': 6 * 60 * 60,
    '24h': 24 * 60 * 60,
    '7d': 7 * 24 * 60 * 60,
    '30d': 30 * 24 * 60 * 60,
};
const STANDALONE_UPLOT_SERIES = [
    { timestamp: '2026-01-01T00:00:00Z', value: 18 },
    { timestamp: '2026-01-01T01:00:00Z', value: 22 },
    { timestamp: '2026-01-01T02:00:00Z', value: 26 },
    { timestamp: '2026-01-01T03:00:00Z', value: 24 },
];

type ParsedPoint = { tsSec: number; value: number };
type RuntimeMessages = {
    runtime?: {
        defaultSeriesName?: string;
        emptyState?: string;
        previewState?: string;
    };
};

function getRuntimeMessages(locale: string | undefined): RuntimeMessages {
    return resolveLocaleRecord(localeCatalog, locale) as RuntimeMessages;
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

function parseTimestampMs(raw: unknown): number | null {
    if (raw instanceof Date) {
        const ms = raw.getTime();
        return Number.isFinite(ms) ? ms : null;
    }

    if (typeof raw === 'number') {
        if (!Number.isFinite(raw)) return null;
        if (raw > 1e11) return raw;
        if (raw > 1e9) return raw * 1000;
        return null;
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return null;

        const asNum = Number(trimmed);
        if (Number.isFinite(asNum)) {
            if (asNum > 1e11) return asNum;
            if (asNum > 1e9) return asNum * 1000;
        }

        const parsed = Date.parse(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function parseNumber(raw: unknown): number | null {
    if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === 'string') {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toParsedPoint(entry: unknown): ParsedPoint | null {
    if (Array.isArray(entry)) {
        const [timeRaw, valueRaw] = entry;
        const ms = parseTimestampMs(timeRaw);
        const value = parseNumber(valueRaw);
        if (ms === null || value === null) return null;
        return { tsSec: Math.round(ms / 1000), value };
    }

    if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const timeRaw = record.time ?? record.timestamp ?? record.ts ?? record.name ?? record.x;
        const valueRaw = record.value ?? record.y;
        const ms = parseTimestampMs(timeRaw);
        const value = parseNumber(valueRaw);
        if (ms === null || value === null) return null;
        return { tsSec: Math.round(ms / 1000), value };
    }

    return null;
}

function normalizeSeries(data: unknown, timeRangePreset: Props['timeRangePreset']): ParsedPoint[] {
    if (!Array.isArray(data)) return [];

    const points = data.map(toParsedPoint).filter((p): p is ParsedPoint => p !== null);
    if (points.length === 0) return [];

    points.sort((a, b) => a.tsSec - b.tsSec);
    const deduped = new Map<number, number>();
    points.forEach((p) => deduped.set(p.tsSec, p.value));

    const normalized = Array.from(deduped.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([tsSec, value]) => ({ tsSec, value }));

    if (timeRangePreset === 'all' || normalized.length === 0) {
        return normalized;
    }

    const rangeSec = TIME_RANGE_SEC[timeRangePreset];
    const endSec = normalized[normalized.length - 1]!.tsSec;
    const startSec = endSec - rangeSec;
    const filtered = normalized.filter((point) => point.tsSec >= startSec);
    return filtered.length > 0 ? filtered : [normalized[normalized.length - 1]!];
}

function getFallbackRangeSec(timeRangePreset: Props['timeRangePreset']): number {
    return timeRangePreset === 'all' ? TIME_RANGE_SEC['1h'] : TIME_RANGE_SEC[timeRangePreset];
}

function buildPreviewSeries(timeRangePreset: Props['timeRangePreset']): ParsedPoint[] {
    const rangeSec = getFallbackRangeSec(timeRangePreset);
    const endSec = Math.floor(Date.now() / 1000);
    const pointCount = 6;
    const stepSec = Math.max(60, Math.floor(rangeSec / (pointCount - 1)));
    const sampleValues = [18, 24, 21, 29, 34, 31];

    return sampleValues.map((value, index) => ({
        tsSec: endSec - stepSec * (pointCount - index - 1),
        value,
    }));
}

function pickLineColor(props: Props, colors: WidgetColors): string {
    return resolveLayeredColor({
        instance: props.primaryColor,
        theme: colors.series[0] ?? colors.primary,
        fallback: LEGACY_DEFAULT_PRIMARY,
        inheritValues: [LEGACY_DEFAULT_PRIMARY],
    });
}

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function formatTick(tsSec: number, spanSec: number): string {
    const date = new Date(tsSec * 1000);
    if (!Number.isFinite(date.getTime())) return '';

    const hhmm = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    if (spanSec <= 24 * 60 * 60) {
        return hhmm;
    }

    return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${hhmm}`;
}

function getTitleAlignment(align: Props['titleAlign']): 'left' | 'center' | 'right' {
    if (align === 'center') return 'center';
    if (align === 'right') return 'right';
    return 'left';
}

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    defaultSize: metadata.defaultSize,
    constraints: metadata.constraints,
    locales: { zh, en },
    schema: PropsSchema,
    standaloneDefaults: { data: STANDALONE_UPLOT_SERIES },
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let currentLocale = ctx.locale;
        let colors: WidgetColors = resolveWidgetColors(element);

        let chart: uPlot | null = null;
        let ro: ResizeObserver | null = null;
        let themeObserver: MutationObserver | null = null;
        let lastScale = -1;

        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.boxSizing = 'border-box';
        element.style.overflow = 'hidden';

        const headerEl = document.createElement('div');
        headerEl.style.display = 'flex';
        headerEl.style.alignItems = 'center';
        headerEl.style.justifyContent = 'flex-start';
        headerEl.style.gap = '8px';
        headerEl.style.flex = '0 0 auto';
        headerEl.style.padding = `${WIDGET_PADDING}px ${WIDGET_PADDING}px 8px ${WIDGET_PADDING}px`;
        element.appendChild(headerEl);

        const titleEl = document.createElement('div');
        titleEl.style.flex = '1 1 auto';
        titleEl.style.minWidth = '0';
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.style.overflow = 'hidden';
        titleEl.style.textOverflow = 'ellipsis';
        titleEl.style.fontSize = '14px';
        titleEl.style.fontWeight = 'bold';
        headerEl.appendChild(titleEl);

        const chartContainer = document.createElement('div');
        chartContainer.style.position = 'relative';
        chartContainer.style.flex = '1 1 auto';
        chartContainer.style.width = '100%';
        chartContainer.style.minHeight = '0';
        element.appendChild(chartContainer);

        const emptyStateEl = document.createElement('div');
        emptyStateEl.style.position = 'absolute';
        emptyStateEl.style.inset = '0';
        emptyStateEl.style.display = 'none';
        emptyStateEl.style.alignItems = 'center';
        emptyStateEl.style.justifyContent = 'center';
        emptyStateEl.style.fontSize = '13px';
        emptyStateEl.style.pointerEvents = 'none';
        chartContainer.appendChild(emptyStateEl);

        const applyHeader = (scale: number) => {
            colors = resolveWidgetColors(element);
            const showTitle = !!currentProps.title;
            headerEl.style.display = showTitle ? 'flex' : 'none';

            titleEl.textContent = currentProps.title || '';
            titleEl.style.display = showTitle ? 'block' : 'none';
            titleEl.style.color = resolveLayeredColor({
                instance: currentProps.titleColor,
                theme: colors.fg,
                fallback: colors.fg,
            });
            titleEl.style.fontSize = `${Math.round(14 * scale)}px`;
            titleEl.style.fontWeight = '600';
            titleEl.style.textAlign = getTitleAlignment(currentProps.titleAlign);
        };

        const initChart = () => {
            if (chart) {
                chart.destroy();
                chart = null;
            }

            const points = normalizeSeries(currentProps.data, currentProps.timeRangePreset);
            const hasData = points.length > 0;
            const renderPoints = hasData ? points : buildPreviewSeries(currentProps.timeRangePreset);
            const fallbackRangeSec = getFallbackRangeSec(currentProps.timeRangePreset);
            const fallbackEndSec = Math.floor(Date.now() / 1000);
            const finalTimes = renderPoints.length > 0
                ? renderPoints.map((p) => p.tsSec)
                : [fallbackEndSec - fallbackRangeSec, fallbackEndSec];
            const finalValues = renderPoints.length > 0
                ? renderPoints.map((p) => p.value)
                : [18, 31];

            const chartData = [
                finalTimes,
                finalValues,
            ] as uPlot.AlignedData;

            const cw = chartContainer.clientWidth || 300;
            const ch = chartContainer.clientHeight || 200;
            const minDim = Math.min(cw, ch);
            const scale = Math.max(0.6, Math.min(1.5, minDim / 300));
            lastScale = scale;

            const currentColors = resolveWidgetColors(element);
            const currentAxisLabelColor = resolveLayeredColor({
                instance: currentProps.axisLabelColor,
                theme: currentColors?.fg,
                fallback: currentColors?.fg ?? '#333',
            });
            const currentGridColor = currentColors?.axis ?? '#00000010';
            const lineColor = pickLineColor(currentProps, currentColors);
            const spanSec = finalTimes.length > 1 ? Math.max(0, finalTimes[finalTimes.length - 1]! - finalTimes[0]!) : fallbackRangeSec;
            const runtimeMessages = getRuntimeMessages(currentLocale);
            applyHeader(scale);
            emptyStateEl.style.color = withAlpha(currentAxisLabelColor, 0.65);
            emptyStateEl.style.fontSize = `${Math.max(12, Math.round(13 * scale))}px`;
            emptyStateEl.style.alignItems = 'flex-start';
            emptyStateEl.style.justifyContent = 'flex-end';
            emptyStateEl.style.padding = `${Math.max(10, Math.round(12 * scale))}px ${Math.max(12, Math.round(16 * scale))}px`;
            emptyStateEl.textContent = hasData ? '' : (runtimeMessages.runtime?.previewState || 'Preview style - data appears after binding');
            emptyStateEl.style.display = hasData ? 'none' : 'flex';

            const axisFontSize = Math.round(12 * scale);
            const axisFont = `${axisFontSize}px Inter, Noto Sans SC, Noto Sans, sans-serif`;

            const opts: uPlot.Options = {
                width: cw,
                height: ch,
                padding: [8, WIDGET_PADDING, WIDGET_PADDING, WIDGET_PADDING],
                legend: {
                    show: !!currentProps.showLegend,
                },
                axes: [
                    {
                        stroke: currentAxisLabelColor,
                        font: axisFont,
                        space: Math.max(72, Math.round(96 * scale)),
                        values: (_u: uPlot, vals: number[]) => vals.map((v) => formatTick(Number(v), spanSec)),
                        grid: { stroke: currentGridColor, width: 1 },
                        ticks: { stroke: currentGridColor, width: 1 },
                    },
                    {
                        stroke: currentAxisLabelColor,
                        font: axisFont,
                        grid: { stroke: currentGridColor, width: 1, dash: [5, 5] },
                        ticks: { stroke: currentGridColor, width: 0 },
                    },
                ],
                series: [
                    {},
                    {
                        label: currentProps.title || runtimeMessages.runtime?.defaultSeriesName || 'Value',
                        stroke: lineColor,
                        fill: withAlpha(lineColor, 0.18),
                        width: 2,
                        paths: uPlot.paths.spline ? uPlot.paths.spline() : undefined,
                        points: {
                            show: false,
                        },
                    },
                ],
                cursor: {
                    points: {
                        size: 6,
                        fill: lineColor,
                        stroke: currentAxisLabelColor,
                    },
                },
            };

            chart = new uPlot(opts, chartData, chartContainer);
        };

        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                if (!chart) return;

                const cw = chartContainer.clientWidth || 300;
                const ch = chartContainer.clientHeight || 200;
                const minDim = Math.min(cw, ch);
                const newScale = Math.max(0.6, Math.min(1.5, minDim / 300));

                if (Math.abs(newScale - lastScale) > 0.05 && lastScale !== -1) {
                    initChart();
                } else {
                    chart.setSize({ width: cw, height: ch });
                }
            });
            ro.observe(element);
        }

        const themeTarget = element.closest('[data-canvas-theme]');
        if (themeTarget && typeof MutationObserver !== 'undefined') {
            themeObserver = new MutationObserver(() => {
                initChart();
            });
            themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
        }

        const scheduleInit = () => {
            requestAnimationFrame(() => {
                const cw = chartContainer.clientWidth || 300;
                const ch = chartContainer.clientHeight || 200;
                lastScale = Math.max(0.6, Math.min(1.5, Math.min(cw, ch) / 300));
                initChart();
            });
        };

        scheduleInit();

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                currentLocale = newCtx.locale;
                colors = resolveWidgetColors(element);
                initChart();
            },
            destroy: () => {
                ro?.disconnect();
                themeObserver?.disconnect();
                if (chart) {
                    chart.destroy();
                }
            },
        };
    },
});

export default Main;
