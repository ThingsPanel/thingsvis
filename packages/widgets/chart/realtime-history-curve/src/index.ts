import * as echarts from 'echarts';
import {
  defineWidget,
  resolveLocaleRecord,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { metadata } from './metadata';
import { controls } from './controls';
import { PropsSchema, type Props, type RealtimeHistoryConfig, type SeriesConfig } from './schema';
import {
  aggregationWindowFromApiError,
  appendRealtime,
  buildHistoryUrl,
  comparisonOffset,
  getTimeBounds,
  limitPoints,
  minimumWindowForData,
  normalizeHistoryResponse,
  parseApiErrorCode,
  normalizeBoundHistorySeries,
  normalizeTimestamp,
  resolveAggregation,
  WINDOW_MS,
  type TimePoint,
} from './history';
import zh from './locales/zh.json';
import en from './locales/en.json';

type RuntimeText = { runtime?: Record<string, string> };
type SeriesState = {
  key: string;
  points: TimePoint[];
  statPoints?: TimePoint[];
  comparison: TimePoint[];
  error?: string;
  comparisonError?: string;
};
const PREVIEW_SERIES_KEY = '__thingsvis_preview__';
const SERIES_COLORS = ['#6965db', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];

function createPreviewState(now = Date.now()): SeriesState {
  const pointCount = 36;
  const step = 2 * 60 * 1000;
  return {
    key: PREVIEW_SERIES_KEY,
    points: Array.from({ length: pointCount }, (_, index) => ({
      time: now - (pointCount - 1 - index) * step,
      value: Number(
        (52 + Math.sin(index / 3.2) * 8 + Math.cos(index / 7) * 4 + (index % 9 === 0 ? 3 : 0)).toFixed(2),
      ),
    })),
    comparison: [],
  };
}

function resolveSeriesStyle(
  config: RealtimeHistoryConfig,
  key: string,
  index: number,
): SeriesConfig {
  return (
    config.series[key] ?? {
      name: key,
      unit: '',
      decimals: 2,
      color: SERIES_COLORS[index % SERIES_COLORS.length]!,
      lineWidth: 2,
      curve: 'straight',
      showPoints: 'auto',
      pointSize: 5,
      areaFill: 'none',
      areaOpacity: 0.2,
      segmentColor: false,
      yAxisId: 'y0',
      hidden: false,
    }
  );
}

function seriesLabel(style: SeriesConfig, key: string): string {
  if (key === PREVIEW_SERIES_KEY) return '示例曲线';
  const label = String(style.name || key).trim() || key;
  return label.toLowerCase() === 'bound' ? '历史数据' : label;
}

function legendLabel(style: SeriesConfig, key: string): string {
  const label = seriesLabel(style, key);
  return style.unit ? `${label}（${style.unit}）` : label;
}

function runtimeText(locale?: string): Record<string, string> {
  return (resolveLocaleRecord({ zh, en }, locale) as RuntimeText).runtime ?? {};
}

function formatDate(value: number, format: string, span: number) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  const pattern =
    format === 'auto'
      ? span <= 86400000
        ? 'HH:mm'
        : span <= 2592000000
          ? 'MM-dd HH:mm'
          : 'yyyy-MM-dd'
      : format;
  return Object.entries(tokens).reduce(
    (result, [token, replacement]) => result.replace(token, replacement),
    pattern,
  );
}

function rgba(color: string, alpha: number) {
  const hex = color.replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const value = Number.parseInt(hex, 16);
    return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
  }
  return color;
}

function configuredColor(value: string, fallback: string): string {
  const normalized = String(value || '').trim();
  return !normalized || normalized === 'transparent' ? fallback : normalized;
}

function estimateStep(points: TimePoint[], config: RealtimeHistoryConfig) {
  const configured = WINDOW_MS[resolveAggregation(config.data).window] ?? 0;
  if (configured) return configured;
  if (points.length < 2) return 60000;
  const gaps = points
    .slice(1)
    .map((point, index) => point.time - points[index]!.time)
    .filter((gap) => gap > 0)
    .sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] ?? 60000;
}

function processNulls(
  points: TimePoint[],
  config: RealtimeHistoryConfig,
): Array<[number, number | null]> {
  const mode = config.analysis.nullHandling;
  const normalized = points.map((point, index): TimePoint => {
    if (point.value !== null || mode === 'break' || mode === 'connect') return point;
    if (mode === 'zero') return { ...point, value: 0 };
    const previous = points
      .slice(0, index)
      .reverse()
      .find((item) => item.value !== null);
    if (mode === 'previous') return { ...point, value: previous?.value ?? null };
    const next = points.slice(index + 1).find((item) => item.value !== null);
    if (!previous || !next || next.time - previous.time > config.analysis.interpolationMaxGapMs)
      return point;
    const ratio = (point.time - previous.time) / (next.time - previous.time);
    return { ...point, value: previous.value! + (next.value! - previous.value!) * ratio };
  });
  if (normalized.length < 2) return normalized.map((point) => [point.time, point.value]);
  const step = estimateStep(points, config);
  const result: Array<[number, number | null]> = [];
  normalized.forEach((point, index) => {
    const previous = normalized[index - 1];
    if (previous && point.time - previous.time > step * 1.5) {
      if (
        mode === 'break' ||
        (mode === 'linear' && point.time - previous.time > config.analysis.interpolationMaxGapMs)
      )
        result.push([previous.time + step, null]);
      if (mode === 'zero') {
        result.push([previous.time + step, 0]);
        result.push([point.time - 1, 0]);
      }
      if (mode === 'previous') result.push([point.time - 1, previous.value]);
    }
    result.push([point.time, point.value]);
  });
  return result;
}

