import {
  defineWidget,
  resolveLayeredColor,
  resolveLocaleRecord,
  resolveWidgetColors,
  scaledChartFontSize,
  type WidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
/**
 * ECharts 折线图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

const localeCatalog = { zh, en } as const;

const LEGACY_DEFAULT_PRIMARY = '#6965db';
/** 图表内边距：配合 containLabel 为轴标签留出空间 */
const CHART_PADDING = 6;
/** 组件容器内边距，避免轴标签贴边被裁切 */
const WIDGET_INNER_PADDING = 0;
const LEGEND_BLOCK_HEIGHT = 20;
const TIME_RANGE_MS: Record<Exclude<Props['timeRangePreset'], 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};
const STANDALONE_LINE_SERIES = [
  { name: '示例1', value: 1048 },
  { name: '示例2', value: 735 },
  { name: '示例3', value: 580 },
  { name: '示例4', value: 984 },
  { name: '示例5', value: 700 },
];

type CategoryPoint = { name: string; value: number | null };
type TimePoint = { timeMs: number; value: number; label: string };
type NormalizedSingleLineData = {
  mode: 'category' | 'time';
  categoryData: CategoryPoint[];
  timeData: TimePoint[];
  timeSpanMs: number;
};
type NormalizedLineSeries = {
  name: string;
  normalized: NormalizedSingleLineData;
};
type RuntimeMessages = {
  runtime?: {
    defaultSeriesName?: string;
    emptyState?: string;
  };
};

function getRuntimeMessages(locale?: string): RuntimeMessages {
  return resolveLocaleRecord(localeCatalog, locale) as RuntimeMessages;
}

function pickSeriesColor(primaryColor: string, colors: WidgetColors): string {
  return resolveLayeredColor({
    instance: primaryColor,
    theme: colors.series[0] ?? colors.primary,
    fallback: LEGACY_DEFAULT_PRIMARY,
    inheritValues: [LEGACY_DEFAULT_PRIMARY],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveTooltipYValue(raw: unknown): string {
  let value: unknown = raw;
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in (value as object)) {
    value = (value as { value: unknown }).value;
  }
  if (Array.isArray(value)) {
    value = value.length > 1 ? value[1] : value[0];
  }
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
    return '-';
  }
  return String(value);
}

function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const normalized = color.trim();

  const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch && hexMatch[1]) {
    const hex = hexMatch[1];
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
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

function formatTimeLabel(timeMs: number, spanMs: number, format: Props['timeFormat']): string {
  const date = new Date(timeMs);
  if (!Number.isFinite(date.getTime())) return '';

  const pad = (value: number) => String(value).padStart(2, '0');
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  const pattern: string =
    format === 'auto'
      ? spanMs <= 24 * 60 * 60 * 1000
        ? 'HH:mm'
        : 'MM-dd HH:mm'
      : format;
  return Object.entries(tokens).reduce<string>(
    (result, [token, replacement]) => result.replace(token, replacement),
    pattern,
  );
}

function normalizeSingleLineData(
  data: Props['data'],
  timeRangePreset: Props['timeRangePreset'],
): NormalizedSingleLineData {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      mode: 'category' as const,
      categoryData: [],
      timeData: [],
      timeSpanMs: 0,
    };
  }

  const timePoints: TimePoint[] = [];
  const categoryPoints: CategoryPoint[] = [];

  data.forEach((entry, index) => {
    if (Array.isArray(entry)) {
      const [timeRaw, valueRaw] = entry;
      const timeMs = parseTimestampMs(timeRaw);
      const value = parseNumber(valueRaw);
      if (timeMs !== null && value !== null) {
        timePoints.push({ timeMs, value, label: String(timeRaw ?? '') });
        return;
      }
    }

    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const valueRaw = record.value ?? record.y;
      const numericValue = parseNumber(valueRaw);
      const timeRaw = record.time ?? record.timestamp ?? record.ts ?? record.x;
      const timeMs = parseTimestampMs(timeRaw);

      if (timeMs !== null && numericValue !== null) {
        timePoints.push({
          timeMs,
          value: numericValue,
          label: String(record.name ?? record.label ?? timeRaw ?? ''),
        });
        return;
      }

      const name = record.name ?? record.label ?? record.x ?? `项 ${index + 1}`;
      categoryPoints.push({
        name: String(name),
        value: numericValue,
      });
      return;
    }

    categoryPoints.push({
      name: `项 ${index + 1}`,
      value: parseNumber(entry),
    });
  });

  if (timePoints.length > 0) {
    const sorted = [...timePoints].sort((a, b) => a.timeMs - b.timeMs);
    const fullSpanMs = Math.max(0, sorted[sorted.length - 1]!.timeMs - sorted[0]!.timeMs);

    if (timeRangePreset !== 'all') {
      const rangeMs = TIME_RANGE_MS[timeRangePreset];
      const endMs = sorted[sorted.length - 1]!.timeMs;
      const startMs = endMs - rangeMs;
      const filtered = sorted.filter((point) => point.timeMs >= startMs);
      return {
        mode: 'time' as const,
        categoryData: [],
        timeData: filtered.length > 0 ? filtered : [sorted[sorted.length - 1]!],
        timeSpanMs:
          filtered.length > 1
            ? filtered[filtered.length - 1]!.timeMs - filtered[0]!.timeMs
            : fullSpanMs,
      };
    }

    return {
      mode: 'time' as const,
      categoryData: [],
      timeData: sorted,
      timeSpanMs: fullSpanMs,
    };
  }

  return {
    mode: 'category' as const,
    categoryData: categoryPoints,
    timeData: [],
    timeSpanMs: 0,
  };
}

