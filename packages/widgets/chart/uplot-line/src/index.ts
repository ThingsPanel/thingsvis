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
/** Same numeric intent as echarts-bar `LEGEND_BLOCK_HEIGHT` / `LEGEND_FONT_SIZE`. */
const LEGEND_BLOCK_HEIGHT = 20;
const LEGEND_FONT_SIZE = 12;
/** Gap between X-axis band (canvas bottom) and legend — half widget padding, same rhythm as echarts-bar spacing. */
const LEGEND_AXIS_GAP_BASE = WIDGET_PADDING / 2;

/**
 * uPlot `opts.height` is only `.u-wrap` (canvas + axes). HTML legend stacks below — reserve bar-aligned
 * `legendSpace` plus axis→legend gap so margin does not get clipped by overflow:hidden.
 */
function computeUplotInnerSize(
    containerW: number,
    containerH: number,
    showLegend: boolean,
    scale: number,
): { width: number; height: number } {
    const legendAxisGap = Math.round(LEGEND_AXIS_GAP_BASE * scale);
    const reserve = showLegend
        ? Math.round(LEGEND_BLOCK_HEIGHT * scale)
            + Math.round(WIDGET_PADDING * scale)
            + legendAxisGap
        : 0;
    return {
        width: Math.max(0, Math.floor(containerW)),
        height: Math.max(48, Math.floor(containerH - reserve)),
    };
}

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

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

type HoverTooltipCtx = {
    spanSec: number;
    seriesLabel: string;
    fg: string;
    tooltipBg: string;
    tooltipBorder: string;
};

/**
 * uPlot 没有 ECharts 那种内置悬浮框；官方在 demos/tooltips.html 里用 hooks.init + hooks.setCursor
 * 把 DOM 挂在 u.over 上更新 — https://leeoniya.github.io/uPlot/demos/tooltips.html
 */
