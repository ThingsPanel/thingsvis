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
  appendRealtime,
  buildHistoryUrl,
  comparisonOffset,
  getTimeBounds,
  limitPoints,
  normalizeHistoryResponse,
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
const SERIES_COLORS = ['#6965db', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];

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
): echarts.EChartsOption {
  const bounds = getTimeBounds(config.data);
  const span = Math.max(1, bounds.end - bounds.start);
  const axisIndex = new Map(config.yAxes.map((axis, index) => [axis.id, index]));
  const seriesStyles = new Map(
    config.data.metricKeys.map((key, index) => [key, resolveSeriesStyle(config, key, index)]),
  );
  const series: any[] = [];
  const visualMap: any[] = [];
  states.forEach((state, stateIndex) => {
    const style = seriesStyles.get(state.key)!;
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
      name: style.name || state.key,
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
        name: `${style.name || state.key}（同期）`,
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
          top: layoutConfig.top,
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
        config.data.metricKeys.map((key) => {
          const style = seriesStyles.get(key)!;
          return [style.name || key, !style.hidden];
        }),
      ),
      formatter: (name: string) => name,
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
          return `${item.marker || ''}${item.seriesName}: ${value}${unit}`;
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
    yAxis: config.yAxes.map((axis, index) => ({
      id: axis.id,
      type: 'value',
      name: axis.title || axis.unit,
      nameTextStyle: {
        color: axisTitleColor,
        fontSize: styleConfig.axisTitleFontSize,
      },
      position: axis.position,
      offset:
        config.yAxes.slice(0, index).filter((item) => item.position === axis.position).length * 48,
      min: axis.minMode === 'fixed' ? axis.min : undefined,
      max: axis.maxMode === 'fixed' ? axis.max : undefined,
      splitNumber: axis.tickMode === 'split' ? axis.splitNumber : undefined,
      interval: axis.tickMode === 'interval' ? axis.interval : undefined,
      axisLabel: {
        color: axisLabelColor,
        fontSize: styleConfig.yAxisFontSize,
        formatter: (value: number) =>
          `${value.toFixed(axis.decimals)}${axis.unit ? ` ${axis.unit}` : ''}`,
      },
      axisTick: { show: axis.showTicks, lineStyle: { color: axisLineColor } },
      axisLine: { show: axis.showAxisLine, lineStyle: { color: axisLineColor } },
      splitLine: { show: axis.showGrid, lineStyle: { color: gridLineColor } },
    })),
    visualMap,
    series,
  };
}