function normalizeLineData(
  data: Props['data'],
  timeRangePreset: Props['timeRangePreset'],
): NormalizedLineSeries[] {
  if (Array.isArray(data) && data.length > 0) {
    const seriesRecords = data.filter((entry): entry is Record<string, unknown> => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
      const record = entry as Record<string, unknown>;
      return Array.isArray(record.data) || Array.isArray(record.values);
    });

    if (seriesRecords.length > 0) {
      return seriesRecords.slice(0, 4).map((record, index) => {
        const seriesData = (
          Array.isArray(record.data) ? record.data : record.values
        ) as Props['data'];
        return {
          name: String(record.name ?? record.label ?? record.seriesName ?? `Series ${index + 1}`),
          normalized: normalizeSingleLineData(seriesData, timeRangePreset),
        };
      });
    }
  }

  return [
    {
      name: '',
      normalized: normalizeSingleLineData(data, timeRangePreset),
    },
  ];
}

function getEmptyTimeWindow(timeRangePreset: Props['timeRangePreset']): {
  startMs: number;
  endMs: number;
} {
  const fallbackRangeMs =
    timeRangePreset === 'all' ? TIME_RANGE_MS['1h'] : TIME_RANGE_MS[timeRangePreset];
  const endMs = Date.now();
  return { startMs: endMs - fallbackRangeMs, endMs };
}

function computeScale(width: number, height: number): number {
  const minDim = Math.min(width, height);
  return Math.max(0.6, Math.min(1.5, minDim / 300));
}