function createHoverTooltipPlugin(ctx: HoverTooltipCtx) {
    let tt: HTMLDivElement | null = null;

    return {
        hooks: {
            init(u: uPlot) {
                tt = document.createElement('div');
                tt.className = 'thingsvis-uplot-tooltip';
                tt.style.cssText = [
                    'position:absolute',
                    'display:none',
                    'pointer-events:none',
                    'z-index:20',
                    'max-width:260px',
                    'padding:6px 10px',
                    'border-radius:6px',
                    'font-size:12px',
                    'line-height:1.45',
                    'font-family:Inter,system-ui,Noto Sans SC,Noto Sans,sans-serif',
                    'font-weight:500',
                    `color:${ctx.fg}`,
                    `background:${ctx.tooltipBg}`,
                    `border:1px solid ${ctx.tooltipBorder}`,
                    'box-shadow:0 4px 14px rgba(0,0,0,0.1)',
                ].join(';');
                u.over.appendChild(tt);
            },
            setCursor(u: uPlot) {
                if (!tt) return;
                const { idx } = u.cursor;
                const left = u.cursor.left ?? -1;
                const top = u.cursor.top ?? -1;
                if (idx == null || left < 0 || top < 0) {
                    tt.style.display = 'none';
                    return;
                }
                const xRaw = u.data[0][idx];
                const yRaw = u.data[1]?.[idx];
                if (yRaw == null || (typeof yRaw === 'number' && Number.isNaN(yRaw))) {
                    tt.style.display = 'none';
                    return;
                }
                const timeStr = formatTick(Number(xRaw), ctx.spanSec);
                const yStr = typeof yRaw === 'number' ? String(yRaw) : String(yRaw);
                tt.innerHTML = `<span style="opacity:0.78;font-size:11px;font-weight:400">${escapeHtml(ctx.seriesLabel)}</span><br/><span style="font-weight:600">${escapeHtml(timeStr)}</span> <span style="opacity:0.55">·</span> <span>${escapeHtml(yStr)}</span>`;
                tt.style.display = 'block';

                const pad = 12;
                let lx = left + pad;
                let ty = top + pad;
                const ow = u.over.clientWidth;
                const oh = u.over.clientHeight;
                tt.style.left = `${lx}px`;
                tt.style.top = `${ty}px`;
                const tw = tt.offsetWidth;
                const th = tt.offsetHeight;
                if (lx + tw > ow - 6) lx = Math.max(6, left - tw - pad);
                if (ty + th > oh - 6) ty = Math.max(6, top - th - pad);
                tt.style.left = `${lx}px`;
                tt.style.top = `${ty}px`;
            },
            destroy() {
                tt?.remove();
                tt = null;
            },
        },
    };
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
        element.setAttribute('data-thingsvis-uplot-line', '');

        // Descendant selectors: `.uplot` lives inside chartContainer, not as a sibling of this <style>.
        const styleId = `uplot-override-${Math.random().toString(36).slice(2)}`;
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
            [data-thingsvis-uplot-line] .uplot {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100%;
                box-sizing: border-box;
            }
            [data-thingsvis-uplot-line] .u-legend {
                margin: var(--uplot-legend-axis-gap, 8px) 0 0 !important;
                padding: 0 !important;
                width: 100%;
                box-sizing: border-box;
                text-align: center;
                font-family: Inter, "Noto Sans SC", "Noto Sans", sans-serif !important;
                font-size: var(--uplot-legend-font-size, 12px) !important;
                font-weight: 400 !important;
                color: var(--uplot-legend-color, inherit) !important;
                line-height: var(--uplot-legend-line-height, 1.33) !important;
            }
            [data-thingsvis-uplot-line] .u-legend th,
            [data-thingsvis-uplot-line] .u-legend td {
                font-weight: 400 !important;
                font-family: inherit !important;
                font-size: inherit !important;
            }
            [data-thingsvis-uplot-line] .u-legend .u-series > * {
                padding: 2px 4px !important;
            }
            [data-thingsvis-uplot-line] .u-legend .u-label {
                font-size: inherit !important;
                font-weight: 400 !important;
            }
        `;
        element.prepend(styleEl);

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

            const showX = currentProps.showXAxis !== false;
            const showY = currentProps.showYAxis !== false;
            const showLegend = currentProps.showLegend;
            const { width: plotW, height: plotH } = computeUplotInnerSize(cw, ch, showLegend, scale);

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
            const seriesLabel = currentProps.title || runtimeMessages.runtime?.defaultSeriesName || 'Value';
            const tooltipBg =
                currentColors.bg && currentColors.bg !== 'transparent'
                    ? withAlpha(currentColors.bg, 0.98)
                    : 'rgba(250,250,252,0.97)';
            const tooltipBorder = withAlpha(currentAxisLabelColor, 0.22);

            const legendFontPx = Math.round(LEGEND_FONT_SIZE * scale);
            const legendAxisGapPx = Math.round(LEGEND_AXIS_GAP_BASE * scale);
            element.style.setProperty('--uplot-legend-font-size', `${legendFontPx}px`);
            element.style.setProperty('--uplot-legend-line-height', `${Math.round(16 * scale)}px`);
            element.style.setProperty('--uplot-legend-color', currentAxisLabelColor);
            element.style.setProperty('--uplot-legend-axis-gap', `${legendAxisGapPx}px`);

            applyHeader(scale);
            emptyStateEl.style.color = withAlpha(currentAxisLabelColor, 0.65);
            emptyStateEl.style.fontSize = `${Math.max(12, Math.round(13 * scale))}px`;
            emptyStateEl.style.alignItems = 'flex-start';
            emptyStateEl.style.justifyContent = 'flex-end';
            emptyStateEl.style.padding = `${Math.max(10, Math.round(12 * scale))}px ${Math.max(12, Math.round(16 * scale))}px`;
            emptyStateEl.textContent = hasData ? '' : (runtimeMessages.runtime?.previewState || 'Preview style - data appears after binding');
            emptyStateEl.style.display = hasData ? 'none' : 'flex';

            // Independent axis font sizes with scale
            const xFontSize = Math.round((currentProps.xAxisFontSize ?? 12) * scale);
            const yFontSize = Math.round((currentProps.yAxisFontSize ?? 12) * scale);
            const xAxisFont = `${xFontSize}px Inter, Noto Sans SC, Noto Sans, sans-serif`;
            const yAxisFont = `${yFontSize}px Inter, Noto Sans SC, Noto Sans, sans-serif`;

            const padSide = Math.round(WIDGET_PADDING * scale);
            // Extra right inset so the last X tick label (e.g. "11:00") is not clipped by the canvas edge.
            const padRight = padSide + Math.round(20 * scale);
            // uPlot `padding[2]` is inset between the series area and the X-axis band — large values create a visible
            // "dead strip" above tick labels. Keep it minimal; the axis `size` holds the tick labels.
            const effectivePaddingBottom = Math.max(2, Math.round(4 * scale));

            // Tight X band (bar chart has no extra strip): ticks + one line of labels, capped like ECharts density.
            const xAxisBand = Math.max(22, Math.min(34, Math.round(xFontSize + 10 + 6 * scale)));

            const opts: uPlot.Options = {
                width: plotW,
                height: plotH,
                padding: [
                    Math.round(8 * scale),
                    padRight,
                    effectivePaddingBottom,
                    padSide,
                ],
                plugins: [
                    createHoverTooltipPlugin({
                        spanSec,
                        seriesLabel,
                        fg: currentAxisLabelColor,
                        tooltipBg,
                        tooltipBorder,
                    }),
                ],
                legend: {
                    show: showLegend,
                    // Static series name in legend (dashboard parity with ECharts widgets); hover values in floating tooltip plugin.
                    live: false,
                    markers: {
                        show: true,
                        width: 1,
                        stroke: lineColor,
                        fill: withAlpha(lineColor, 0.25),
                    },
                },
                axes: [
                    {
                        show: showX,
                        stroke: currentAxisLabelColor,
                        font: xAxisFont,
                        size: xAxisBand,
                        space: Math.max(40, Math.round(50 * scale)),
                        values: (_u: uPlot, vals: number[]) => vals.map((v) => formatTick(Number(v), spanSec)),
                        grid: showX ? { stroke: currentGridColor, width: 1 } : undefined,
                        ticks: showX ? { stroke: currentGridColor, width: 1 } : undefined,
                    },
                    {
                        show: showY,
                        stroke: currentAxisLabelColor,
                        font: yAxisFont,
                        grid: showY ? { stroke: currentGridColor, width: 1, dash: [5, 5] } : undefined,
                        ticks: showY ? { stroke: currentGridColor, width: 0 } : undefined,
                    },
                ],
                scales: {
                    y: {
                        auto: (): boolean =>
                            currentProps.yAxisMin == null && currentProps.yAxisMax == null,
                        range: (_self: uPlot, min: number, max: number): [number, number] => {
                            if (currentProps.yAxisMin != null && currentProps.yAxisMax != null)
                                return [currentProps.yAxisMin, currentProps.yAxisMax];
                            if (currentProps.yAxisMin != null) return [currentProps.yAxisMin, max];
                            if (currentProps.yAxisMax != null) return [min, currentProps.yAxisMax];
                            return [min, max];
                        },
                    },
                },
                series: [
                    {},
                    {
                        label: seriesLabel,
                        stroke: lineColor,
                        fill: currentProps.showArea
                            ? withAlpha(lineColor, currentProps.areaFillAlpha ?? 0.18)
                            : undefined,
                        width: currentProps.lineWidth ?? 2,
                        paths: currentProps.smooth && uPlot.paths.spline
                            ? uPlot.paths.spline()
                            : uPlot.paths.linear?.(),
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
                    const { width: pw, height: ph } = computeUplotInnerSize(
                        cw,
                        ch,
                        currentProps.showLegend,
                        newScale,
                    );
                    chart.setSize({ width: pw, height: ph });
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
                const injectedStyle = document.getElementById(styleId);
                injectedStyle?.remove();
            },
        };
    },
});

export default Main;