export function buildChartOption(
  config: RealtimeHistoryConfig,
  states: SeriesState[],
  colors: ReturnType<typeof resolveWidgetColors>,
  fixedTimeBounds = true,
): echarts.EChartsOption {
  const bounds = getTimeBounds(config.data);
  const span = Math.max(1, bounds.end - bounds.start);
  const axisIndex = new Map(config.yAxes.map((axis, index) => [axis.id, index]));
  const seriesStyles = new Map(
    config.data.metricKeys.map((key, index) => [key, resolveSeriesStyle(config, key, index)]),
  );
  const legendKeys = states.some((state) => state.key === PREVIEW_SERIES_KEY)
    ? [PREVIEW_SERIES_KEY]
    : config.data.metricKeys.length
      ? config.data.metricKeys
      : states.map((state) => state.key);
  const inferredAxisUnits = new Map<string, string>();
  states.forEach((state, stateIndex) => {
    const style = seriesStyles.get(state.key) ?? resolveSeriesStyle(config, state.key, stateIndex);
    if (style.unit && !inferredAxisUnits.has(style.yAxisId))
      inferredAxisUnits.set(style.yAxisId, style.unit);
  });
  const series: any[] = [];
  const visualMap: any[] = [];
  states.forEach((state, stateIndex) => {
    const style = seriesStyles.get(state.key) ?? resolveSeriesStyle(config, state.key, stateIndex);
    const yAxisIndex = axisIndex.get(style.yAxisId) ?? 0;
    const thresholds = config.analysis.thresholds.filter((item) => item.yAxisId === style.yAxisId);
    const lineData = processNulls(state.points, config);
    const areaStyle =
      style.areaFill === 'none'
        ? undefined
        : style.areaFill === 'gradient'
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: rgba(style.color, style.areaOpacity) },
                { offset: 1, color: rgba(style.color, 0) },
              ]),
            }
          : { color: rgba(style.color, style.areaOpacity) };
    const curve = style.curve;
    series.push({
      id: state.key,
      name: seriesLabel(style, state.key),
      type: 'line',
      yAxisIndex,
      data: lineData,
      smooth: curve === 'smooth',
      step: curve.startsWith('step-') ? curve.replace('step-', '') : false,
      connectNulls: config.analysis.nullHandling !== 'break',
      showSymbol:
        style.showPoints === 'show' || (style.showPoints === 'auto' && state.points.length <= 30),
      symbolSize: style.pointSize,
      lineStyle: { color: style.color, width: style.lineWidth },
      itemStyle: { color: style.color },
      areaStyle,
      markLine: thresholds.length
        ? {
            silent: true,
            data: thresholds.map((item) => ({
              name: item.name,
              yAxis: item.value,
              label: { show: item.showValue, formatter: `${item.name}: ${item.value}` },
              lineStyle: { color: item.color, type: item.lineStyle, width: item.lineWidth },
            })),
          }
        : undefined,
    });
    if (style.segmentColor && thresholds.some((item) => item.colorBreached)) {
      const pieces = thresholds
        .filter((item) => item.colorBreached)
        .map((item) => {
          if (item.operator === '>') return { gt: item.value, color: item.color };
          if (item.operator === '>=') return { gte: item.value, color: item.color };
          if (item.operator === '<') return { lt: item.value, color: item.color };
          if (item.operator === '<=') return { lte: item.value, color: item.color };
          return { gte: item.value, lte: item.value, color: item.color };
        });
      visualMap.push({
        show: false,
        seriesIndex: series.length - 1,
        dimension: 1,
        pieces,
        outOfRange: { color: style.color },
      });
    }
    if (state.comparison.length)
      series.push({
        id: `${state.key}:comparison`,
        name: `${seriesLabel(style, state.key)}（同期）`,
        type: 'line',
        yAxisIndex,
        data: state.comparison.map((point) => [
          point.time +
            comparisonOffset(config.analysis.comparison, span, config.analysis.comparisonOffsetMs),
          point.value,
        ]),
        smooth: curve === 'smooth',
        step: curve.startsWith('step-') ? curve.replace('step-', '') : false,
        showSymbol: false,
        lineStyle: {
          color: style.color,
          width: Math.max(1, style.lineWidth - 0.5),
          type: 'dashed',
          opacity: 0.55,
        },
      });
    void stateIndex;
  });
  const legendPosition = config.analysis.legend.position;
  const storedLayout = (config as unknown as { layout?: Partial<RealtimeHistoryConfig['layout']> })
    .layout;
  const storedStyle = (config as unknown as { style?: Partial<RealtimeHistoryConfig['style']> })
    .style;
  const layoutConfig = {
    marginMode: 'auto' as const,
    top: 40,
    right: 16,
    bottom: 16,
    left: 16,
    ...(storedLayout ?? {}),
  };
  const styleConfig = {
    axisLabelColor: '',
    xAxisFontSize: 12,
    yAxisFontSize: 12,
    axisTitleColor: '',
    axisTitleFontSize: 12,
    legendColor: '',
    legendFontSize: 12,
    axisLineColor: '',
    gridLineColor: '',
    ...(storedStyle ?? {}),
  };
  const axisLabelColor = configuredColor(styleConfig.axisLabelColor, colors.fg);
  const axisTitleColor = configuredColor(styleConfig.axisTitleColor, axisLabelColor);
  const legendColor = configuredColor(styleConfig.legendColor, colors.fg);
  const axisLineColor = configuredColor(styleConfig.axisLineColor, colors.axis);
  const gridLineColor = configuredColor(styleConfig.gridLineColor, colors.axis);
  const leftAxisCount = config.yAxes.filter((axis) => axis.position === 'left').length;
  const rightAxisCount = config.yAxes.filter((axis) => axis.position === 'right').length;
  const xAxisTitleReserve =
    config.xAxis.show && config.xAxis.title.trim() ? styleConfig.axisTitleFontSize + 4 : 0;
  const rotatedLabelReserve =
    config.xAxis.show && config.xAxis.labelRotation > 0
      ? Math.ceil(
          Math.sin((config.xAxis.labelRotation * Math.PI) / 180) *
            Math.min(36, styleConfig.xAxisFontSize * 2),
        )
      : 0;
  const bottomLegendReserve =
    legendPosition === 'bottom' && config.analysis.legend.show
      ? styleConfig.legendFontSize + 16
      : 0;
  const automaticGrid = {
    left: 16 + Math.max(0, leftAxisCount - 1) * 48 + (legendPosition === 'left' ? 72 : 0),
    right: 16 + Math.max(0, rightAxisCount - 1) * 48 + (legendPosition === 'right' ? 72 : 0),
    top: legendPosition === 'top' && config.analysis.legend.show ? 40 : 16,
    bottom: 8 + xAxisTitleReserve + rotatedLabelReserve + bottomLegendReserve,
  };
  const gridMargins =
    layoutConfig.marginMode === 'custom'
      ? {
          top: Math.max(layoutConfig.top, automaticGrid.top),
          right: layoutConfig.right,
          bottom: layoutConfig.bottom,
          left: layoutConfig.left,
        }
      : automaticGrid;
  return {
    animation: states.reduce((sum, state) => sum + state.points.length, 0) < 2000,
    backgroundColor: 'transparent',
    color: colors.series,
    grid: {
      ...gridMargins,
      containLabel: true,
    },
    legend: {
      show: config.analysis.legend.show,
      selectedMode: config.analysis.legend.filterable,
      top: legendPosition === 'top' ? 6 : undefined,
      bottom: legendPosition === 'bottom' ? 4 : undefined,
      left: legendPosition === 'left' ? 4 : legendPosition === 'right' ? undefined : 'center',
      right: legendPosition === 'right' ? 4 : undefined,
      orient: legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal',
      textStyle: { color: legendColor, fontSize: styleConfig.legendFontSize },
      selected: Object.fromEntries(
        legendKeys.map((key, index) => {
          const style = seriesStyles.get(key) ?? resolveSeriesStyle(config, key, index);
          return [seriesLabel(style, key), !style.hidden];
        }),
      ),
      formatter: (name: string) => {
        const entry = legendKeys.find(
          (key) =>
            seriesLabel(
              seriesStyles.get(key) ?? resolveSeriesStyle(config, key, legendKeys.indexOf(key)),
              key,
            ) === name,
        );
        if (!entry) return name === 'bound' ? '历史数据' : name;
        return legendLabel(
          seriesStyles.get(entry) ?? resolveSeriesStyle(config, entry, legendKeys.indexOf(entry)),
          entry,
        );
      },
    },
    tooltip: {
      show: config.analysis.tooltip.show,
      trigger: config.analysis.tooltip.trigger,
      axisPointer: {
        type: config.analysis.tooltip.crosshair ? 'cross' : 'line',
        // The tooltip already contains the formatted timestamp and values. ECharts' extra
        // axis-pointer labels sit directly on top of the axis labels and become unreadable.
        label: { show: false },
      },
      formatter: (rawParams: any) => {
        const params = Array.isArray(rawParams) ? rawParams : [rawParams];
        const sorted = [...params].sort((left, right) => {
          if (config.analysis.tooltip.sort === 'valueAsc')
            return Number(left.value?.[1] ?? left.value) - Number(right.value?.[1] ?? right.value);
          if (config.analysis.tooltip.sort === 'valueDesc')
            return Number(right.value?.[1] ?? right.value) - Number(left.value?.[1] ?? left.value);
          return Number(left.seriesIndex ?? 0) - Number(right.seriesIndex ?? 0);
        });
        const timestamp = Number(sorted[0]?.value?.[0] ?? sorted[0]?.axisValue);
        const rows = sorted.map((item) => {
          const key = String(item.seriesId || '').replace(/:comparison$/, '');
          const style = seriesStyles.get(key);
          const numeric = Number(item.value?.[1] ?? item.value);
          const value = Number.isFinite(numeric) ? numeric.toFixed(style?.decimals ?? 2) : '-';
          const unit = config.analysis.tooltip.showUnit && style?.unit ? ` ${style.unit}` : '';
          const label = style ? seriesLabel(style, key) : item.seriesName || key;
          return `${item.marker || ''}${label}: ${value}${unit}`;
        });
        if (config.analysis.tooltip.showTime && Number.isFinite(timestamp))
          rows.unshift(formatDate(timestamp, config.xAxis.timeFormat, span));
        return rows.join('<br/>');
      },
    },
    toolbox: { show: false },
    dataZoom: config.xAxis.zoom
      ? [{ type: 'inside', zoomOnMouseWheel: true, moveOnMouseMove: config.xAxis.pan }]
      : [],
    xAxis: {
      type: 'time',
      min: fixedTimeBounds ? bounds.start : undefined,
      max: fixedTimeBounds ? bounds.end : undefined,
      show: config.xAxis.show,
      name: config.xAxis.title,
      nameLocation: 'middle',
      nameGap: styleConfig.xAxisFontSize + 14,
      nameTextStyle: {
        color: axisTitleColor,
        fontSize: styleConfig.axisTitleFontSize,
      },
      axisLabel: {
        color: axisLabelColor,
        fontSize: styleConfig.xAxisFontSize,
        rotate: config.xAxis.labelRotation,
        hideOverlap: true,
        formatter: (value: number) => formatDate(value, config.xAxis.timeFormat, span),
      },
      minInterval:
        config.xAxis.labelStrategy === 'interval'
          ? WINDOW_MS[config.xAxis.labelInterval]
          : undefined,
      interval:
        config.xAxis.labelStrategy === 'interval'
          ? WINDOW_MS[config.xAxis.labelInterval]
          : undefined,
      splitNumber: config.xAxis.labelStrategy === 'count' ? config.xAxis.labelCount : undefined,
      axisTick: { show: config.xAxis.showTicks, lineStyle: { color: axisLineColor } },
      axisLine: { show: config.xAxis.showAxisLine, lineStyle: { color: axisLineColor } },
      splitLine: { show: config.xAxis.showGrid, lineStyle: { color: gridLineColor } },
    },
    yAxis: config.yAxes.map((axis, index) => {
      const axisUnit = axis.unit || inferredAxisUnits.get(axis.id) || '';
      return {
        id: axis.id,
        type: 'value',
        name: axis.title || axisUnit,
        nameTextStyle: {
          color: axisTitleColor,
          fontSize: styleConfig.axisTitleFontSize,
        },
        position: axis.position,
        offset:
          config.yAxes.slice(0, index).filter((item) => item.position === axis.position).length *
          48,
        min: axis.minMode === 'fixed' ? axis.min : undefined,
        max: axis.maxMode === 'fixed' ? axis.max : undefined,
        splitNumber: axis.tickMode === 'split' ? axis.splitNumber : undefined,
        interval: axis.tickMode === 'interval' ? axis.interval : undefined,
        axisLabel: {
          color: axisLabelColor,
          fontSize: styleConfig.yAxisFontSize,
          formatter: (value: number) => value.toFixed(axis.decimals),
        },
        axisTick: { show: axis.showTicks, lineStyle: { color: axisLineColor } },
        axisLine: { show: axis.showAxisLine, lineStyle: { color: axisLineColor } },
        splitLine: { show: axis.showGrid, lineStyle: { color: gridLineColor } },
      };
    }),
    visualMap,
    series,
  };
}

