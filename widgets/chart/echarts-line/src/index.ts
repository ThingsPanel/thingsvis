import { resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';
/**
 * ECharts 折线图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';
import zh from './locales/zh.json';
import en from './locales/en.json';


/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
  const { title, data, primaryColor, showLegend, smooth, showArea, showXAxis, showYAxis } = props;

  const textColor = colors?.fg ?? '#333';
  const splitLineColor = colors?.axis ?? '#00000010';

  // 面积阴影渐变色（如果开启）
  const areaGradient = showArea ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: primaryColor + '80' },
    { offset: 1, color: primaryColor + '00' }
  ]) : undefined;

  return {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      left: 'center',
      textStyle: { fontSize: Math.round(14 * scale), color: textColor },
      top: Math.round(10 * scale),
    } : undefined,
    tooltip: {
      trigger: 'axis',
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
    dataset: Array.isArray(data) && data.length > 0 ? {
      dimensions: [{ name: 'name', displayName: '维度' }, { name: 'value', displayName: title || 'props.value' }],
      source: data
    } : undefined,
    xAxis: {
      show: showXAxis !== false,
      type: 'category',
      axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
      axisLine: { lineStyle: { color: splitLineColor } },
      // 补充刻度展示属性
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      show: showYAxis !== false,
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: textColor, fontSize: Math.round(12 * scale) },
      // 补充刻度展示属性
      axisLine: { show: true, lineStyle: { color: splitLineColor } },
      axisTick: { show: true, lineStyle: { color: splitLineColor } },
    },
    series: [
      {
        type: 'line',
        encode: { x: 'name', y: 'value', tooltip: ['value'] },
        smooth: smooth,
        showSymbol: false,
        itemStyle: {
          color: primaryColor,
        },
        lineStyle: {
          width: 3,
        },
        areaStyle: showArea ? {
          color: areaGradient,
        } : undefined,
      },
    ],
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
  let isDark = true;

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
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => scheduleResize());
    ro.observe(element);
  }

  return {
    element,
    update: (newCtx: WidgetOverlayContext) => {
      currentProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
      colors = resolveWidgetColors(element);
      isDark = true;

      // scheduleResize 处理比例缩放
      if (newCtx.size || !newCtx.size) {
        scheduleResize();
      }
    },
    destroy: () => {
      ro?.disconnect();
      chart.dispose();
    },
  };
}

/**
 * 插件主模块
 */
export const Main: WidgetMainModule = {
  locales: { zh, en },
  ...metadata,
  schema: PropsSchema,
  controls,
  createOverlay,
};

export default Main;