function render(element: HTMLElement, initialProps: Props, initialCtx: WidgetOverlayContext) {
  element.style.cssText =
    'width:100%;height:100%;position:relative;overflow:hidden;pointer-events:auto';
  const chartHost = document.createElement('div');
  chartHost.style.cssText = 'width:100%;height:100%';
  element.appendChild(chartHost);
  const status = document.createElement('div');
  status.style.cssText =
    'position:absolute;left:12px;top:10px;z-index:4;font:12px system-ui;color:#888;pointer-events:none';
  element.appendChild(status);
  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.style.cssText =
    'position:absolute;right:74px;top:6px;z-index:5;height:26px;padding:0 10px;border:1px solid #d8d8df;border-radius:5px;background:rgba(255,255,255,.9);font:12px system-ui;cursor:pointer';
  element.appendChild(exportButton);
  const chart = echarts.init(chartHost);
  let props = initialProps;
  let ctx = initialCtx;
  let states: SeriesState[] = [];
  let controller: AbortController | null = null;
  let queryKey = '';
  let destroyed = false;

  const draw = () => {
    if (!destroyed)
      chart.setOption(buildChartOption(props.config, states, resolveWidgetColors(element)), {
        notMerge: true,
      });
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
    const response = await fetch(
      buildHistoryUrl(runtime.base, props.config.data, key, { start, end, export: exportFile }),
      {
        signal: useLoadSignal ? controller?.signal : undefined,
        headers: runtime.token ? { 'x-token': runtime.token } : {},
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.code === 'number' &&
      payload.code !== 200
    ) {
      throw new Error(
        typeof payload.message === 'string' ? payload.message : `API ${payload.code}`,
      );
    }
    return normalizeHistoryResponse(payload);
  };

  const load = async () => {
    const text = runtimeText(ctx.locale);
    const config = props.config;
    const runtime = getRuntime();
    exportButton.textContent = text.export || '导出 CSV';
    exportButton.style.display = 'none';
    if (!config.data.deviceId || !config.data.metricKeys.length) {
      states = [];
      status.textContent = text.empty || '请选择设备和指标字段';
      draw();
      return;
    }
    if (!runtime.base || !runtime.token) {
      status.textContent = text.noVariables || '平台 API 地址或令牌不可用';
      return;
    }
    controller?.abort();
    controller = new AbortController();
    status.textContent = text.loading || '正在查询历史数据…';
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
    status.textContent = results.every((item) => item.error)
      ? `${text.error || '查询失败'}：${results[0]?.error}`
      : results.some((item) => item.error)
        ? '部分指标查询失败'
        : results.some((item) => item.comparisonError)
          ? '当前数据已加载，部分同期数据查询失败'
          : results.every((item) => item.points.length === 0)
            ? text.noData || '当前时间范围内没有数据'
            : '';
    draw();
  };

  const refresh = () => {
    const nextKey = JSON.stringify({
      data: props.config.data,
      comparison: props.config.analysis.comparison,
      offset: props.config.analysis.comparisonOffsetMs,
      variables: getRuntime(),
    });
    if (nextKey !== queryKey) {
      queryKey = nextKey;
      void load().catch((error) => {
        if ((error as Error).name !== 'AbortError')
          status.textContent = `${runtimeText(ctx.locale).error || '查询失败'}：${error instanceof Error ? error.message : String(error)}`;
      });
    } else draw();
  };

  const onMessage = (event: MessageEvent) => {
    if (!props.config.data.realtimeAppend || props.config.data.timeRange === 'custom') return;
    const message = event.data as { type?: string; payload?: Record<string, any> };
    if (!['tv:platform-data', 'thingsvis:platform-data'].includes(message?.type || '')) return;
    const payload = message.payload ?? {};
    if (payload.deviceId && payload.deviceId !== props.config.data.deviceId) return;
    const updates: Array<{ key: string; value: unknown; time: unknown }> = [];
    if (payload.fieldId)
      updates.push({ key: payload.fieldId, value: payload.value, time: payload.timestamp });
    if (payload.fields && typeof payload.fields === 'object')
      Object.entries(payload.fields).forEach(([key, value]) =>
        updates.push({ key, value, time: payload.timestamp }),
      );
    let changed = false;
    updates.forEach((update) => {
      const state = states.find((item) => item.key === update.key);
      const value = Number(update.value);
      const time = normalizeTimestamp(update.time);
      if (!state || !Number.isFinite(value)) return;
      state.points = appendRealtime(state.points, { time, value }, props.config.data.maxDataPoints);
      const statLimit = Math.max(props.config.data.maxDataPoints, state.statPoints?.length ?? 0);
      state.statPoints = appendRealtime(
        state.statPoints ?? state.points,
        { time, value },
        statLimit,
      );
      changed = true;
    });
    if (changed) draw();
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
      status.textContent = `导出失败：${error instanceof Error ? error.message : String(error)}`;
    } finally {
      exportButton.disabled = false;
    }
  };
  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => chart.resize()) : null;
  resizeObserver?.observe(element);
  refresh();
  return {
    update(nextProps: Props, nextCtx: WidgetOverlayContext) {
      props = nextProps;
      ctx = nextCtx;
      refresh();
    },
    destroy() {
      destroyed = true;
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