function render(element: HTMLElement, initialProps: Props, initialCtx: WidgetOverlayContext) {
  element.style.cssText =
    'width:100%;height:100%;position:relative;overflow:hidden;pointer-events:auto';
  const chartHost = document.createElement('div');
  chartHost.style.cssText = 'position:absolute;inset:0';
  element.appendChild(chartHost);
  const title = document.createElement('div');
  title.style.cssText =
    'position:absolute;left:12px;top:8px;right:128px;z-index:4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none';
  element.appendChild(title);
  const status = document.createElement('div');
  status.style.cssText =
    'position:absolute;left:12px;top:10px;z-index:4;max-width:calc(100% - 24px);max-height:2.8em;overflow:hidden;overflow-wrap:anywhere;font:12px/1.4 system-ui;color:#888;pointer-events:none';
  element.appendChild(status);
  const rangeSelect = document.createElement('select');
  rangeSelect.className = 'tv-history-range';
  rangeSelect.setAttribute('aria-label', '历史曲线时间范围');
  Object.assign(rangeSelect.style, {
    position: 'absolute', right: '12px', top: '6px', zIndex: '5',
    width: '120px', maxWidth: 'calc(100% - 24px)', height: '30px',
    boxSizing: 'border-box', paddingTop: '0', paddingBottom: '0',
    paddingLeft: '16px', paddingRight: '38px', appearance: 'none',
    border: '1px solid var(--w-surface-border,rgba(130,145,165,.35))',
    borderRadius: '18px', background: 'var(--w-surface,rgba(255,255,255,.12))',
    backdropFilter: 'blur(12px)', color: 'var(--w-text-primary,var(--w-fg,#263345))',
    font: '12px system-ui', cursor: 'pointer',
  });
  const rangeLabels: Array<[RealtimeHistoryConfig['data']['timeRange'], string, string]> = [
    ['last_5m', '最近 5 分钟', 'Last 5 minutes'],
    ['last_15m', '最近 15 分钟', 'Last 15 minutes'],
    ['last_30m', '最近 30 分钟', 'Last 30 minutes'],
    ['last_1h', '最近 1 小时', 'Last 1 hour'],
    ['last_3h', '最近 3 小时', 'Last 3 hours'],
    ['last_6h', '最近 6 小时', 'Last 6 hours'],
    ['last_12h', '最近 12 小时', 'Last 12 hours'],
    ['last_24h', '最近 24 小时', 'Last 24 hours'],
    ['last_3d', '最近 3 天', 'Last 3 days'],
    ['last_7d', '最近 7 天', 'Last 7 days'],
    ['last_15d', '最近 15 天', 'Last 15 days'],
    ['last_30d', '最近 30 天', 'Last 30 days'],
    ['last_60d', '最近 60 天', 'Last 60 days'],
    ['last_90d', '最近 90 天', 'Last 90 days'],
    ['last_6m', '最近 6 个月', 'Last 6 months'],
    ['last_1y', '最近 1 年', 'Last 1 year'],
    ['custom', '自定义', 'Custom'],
  ];
  element.appendChild(rangeSelect);
  const rangeThemeStyle = document.createElement('style');
  rangeThemeStyle.textContent =
    '[data-canvas-theme="frost"] .tv-history-range{background:rgba(255,255,255,.16)!important;border-color:rgba(255,255,255,.17)!important}.tv-history-range option{color:#1f2937;background:#fff}';
  element.appendChild(rangeThemeStyle);
  const rangeArrow = document.createElement('span');
  rangeArrow.setAttribute('aria-hidden', 'true');
  rangeArrow.style.cssText =
    'position:absolute;right:28px;top:16px;z-index:6;width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);pointer-events:none;color:var(--w-text-primary,var(--w-fg,#263345))';
  element.appendChild(rangeArrow);
  const customPanel = document.createElement('div');
  customPanel.style.cssText =
    'position:absolute;right:10px;top:36px;z-index:6;display:none;width:min(260px,calc(100% - 20px));padding:10px;box-sizing:border-box;border:1px solid var(--w-surface-border,#cbd3df);border-radius:8px;background:var(--w-surface,#fff);color:var(--w-text-primary,var(--w-fg,#263345));box-shadow:0 4px 16px rgba(0,0,0,.18);font:12px system-ui';
  const startInput = document.createElement('input');
  const endInput = document.createElement('input');
  for (const input of [startInput, endInput]) {
    input.type = 'datetime-local';
    input.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:4px 0 8px;padding:4px;border:1px solid var(--w-surface-border,#cbd3df);border-radius:4px;background:var(--w-surface,#fff);color:var(--w-text-primary,var(--w-fg,#263345))';
  }
  const startLabel = document.createElement('label');
  const endLabel = document.createElement('label');
  startLabel.appendChild(startInput);
  endLabel.appendChild(endInput);
  const customError = document.createElement('div');
  customError.style.cssText = 'color:#bd3030;min-height:16px';
  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.style.cssText = 'padding:4px 10px;border:0;border-radius:4px;background:#4f63d9;color:#fff;cursor:pointer';
  customPanel.append(startLabel, endLabel, customError, applyButton);
  const setStatus = (message: string, noData = false) => {
    status.textContent = message;
    status.style.left = noData ? '50%' : '12px';
    const headerHeight = props.config.header.show
      ? Math.max(40, Math.ceil(props.config.header.fontSize * 1.35) + 12)
      : props.data === undefined ? 40 : 0;
    status.style.top = noData ? `calc(50% + ${headerHeight / 2}px)` : `${headerHeight + 32}px`;
    status.style.transform = noData ? 'translate(-50%, -50%)' : '';
    status.style.textAlign = noData ? 'center' : '';
  };
  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.style.cssText =
    'position:absolute;right:74px;top:6px;z-index:5;height:26px;padding:0 10px;border:1px solid #d8d8df;border-radius:5px;background:rgba(255,255,255,.9);font:12px system-ui;cursor:pointer';
  element.appendChild(exportButton);
  element.appendChild(customPanel);
  const chart = echarts.init(chartHost);
  // Dashboard nodes may persist only the fields edited by the user.  The host
  // merges widget defaults shallowly, so nested config objects such as
  // `analysis` and `xAxis` can otherwise miss their array/enum defaults at
  // runtime.  Parse here as the final boundary before rendering.
  let props = PropsSchema.parse(initialProps);
  let ctx = initialCtx;
  let states: SeriesState[] = [];
  let controller: AbortController | null = null;
  let queryKey = '';
  let destroyed = false;
  let rangeOverride: RealtimeHistoryConfig['data'] | null = null;
  const activeConfig = (): RealtimeHistoryConfig => {
    const data = { ...props.config.data, ...rangeOverride };
    const runtimeDeviceId = ctx.variables?.deviceId;
    if (
      data.deviceId === '__template__' &&
      typeof runtimeDeviceId === 'string' &&
      runtimeDeviceId.trim() &&
      runtimeDeviceId !== '__template__'
    ) {
      data.deviceId = runtimeDeviceId;
    }
    return { ...props.config, data };
  };
  const sizeRangeControl = () => {
    const label = rangeSelect.selectedOptions[0]?.textContent ?? '';
    const textWidth = Array.from(label).reduce(
      (width, character) => width + (character.charCodeAt(0) > 255 ? 12 : 6), 0,
    );
    const width = Math.max(98, Math.min(144, textWidth + 52));
    rangeSelect.style.width = `${width}px`;
    title.style.right = props.data === undefined ? `${width + 24}px` : '12px';
  };
  const syncRangeControl = () => {
    const english = String(ctx.locale).toLowerCase().startsWith('en');
    rangeSelect.replaceChildren();
    const configured = activeConfig().data.timeRange;
    if (!rangeLabels.some(([value]) => value === configured)) {
      const option = new Option(english ? 'Configured range' : '当前配置时间', configured);
      option.style.color = '#1f2937';
      option.style.backgroundColor = '#fff';
      rangeSelect.add(option);
    }
    for (const [value, zhLabel, enLabel] of rangeLabels) {
      const option = new Option(english ? enLabel : zhLabel, value);
      option.style.color = '#1f2937';
      option.style.backgroundColor = '#fff';
      rangeSelect.add(option);
    }
    rangeSelect.value = configured;
    sizeRangeControl();
    rangeSelect.style.display = props.data === undefined ? '' : 'none';
    rangeArrow.style.display = props.data === undefined ? '' : 'none';
    customPanel.style.display = 'none';
    startLabel.replaceChildren(document.createTextNode(english ? 'Start' : '开始时间'), startInput);
    endLabel.replaceChildren(document.createTextNode(english ? 'End' : '结束时间'), endInput);
    applyButton.textContent = english ? 'Apply' : '应用';
  };

  const draw = () => {
    if (!destroyed) {
      const colors = resolveWidgetColors(element);
      title.textContent = props.config.header.title.trim() || (String(ctx.locale).toLowerCase().startsWith('en') ? 'History curve' : '历史曲线');
      title.style.display = props.config.header.show ? '' : 'none';
      title.style.color = colors.textPrimary;
      title.style.font = `600 ${props.config.header.fontSize}px/1.35 system-ui`;
      const headerHeight = props.config.header.show
        ? Math.max(40, Math.ceil(props.config.header.fontSize * 1.35) + 12)
        : props.data === undefined ? 40 : 0;
      chartHost.style.top = `${headerHeight}px`;
      chart.resize();
      chart.setOption(buildChartOption(
        activeConfig(), states, resolveWidgetColors(element),
        props.data === undefined && activeConfig().data.deviceId !== '__template__',
      ), {
        notMerge: true,
      });
    }
  };
  const getRuntime = () => ({
    base: String(ctx.variables?.platformApiBaseUrl || '/proxy-default'),
    token: String(ctx.variables?.platformToken || ''),
  });
  const fetchMetric = async (
    key: string,
    start?: number,
    end?: number,
    exportFile = false,
    useLoadSignal = true,
  ) => {
    const runtime = getRuntime();
    let aggregationWindow: string | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(
        buildHistoryUrl(runtime.base, activeConfig().data, key, {
          start,
          end,
          export: exportFile,
          aggregationWindow,
        }),
        {
          signal: useLoadSignal ? controller?.signal : undefined,
          headers: runtime.token ? { 'x-token': runtime.token } : {},
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const code = parseApiErrorCode(payload);
      if (!code || code === 200) return normalizeHistoryResponse(payload);

      const serverWindow =
        aggregationWindowFromApiError(payload) ??
        (code === 207001 ? minimumWindowForData(activeConfig().data) : undefined);
      if (
        (code === 207001 || code === 207004) &&
        serverWindow &&
        serverWindow !== aggregationWindow
      ) {
        aggregationWindow = serverWindow;
        continue;
      }

      const message =
        typeof (payload as Record<string, unknown>)?.message === 'string'
          ? (payload as Record<string, string>).message
          : `API ${code}`;
      throw new Error(message);
    }
    throw new Error('历史数据查询失败：聚合窗口无法满足后端限制');
  };

  const load = async (showLoading = true) => {
    const text = runtimeText(ctx.locale);
    const config = activeConfig();
    const runtime = getRuntime();
    exportButton.textContent = text.export || '导出 CSV';
    exportButton.style.display = 'none';
    if (props.data !== undefined) {
      controller?.abort();
      states = normalizeBoundHistorySeries(props.data, config.data.metricKeys).map((series) => ({
        key: series.key,
        points: limitPoints(series.points, config.data.maxDataPoints),
        statPoints: series.points,
        comparison: [],
      }));
      const hasData = states.some((item) => item.points.length > 0);
      setStatus(hasData ? '' : text.noData || '当前时间范围内没有数据', !hasData);
      draw();
      return;
    }
    if (config.data.deviceId === '__template__') {
      controller?.abort();
      states = [createPreviewState()];
      setStatus('');
      draw();
      return;
    }
    if (!config.data.deviceId || !config.data.metricKeys.length) {
      states =
        !config.data.deviceId && config.data.metricKeys.length === 0 ? [createPreviewState()] : [];
      setStatus(states.length > 0 ? '' : text.empty || '请选择设备和指标字段');
      draw();
      return;
    }
    if (!runtime.base || !runtime.token) {
      setStatus(text.noVariables || '平台 API 地址或令牌不可用');
      return;
    }
    controller?.abort();
    controller = new AbortController();
    if (showLoading) setStatus(text.loading || '正在查询历史数据…');
    const bounds = getTimeBounds(config.data);
    const offset = comparisonOffset(
      config.analysis.comparison,
      bounds.end - bounds.start,
      config.analysis.comparisonOffsetMs,
    );
    const results = await Promise.all(
      config.data.metricKeys.map(async (key): Promise<SeriesState> => {
        try {
          const current = await fetchMetric(key);
          let comparison: TimePoint[] = [];
          let comparisonError: string | undefined;
          if (offset && current.end > current.start) {
            try {
              const result = await fetchMetric(key, current.start - offset, current.end - offset);
              comparison = limitPoints(result.points, config.data.maxDataPoints);
            } catch (error) {
              if ((error as Error).name === 'AbortError') throw error;
              comparisonError = error instanceof Error ? error.message : String(error);
            }
          }
          return {
            key,
            points: limitPoints(current.points, config.data.maxDataPoints),
            statPoints: current.points,
            comparison,
            comparisonError,
          };
        } catch (error) {
          if ((error as Error).name === 'AbortError') throw error;
          return {
            key,
            points: [],
            statPoints: [],
            comparison: [],
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );
    states = results;
    const noData = results.every((item) => item.points.length === 0) &&
      !results.some((item) => item.error || item.comparisonError);
    setStatus(results.every((item) => item.error)
      ? `${text.error || '查询失败'}：${results[0]?.error}`
      : results.some((item) => item.error)
        ? '部分指标查询失败'
        : results.some((item) => item.comparisonError)
          ? '当前数据已加载，部分同期数据查询失败'
          : results.every((item) => item.points.length === 0)
            ? text.noData || '当前时间范围内没有数据'
            : '', noData);
    draw();
  };

  const refresh = () => {
    const nextKey = JSON.stringify({
      boundData: props.data,
      data: activeConfig().data,
      comparison: props.config.analysis.comparison,
      offset: props.config.analysis.comparisonOffsetMs,
      variables: getRuntime(),
    });
    if (nextKey !== queryKey) {
      queryKey = nextKey;
      void load().catch((error) => {
        if ((error as Error).name !== 'AbortError')
          setStatus(`${runtimeText(ctx.locale).error || '查询失败'}：${error instanceof Error ? error.message : String(error)}`);
      });
    } else draw();
  };

  const toLocalInput = (timestamp: number) => {
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime())
      ? new Date(timestamp - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
  };
  rangeSelect.onchange = () => {
    sizeRangeControl();
    if (rangeSelect.value === 'custom') {
      const current = activeConfig().data;
      const bounds = getTimeBounds(current);
      startInput.value = toLocalInput(bounds.start);
      endInput.value = toLocalInput(bounds.end);
      customError.textContent = '';
      customPanel.style.display = 'block';
      return;
    }
    customPanel.style.display = 'none';
    rangeOverride = { ...props.config.data, timeRange: rangeSelect.value as RealtimeHistoryConfig['data']['timeRange'] };
    refresh();
  };
  applyButton.onclick = () => {
    const start = new Date(startInput.value).getTime();
    const end = new Date(endInput.value).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      customError.textContent = String(ctx.locale).toLowerCase().startsWith('en')
        ? 'End must be after start'
        : '结束时间必须晚于开始时间';
      return;
    }
    rangeOverride = { ...props.config.data, timeRange: 'custom', startTime: start, endTime: end };
    customPanel.style.display = 'none';
    sizeRangeControl();
    refresh();
  };
  customPanel.onkeydown = (event) => {
    if (event.key === 'Escape') {
      customPanel.style.display = 'none';
      rangeSelect.value = activeConfig().data.timeRange;
      sizeRangeControl();
      rangeSelect.focus();
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (!props.config.data.realtimeAppend || activeConfig().data.timeRange === 'custom') return;
    const message = event.data as { type?: string; payload?: Record<string, any> };
    if (!['tv:platform-data', 'thingsvis:platform-data'].includes(message?.type || '')) return;
    const payload = message.payload ?? {};
    if (payload.deviceId && payload.deviceId !== activeConfig().data.deviceId) return;
    const updates: Array<{ key: string; value: unknown; time: unknown }> = [];
    if (payload.fieldId)
      updates.push({ key: payload.fieldId, value: payload.value, time: payload.timestamp });
    if (payload.fields && typeof payload.fields === 'object')
      Object.entries(payload.fields).forEach(([key, value]) =>
        updates.push({ key, value, time: payload.timestamp }),
      );
    let changed = false;
    updates.forEach((update) => {
      const state =
        states.find((item) => item.key === update.key) ??
        (props.data !== undefined && states.length === 1 && !props.config.data.metricKeys.length
          ? states[0]
          : undefined);
      const value = Number(update.value);
      const time = normalizeTimestamp(update.time);
      if (!state || !Number.isFinite(value)) return;
      if (props.data !== undefined) {
        state.points = appendRealtime(state.points, { time, value }, props.config.data.maxDataPoints);
      } else {
        state.statPoints = appendRealtime(state.statPoints ?? state.points,
          { time, value }, Number.MAX_SAFE_INTEGER);
      }
      changed = true;
    });
    if (changed) {
      if (props.data === undefined) {
        const { start, end } = getTimeBounds(activeConfig().data);
        states.forEach((state) => {
          state.statPoints = (state.statPoints ?? state.points)
            .filter((point) => point.time >= start && point.time <= end);
          state.points = limitPoints(state.statPoints, props.config.data.maxDataPoints);
        });
      }
      draw();
    }
  };
  window.addEventListener('message', onMessage);

  exportButton.onclick = async () => {
    exportButton.disabled = true;
    try {
      const files = await Promise.all(
        props.config.data.metricKeys.map((key) =>
          fetchMetric(key, undefined, undefined, true, false),
        ),
      );
      files.forEach((file) => {
        if (!file.filePath) return;
        const anchor = document.createElement('a');
        const base = getRuntime().base.replace(/\/$/, '');
        anchor.href = file.filePath.startsWith('http')
          ? file.filePath
          : `${base}/${file.filePath.replace(/\\/g, '/')}`;
        anchor.download = file.fileName || '';
        anchor.click();
      });
    } catch (error) {
      setStatus(`导出失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      exportButton.disabled = false;
    }
  };
  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => chart.resize()) : null;
  resizeObserver?.observe(element);
  syncRangeControl();
  refresh();
  const refreshTimer = window.setInterval(() => {
    const config = activeConfig();
    if (destroyed || props.data !== undefined || !config.data.realtimeAppend ||
      config.data.timeRange === 'custom' ||
      !config.data.deviceId || !config.data.metricKeys.length || !getRuntime().token) return;
    void load(false).catch((error) => {
      if ((error as Error).name !== 'AbortError')
        setStatus(`${runtimeText(ctx.locale).error || '查询失败'}：${error instanceof Error ? error.message : String(error)}`);
    });
  }, 60000);
  return {
    update(nextProps: Props, nextCtx: WidgetOverlayContext) {
      const previousData = props.config.data;
      props = PropsSchema.parse(nextProps);
      ctx = nextCtx;
      if (JSON.stringify(props.config.data) !== JSON.stringify(previousData)) rangeOverride = null;
      syncRangeControl();
      refresh();
    },
    destroy() {
      destroyed = true;
      window.clearInterval(refreshTimer);
      controller?.abort();
      resizeObserver?.disconnect();
      window.removeEventListener('message', onMessage);
      chart.dispose();
      element.replaceChildren();
    },
  };
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render,
});
export default Main;
