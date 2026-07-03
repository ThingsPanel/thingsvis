/**
 * Shared chart typography props — mirrors ECharts option paths (axisLabel.fontSize, legend.textStyle.fontSize, …).
 * Min 10 matches interaction widgets (button, input, select, …); basic/text allows 8 for body copy.
 */

import { z } from 'zod';

/** Minimum font size — same as interaction/basic-* widgets (10). */
export const CHART_FONT_SIZE_MIN = 10;

export const CHART_FONT_SIZE_MAX = 32;

export const CHART_AXIS_FONT_SIZE_DEFAULT = 12;

export const CHART_LEGEND_FONT_SIZE_DEFAULT = 12;

export const CHART_LABEL_FONT_SIZE_DEFAULT = 12;

/** Gauge series.title.fontSize default */
export const CHART_GAUGE_TITLE_FONT_SIZE_DEFAULT = 12;

/** Gauge series.detail.fontSize default */
export const CHART_GAUGE_DETAIL_FONT_SIZE_DEFAULT = 26;

/** Gauge series.axisLabel.fontSize default */
export const CHART_GAUGE_AXIS_FONT_SIZE_DEFAULT = 10;

export const ChartAxisFontMixin = {
  /** → xAxis.axisLabel.fontSize */
  xAxisFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_AXIS_FONT_SIZE_DEFAULT)
    .describe('props.xAxisFontSize'),

  /** → yAxis.axisLabel.fontSize */
  yAxisFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_AXIS_FONT_SIZE_DEFAULT)
    .describe('props.yAxisFontSize'),

  /** → legend.textStyle.fontSize */
  legendFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_LEGEND_FONT_SIZE_DEFAULT)
    .describe('props.legendFontSize'),
};

export const ChartPieFontMixin = {
  legendFontSize: ChartAxisFontMixin.legendFontSize,
  /** → series[].label.fontSize */
  labelFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_LABEL_FONT_SIZE_DEFAULT)
    .describe('props.labelFontSize'),
};

export const ChartGaugeFontMixin = {
  /** → series[].axisLabel.fontSize */
  axisLabelFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_GAUGE_AXIS_FONT_SIZE_DEFAULT)
    .describe('props.axisLabelFontSize'),

  /** → series[].title.fontSize */
  titleFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_GAUGE_TITLE_FONT_SIZE_DEFAULT)
    .describe('props.titleFontSize'),

  /** → series[].detail.fontSize */
  detailFontSize: z
    .number()
    .min(CHART_FONT_SIZE_MIN)
    .max(CHART_FONT_SIZE_MAX)
    .default(CHART_GAUGE_DETAIL_FONT_SIZE_DEFAULT)
    .describe('props.detailFontSize'),
};

/** Apply responsive scale while respecting the configured minimum. */
export function scaledChartFontSize(fontSize: number, scale: number): number {
  return Math.max(CHART_FONT_SIZE_MIN, Math.round(fontSize * scale));
}

/** Legend / tooltip series labels only matter when there are multiple metrics. */
export function shouldShowChartLegend(showLegend: boolean, seriesCount: number): boolean {
  return showLegend && seriesCount > 1;
}

/** Shared slider overrides for generateControls. */
export const chartAxisFontControlOverrides = {
  xAxisFontSize: {
    kind: 'slider' as const,
    label: { zh: 'X轴字号', en: 'X Axis Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
  yAxisFontSize: {
    kind: 'slider' as const,
    label: { zh: 'Y轴字号', en: 'Y Axis Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
  legendFontSize: {
    kind: 'slider' as const,
    label: { zh: '图例字号', en: 'Legend Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
};

export const chartPieFontControlOverrides = {
  legendFontSize: chartAxisFontControlOverrides.legendFontSize,
  labelFontSize: {
    kind: 'slider' as const,
    label: { zh: '标签字号', en: 'Label Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
};

export const chartGaugeFontControlOverrides = {
  axisLabelFontSize: {
    kind: 'slider' as const,
    label: { zh: '刻度字号', en: 'Axis Label Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
  titleFontSize: {
    kind: 'slider' as const,
    label: { zh: '标题字号', en: 'Title Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
  detailFontSize: {
    kind: 'slider' as const,
    label: { zh: '数值字号', en: 'Detail Font Size' },
    min: CHART_FONT_SIZE_MIN,
    max: CHART_FONT_SIZE_MAX,
    step: 1,
  },
};

export const chartAxisFontBindings = {
  xAxisFontSize: { enabled: true, modes: ['static', 'field', 'expr'] as ('static' | 'field' | 'expr')[] },
  yAxisFontSize: { enabled: true, modes: ['static', 'field', 'expr'] as ('static' | 'field' | 'expr')[] },
  legendFontSize: { enabled: true, modes: ['static', 'field', 'expr'] as ('static' | 'field' | 'expr')[] },
};