/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(
  props: Props,
  colors: WidgetColors,
  messages: RuntimeMessages,
  scale: number = 1,
): echarts.EChartsOption {
  const {
    data,
    primaryColor,
    axisLabelColor,
    showLegend,
    smooth,
    showArea,
    showXAxis,
    timeFormat,
    showYAxis,
    seriesName,
    xAxisFontSize,
    yAxisFontSize,
    legendFontSize,
  } = props;

  const resolvedAxisLabelColor = resolveLayeredColor({
    instance: axisLabelColor,
    theme: colors.fg,
    fallback: colors.fg,
  });
  const splitLineColor = colors.axis;
  const baseSeriesColor = pickSeriesColor(primaryColor, colors);
  const padding = Math.round(CHART_PADDING * scale);
  const xLabelFontSize = scaledChartFontSize(xAxisFontSize, scale);
  const yLabelFontSize = scaledChartFontSize(yAxisFontSize, scale);
  const legendTextFontSize = scaledChartFontSize(legendFontSize, scale);
  // History/query range is owned by the bound data source. The legacy component preset is
  // intentionally ignored so saved dashboards do not apply a second, hidden client-side filter.
  const normalizedSeries = normalizeLineData(data, 'all');
  const multiSeries = normalizedSeries.length > 1;
  const showSeriesLegend = showLegend !== false && normalizedSeries.length > 0;
  const legendTopSpace = showSeriesLegend
    ? Math.round(LEGEND_BLOCK_HEIGHT * scale) + Math.round(padding * 0.5)
    : 0;
  const hasData = normalizedSeries.some(({ normalized }) =>
    normalized.mode === 'time'
      ? normalized.timeData.length > 0
      : normalized.categoryData.length > 0,
  );
  const emptyTimeWindow = getEmptyTimeWindow('all');
  const useEmptyTimeSkeleton = !hasData;
  const isTimeSeries =
    normalizedSeries.some(({ normalized }) => normalized.mode === 'time') || useEmptyTimeSkeleton;
  const timeSeriesSpanMs = Math.max(
    0,
    ...normalizedSeries.map(({ normalized }) => normalized.timeSpanMs),
  );
  const categoryAxisData = Array.from(
    new Set(
      normalizedSeries.flatMap(({ normalized }) =>
        normalized.mode === 'category' ? normalized.categoryData.map((point) => point.name) : [],
      ),
    ),
  );
  const getSeriesColor = (index: number) =>
    index === 0
      ? baseSeriesColor
      : (colors.series[index] ?? colors.series[index % colors.series.length] ?? baseSeriesColor);
  const buildSeriesData = (normalized: NormalizedSingleLineData) => {
    if (isTimeSeries) {
      if (hasData && normalized.mode === 'time') {
        return normalized.timeData.map((point) => ({
          name: point.label,
          value: [point.timeMs, point.value],
        }));
      }

      return [{ value: [emptyTimeWindow.startMs, null] }, { value: [emptyTimeWindow.endMs, null] }];
    }

    return categoryAxisData.map((categoryName) => {
      if (normalized.mode !== 'category') {
        return null;
      }

      return normalized.categoryData.find((point) => point.name === categoryName)?.value ?? null;
    });
  };
  const xAxis: echarts.XAXisComponentOption = isTimeSeries
    ? {
        show: showXAxis !== false,
        type: 'time',
        min: hasData ? undefined : emptyTimeWindow.startMs,
        max: hasData ? undefined : emptyTimeWindow.endMs,
        axisLabel: {
          color: resolvedAxisLabelColor,
          fontSize: xLabelFontSize,
          hideOverlap: true,
          margin: Math.max(8, Math.round(xLabelFontSize * 0.45)),
          formatter: (value: string | number) =>
            formatTimeLabel(
              Number(value),
              hasData ? timeSeriesSpanMs : emptyTimeWindow.endMs - emptyTimeWindow.startMs,
              timeFormat,
            ),
        },
        axisLine: { lineStyle: { color: splitLineColor } },
        axisTick: { show: true, lineStyle: { color: splitLineColor } },
      }
    : {
        show: showXAxis !== false,
        type: 'category',
        // Keep a half-category of horizontal breathing room so the first and
        // last category labels/points are not clipped at the grid edges.
        boundaryGap: true,
        data: categoryAxisData,
        axisLabel: {
          color: resolvedAxisLabelColor,
          fontSize: xLabelFontSize,
          margin: Math.max(8, Math.round(xLabelFontSize * 0.45)),
        },
        axisLine: { lineStyle: { color: splitLineColor } },
        axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
      };

  const defaultSeriesName = seriesName.trim() || messages.runtime?.defaultSeriesName || 'Value';

  return {
    backgroundColor: 'transparent',
    color: colors.series,
    graphic: hasData
      ? undefined
      : {
          type: 'text',
          left: 'center',
          top: '38%',
          silent: true,
          style: {
            text: messages.runtime?.emptyState || 'Add data points or bind a data series',
            fill: resolvedAxisLabelColor,
            opacity: 0.58,
            fontSize: xLabelFontSize,
          },
        },
    tooltip: {
      trigger: 'axis',
      // 仅显示「系列名: 值」，不重复展示横坐标类目/时间
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          marker?: string;
          seriesName?: string;
          value?: unknown;
          data?: unknown;
        }>;
        if (items.length === 0) return '';

        return items
          .map((item) => {
            const seriesName = (item.seriesName || '').trim() || defaultSeriesName;
            const yStr = resolveTooltipYValue(item.value ?? item.data);
            return `${item.marker ?? ''}${escapeHtml(seriesName)}: ${escapeHtml(yStr)}`;
          })
          .join('<br/>');
      },
    },
    legend: {
      show: showSeriesLegend,
      data: normalizedSeries.map(({ name }) => name.trim() || defaultSeriesName),
      top: Math.round(padding * 0.5),
      right: padding,
      left: 'auto',
      selectedMode: true,
      icon: 'roundRect',
      textStyle: { color: resolvedAxisLabelColor, fontSize: legendTextFontSize },
    },
    grid: {
      left: 10,
      right: 10,
      top: 10 + legendTopSpace,
      // containLabel already accounts for the X-axis labels. Adding the label
      // space here as well leaves an excessive blank area below the chart.
      bottom: 0,
      containLabel: true,
    },
    xAxis,
    yAxis: {
      show: showYAxis !== false,
      type: 'value',
      min: hasData ? undefined : 0,
      max: hasData ? undefined : 1,
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: resolvedAxisLabelColor, fontSize: yLabelFontSize },
      // 补充刻度展示属性
      axisLine: { show: true, lineStyle: { color: splitLineColor } },
      axisTick: { show: true, lineStyle: { color: splitLineColor } },
    },
    series: normalizedSeries.map(({ name, normalized }, index) => {
      const seriesColor = getSeriesColor(index);
      const seriesName = name.trim() || defaultSeriesName;
      const areaGradient = showArea
        ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withAlpha(seriesColor, 0.5) },
            { offset: 1, color: withAlpha(seriesColor, 0) },
          ])
        : undefined;

      return {
        type: 'line',
        name: seriesName,
        // Time points use value: [timeMs, y]. Axis tooltip otherwise lists both dimensions as separate rows
        // under the same series name (duplicate lines). Restrict tooltip to the Y dimension only.
        encode: isTimeSeries ? { x: 0, y: 1, tooltip: [1] } : undefined,
        data: buildSeriesData(normalized),
        smooth: smooth,
        // Keep sparse series inspectable, but avoid turning dense history into a field of dots.
        showSymbol:
          hasData && normalized.mode === 'category'
            ? normalized.categoryData.length <= 24
            : hasData && normalized.timeData.length <= 24,
        symbol: 'circle',
        symbolSize: Math.max(4, Math.round(6 * scale)),
        itemStyle: {
          color: '#ffffff',
          borderColor: seriesColor,
          borderWidth: 2,
        },
        lineStyle: {
          width: 2,
          color: seriesColor,
          opacity: hasData ? 1 : 0.35,
          type: hasData ? 'solid' : 'dashed',
        },
        areaStyle:
          showArea && hasData
            ? {
                color: areaGradient,
              }
            : undefined,
      };
    }),
  };
}

