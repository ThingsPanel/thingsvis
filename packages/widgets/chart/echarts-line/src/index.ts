import { resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';
/**
 * ECharts 折线图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

const LEGACY_DEFAULT_PRIMARY = '#6965db';
const CHART_PADDING = 16;
const TITLE_FONT_SIZE = 14;
const LEGEND_FONT_SIZE = 12;
const TITLE_LINE_HEIGHT = 18;
const LEGEND_BLOCK_HEIGHT = 20;
const TIME_RANGE_MS: Record<Exclude<Props['timeRangePreset'], 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

type CategoryPoint = { name: string; value: number | string };
type TimePoint = { timeMs: number; value: number; label: string };

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

function formatTimeLabel(timeMs: number, spanMs: number): string {
  const date = new Date(timeMs);
  if (!Number.isFinite(date.getTime())) return '';

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (spanMs <= 24 * 60 * 60 * 1000) {
    return `${hh}:${mm}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day} ${hh}:${mm}`;
}

function normalizeLineData(data: Props['data'], timeRangePreset: Props['timeRangePreset']) {
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
        value: String(record.value ?? record.y ?? ''),
      });
      return;
    }

    categoryPoints.push({
      name: `项 ${index + 1}`,
      value: String(entry ?? ''),
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
        timeSpanMs: filtered.length > 1
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
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
  const { title, titleAlign, data, primaryColor, showLegend, smooth, showArea, showXAxis, showYAxis, timeRangePreset } = props;

  const textColor = colors.fg;
  const splitLineColor = colors.axis;
  const seriesColor = pickSeriesColor(primaryColor, colors);
  const normalizedData = normalizeLineData(data, timeRangePreset);
  const padding = Math.round(CHART_PADDING * scale);
  const titleSpace = title ? Math.round(TITLE_LINE_HEIGHT * scale) + padding : 0;
  const legendSpace = showLegend ? Math.round(LEGEND_BLOCK_HEIGHT * scale) + padding : 0;
  const seriesName = title || '数值';
  const isTimeSeries = normalizedData.mode === 'time';
  const hasData = isTimeSeries
    ? normalizedData.timeData.length > 0
    : normalizedData.categoryData.length > 0;
  const xAxis: echarts.XAXisComponentOption = isTimeSeries ? {
    show: showXAxis !== false,
    type: 'time',
    axisLabel: {
      color: textColor,
      fontSize: Math.round(12 * scale),
      hideOverlap: true,
      formatter: (value: string | number) => formatTimeLabel(Number(value), normalizedData.timeSpanMs),
    },
    axisLine: { lineStyle: { color: splitLineColor } },
    axisTick: { show: true, lineStyle: { color: splitLineColor } },
  } : {
    show: showXAxis !== false,
    type: 'category',
    axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
    axisLine: { lineStyle: { color: splitLineColor } },
    axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
  };

  // 面积阴影渐变色（如果开启）
  const areaGradient = showArea ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: withAlpha(seriesColor, 0.5) },
    { offset: 1, color: withAlpha(seriesColor, 0) }
  ]) : undefined;

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
    dataset: !isTimeSeries && normalizedData.categoryData.length > 0 ? {
      dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: seriesName }],
      source: normalizedData.categoryData
    } : undefined,
    xAxis,
    yAxis: {
      show: showYAxis !== false,
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
      // 补充刻度展示属性
      axisLine: { show: true, lineStyle: { color: splitLineColor } },
      axisTick: { show: true, lineStyle: { color: splitLineColor } },
    },
    series: hasData ? [
      {
        type: 'line',
        name: seriesName,
        encode: isTimeSeries ? undefined : { x: 'name', y: 'value', tooltip: ['value'] },
        data: isTimeSeries
          ? normalizedData.timeData.map((point) => [point.timeMs, point.value])
          : undefined,
        smooth: smooth,
        showSymbol: false,
        itemStyle: {
          color: seriesColor,
        },
        lineStyle: {
          width: 3,
          color: seriesColor,
        },
        areaStyle: showArea ? {
          color: areaGradient,
        } : undefined,
      },
    ] : [],
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
  let colors: WidgetColors = resolveWidgetColors(element);

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
    element,
    update: (newCtx: WidgetOverlayContext) => {
      currentProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
      colors = resolveWidgetColors(element);

      // scheduleResize 处理比例缩放
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

/**
 * 插件主模块
 */
export const Main: WidgetMainModule = {
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  createOverlay,
};

export default Main;
