/**
 * ECharts 仪表盘主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLayeredColor,
  type WidgetOverlayContext,
  resolveWidgetColors,
  scaledChartFontSize,
  type WidgetColors,
} from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const LEGACY_DEFAULT_PRIMARY = '#6965db';
const STANDALONE_GAUGE_SERIES = [{ name: 'CPU', value: 67 }];

type GaugeThreshold = Props['thresholds'][number];

function parseGaugeData(
  raw: Props['data'],
  fallbackName: string,
): { value: number; name: string } | null {
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
    name:
      typeof record.name === 'string'
        ? record.name
        : typeof record.label === 'string'
          ? record.label
          : fallbackName,
  };
}

/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch?.[1]) {
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
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1].split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
    }
  }
  return normalized;
}

function normalizeThresholds(thresholds: GaugeThreshold[], min: number, max: number): GaugeThreshold[] {
  if (!(max > min)) return [];
  return thresholds
    .filter((item) => Number.isFinite(item.value) && item.color.trim())
    .map((item) => ({ ...item, value: Math.max(min, Math.min(max, item.value)) }))
    .sort((left, right) => left.value - right.value);
}

function buildThresholdColors(
  thresholds: GaugeThreshold[], min: number, max: number, fallbackColor: string,
): Array<[number, string]> {
  const normalized = normalizeThresholds(thresholds, min, max);
  if (normalized.length === 0) return [[1, fallbackColor]];
  const span = max - min;
  const result: Array<[number, string]> = normalized.map((item) => [
    (item.value - min) / span,
    item.color,
  ]);
  const last = result[result.length - 1];
  if (last && last[0] < 1) result.push([1, fallbackColor]);
  return result;
}

function resolveThreshold(
  value: number, thresholds: GaugeThreshold[], min: number, max: number,
): GaugeThreshold | null {
  const normalized = normalizeThresholds(thresholds, min, max);
  return normalized.find((item) => value <= item.value) ?? normalized[normalized.length - 1] ?? null;
}

export function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
  const {
    data, primaryColor, axisLabelColor, detailColor, min, max, unit, precision,
    startAngle, endAngle, splitNumber, showProgress, showPointer, showAxisTicks,
    showSplitLines, showAxisLabels, showRangeLabels, useThresholdColor, thresholds,
    axisLabelFontSize, titleFontSize, detailFontSize,
  } = props;

  const accentColor = resolveLayeredColor({
    instance: primaryColor,
    theme: colors.series[0] ?? colors.primary,
    fallback: LEGACY_DEFAULT_PRIMARY,
    inheritValues: [LEGACY_DEFAULT_PRIMARY],
  });
  const accentTailColor = (primaryColor ?? '').trim()
    ? withAlpha(accentColor, 0.55)
    : (colors.series[1] ?? accentColor);
  const resolvedAxisLabelColor = resolveLayeredColor({
    instance: axisLabelColor,
    theme: colors.fg,
    fallback: colors.fg,
  });
  const resolvedDetailColor = resolveLayeredColor({
    instance: detailColor,
    theme: colors.fg,
    fallback: colors.fg,
  });
  const splitLineColor = colors.axis;
  const axisLineColor = colors.axis;
  const gaugeAxisFontSize = scaledChartFontSize(axisLabelFontSize, scale);
  const gaugeTitleFontSize = scaledChartFontSize(titleFontSize, scale);
  const gaugeDetailFontSize = scaledChartFontSize(detailFontSize, scale);

  // Extract current value and name
  const dataEntry = parseGaugeData(data, '');
  const val = dataEntry?.value ?? 0;
  const itemName = dataEntry?.name ?? '';
  const hasData = dataEntry !== null;
  const thresholdColors = buildThresholdColors(thresholds, min, max, axisLineColor);
  const activeThreshold = hasData ? resolveThreshold(val, thresholds, min, max) : null;
  const currentColor = useThresholdColor && activeThreshold ? activeThreshold.color : accentColor;
  const detailFormatter = (value: number) => {
    const formatted = precision === null ? String(value) : value.toFixed(precision);
    return `${formatted}${unit}`;
  };

  return {
    backgroundColor: 'transparent',
    color: colors.series,
    graphic: hasData
      ? undefined
      : {
          type: 'text',
          left: 'center',
          top: 'middle',
          silent: true,
          style: {
            text: '暂无数据',
            fill: resolvedAxisLabelColor,
            opacity: 0.65,
            fontSize: gaugeTitleFontSize,
          },
        },
    series: hasData
      ? [
          {
            type: 'gauge',
            center: ['50%', '54%'],
            radius: '76%',
            startAngle,
            endAngle,
            min,
            max: max,
            splitNumber,
            axisLine: {
              lineStyle: {
                width: Math.round(8 * scale),
                color: thresholdColors,
              },
            },
            progress: {
              show: showProgress,
              width: Math.round(12 * scale),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: currentColor },
                  { offset: 1, color: useThresholdColor && activeThreshold ? activeThreshold.color : accentTailColor },
                ]),
                borderRadius: Math.round(6 * scale),
              },
            },
            pointer: {
              show: showPointer,
              length: '60%',
              width: Math.round(4 * scale),
              offsetCenter: [0, '5%'],
              itemStyle: {
                color: currentColor,
              },
            },
            axisTick: {
              show: showAxisTicks,
              distance: Math.round(-15 * scale),
              lineStyle: {
                color: splitLineColor,
                width: 1,
              },
            },
            splitLine: {
              show: showSplitLines,
              distance: Math.round(-15 * scale),
              length: Math.round(10 * scale),
              lineStyle: {
                color: splitLineColor,
                width: 2,
              },
            },
            axisLabel: {
              show: showAxisLabels || showRangeLabels,
              distance: Math.round(-30 * scale),
              color: resolvedAxisLabelColor,
              fontSize: gaugeAxisFontSize,
              formatter: (value: number) => {
                if (showRangeLabels) {
                  const match = normalizeThresholds(thresholds, min, max)
                    .find((item) => Math.abs(item.value - value) < 0.000001 && item.label);
                  if (match) return match.label;
                }
                return showAxisLabels ? String(value) : '';
              },
            },
            anchor: {
              show: true,
              showAbove: true,
              size: Math.round(14 * scale),
              itemStyle: {
                borderWidth: Math.round(3 * scale),
                borderColor: currentColor,
                color: '#fff',
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.2)',
              },
            },
            title: {
              show: true,
              offsetCenter: [0, '40%'],
              fontSize: gaugeTitleFontSize,
              color: resolvedAxisLabelColor,
              opacity: 0.8,
            },
            detail: {
              valueAnimation: true,
              offsetCenter: [0, '75%'],
              formatter: detailFormatter,
              color: useThresholdColor && activeThreshold ? activeThreshold.color : resolvedDetailColor,
              fontSize: gaugeDetailFontSize,
              fontWeight: 'bold',
            },
            data: [{ value: val, name: itemName }],
          },
        ]
      : [],
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
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  sampleData: { data: STANDALONE_GAUGE_SERIES },
  standaloneDefaults: { data: STANDALONE_GAUGE_SERIES },
  previewDefaults: { data: STANDALONE_GAUGE_SERIES },
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
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
            chart.setOption(buildOption(currentProps, colors, scale), {
              replaceMerge: ['dataset', 'series'],
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
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);

        chart.setOption(buildOption(currentProps, colors), { replaceMerge: ['dataset', 'series'] });

        if (newCtx.size) {
          scheduleResize();
        }
      },
      destroy: () => {
        ro?.disconnect();
        themeObserver?.disconnect();
        chart.dispose();
      },
    };
  },
});

export default Main;