function renderChart(element: HTMLElement, props: Props, ctx: WidgetOverlayContext) {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.overflow = 'hidden';
  element.style.pointerEvents = 'auto';
  element.style.padding = `${WIDGET_INNER_PADDING}px`;

  const chartHost = document.createElement('div');
  chartHost.style.width = '100%';
  chartHost.style.height = '100%';
  element.appendChild(chartHost);

  let currentCtx = ctx;
  let currentProps = props;
  let colors: WidgetColors = resolveWidgetColors(element);
  let messages = getRuntimeMessages(ctx.locale);

  const chart = echarts.init(chartHost);
  chart.setOption(buildOption(currentProps, colors, messages, 1));

  const readChartHostSize = () => {
    const parentW = element.clientWidth || 300;
    const parentH = element.clientHeight || 200;
    const cw = chartHost.clientWidth || Math.max(80, parentW - WIDGET_INNER_PADDING * 2);
    const ch = chartHost.clientHeight || Math.max(48, parentH - WIDGET_INNER_PADDING * 2);
    return { cw, ch };
  };

  const scheduleResize = () => {
    try {
      requestAnimationFrame(() => {
        if (!chart.isDisposed()) {
          chart.resize();
          const { cw, ch } = readChartHostSize();
          const scale = computeScale(cw, ch);
          colors = resolveWidgetColors(element);
          chart.setOption(buildOption(currentProps, colors, messages, scale), {
            replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis', 'graphic', 'legend'],
          });
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
    themeObserver.observe(themeTarget, {
      attributes: true,
      attributeFilter: ['data-canvas-theme'],
    });
  }

  return {
    update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
      currentProps = nextProps;
      currentCtx = nextCtx;
      colors = resolveWidgetColors(element);
      messages = getRuntimeMessages(currentCtx.locale);

      scheduleResize();
    },
    destroy: () => {
      ro?.disconnect();
      themeObserver?.disconnect();
      chart.dispose();
      chartHost.remove();
    },
  };
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  sampleData: { data: STANDALONE_LINE_SERIES },
  standaloneDefaults: { data: STANDALONE_LINE_SERIES },
  previewDefaults: { data: STANDALONE_LINE_SERIES },
  controls,
  render: renderChart,
});

export default Main;
