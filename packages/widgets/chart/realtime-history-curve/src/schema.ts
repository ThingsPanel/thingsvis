import { z } from 'zod';

const DataConfigSchema = z.object({
  deviceId: z.string().default(''),
  metricKeys: z.array(z.string()).max(10).default([]),
  timeRange: z
    .enum([
      'last_5m',
      'last_15m',
      'last_30m',
      'last_1h',
      'last_3h',
      'last_6h',
      'last_12h',
      'last_24h',
      'last_3d',
      'last_7d',
      'last_15d',
      'last_30d',
      'last_60d',
      'last_90d',
      'last_6m',
      'last_1y',
      'custom',
    ])
    .default('last_1h'),
  startTime: z.number().nonnegative().default(0),
  endTime: z.number().nonnegative().default(0),
  aggregationMode: z.enum(['auto', 'raw', 'custom']).default('auto'),
  aggregationWindow: z
    .enum([
      'no_aggregate',
      '30s',
      '1m',
      '2m',
      '5m',
      '10m',
      '30m',
      '1h',
      '3h',
      '6h',
      '1d',
      '7d',
      '1mo',
    ])
    .default('no_aggregate'),
  aggregationFunction: z.enum(['avg', 'max', 'mix', 'sum', 'diff']).default('avg'),
  maxDataPoints: z.number().int().min(100).max(10000).default(1000),
  realtimeAppend: z.boolean().default(true),
});

const SeriesConfigSchema = z.object({
  name: z.string().default(''),
  unit: z.string().default(''),
  decimals: z.number().int().min(0).max(6).default(2),
  color: z.string().default('#6965db'),
  lineWidth: z.number().min(1).max(8).default(2),
  curve: z
    .enum(['straight', 'smooth', 'step-start', 'step-middle', 'step-end'])
    .default('straight'),
  showPoints: z.enum(['auto', 'show', 'hide']).default('auto'),
  pointSize: z.number().min(2).max(12).default(5),
  areaFill: z.enum(['none', 'solid', 'gradient']).default('none'),
  areaOpacity: z.number().min(0).max(1).default(0.2),
  segmentColor: z.boolean().default(false),
  yAxisId: z.string().default('y0'),
  hidden: z.boolean().default(false),
});

const LayoutConfigSchema = z.object({
  marginMode: z.enum(['auto', 'custom']).default('auto'),
  top: z.number().min(0).max(200).default(40),
  right: z.number().min(0).max(200).default(16),
  bottom: z.number().min(0).max(200).default(16),
  left: z.number().min(0).max(200).default(16),
});

const ChartStyleConfigSchema = z.object({
  axisLabelColor: z.string().default(''),
  xAxisFontSize: z.number().min(10).max(32).default(12),
  yAxisFontSize: z.number().min(10).max(32).default(12),
  axisTitleColor: z.string().default(''),
  axisTitleFontSize: z.number().min(10).max(32).default(12),
  legendColor: z.string().default(''),
  legendFontSize: z.number().min(10).max(32).default(12),
  axisLineColor: z.string().default(''),
  gridLineColor: z.string().default(''),
});

const XAxisConfigSchema = z.object({
  show: z.boolean().default(true),
  title: z.string().default(''),
  timeFormat: z.string().default('auto'),
  labelStrategy: z.enum(['auto', 'count', 'interval']).default('auto'),
  labelCount: z.number().int().min(2).max(30).default(8),
  labelInterval: z.string().default('1h'),
  labelRotation: z.number().min(0).max(90).default(0),
  showTicks: z.boolean().default(true),
  showAxisLine: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  zoom: z.boolean().default(true),
  pan: z.boolean().default(true),
  showDataZoom: z.boolean().default(false),
});

const YAxisConfigSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  unit: z.string().default(''),
  position: z.enum(['left', 'right']).default('left'),
  minMode: z.enum(['auto', 'fixed']).default('auto'),
  min: z.number().default(0),
  maxMode: z.enum(['auto', 'fixed']).default('auto'),
  max: z.number().default(100),
  tickMode: z.enum(['auto', 'split', 'interval']).default('auto'),
  splitNumber: z.number().int().min(2).max(20).default(5),
  interval: z.number().positive().default(10),
  decimals: z.number().int().min(0).max(6).default(2),
  showTicks: z.boolean().default(true),
  showAxisLine: z.boolean().default(true),
  showGrid: z.boolean().default(true),
});

const ThresholdSchema = z.object({
  id: z.string(),
  name: z.string().default('阈值'),
  operator: z.enum(['>', '>=', '<', '<=', '=']).default('>='),
  value: z.number().default(0),
  color: z.string().default('#ee6666'),
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).default('dashed'),
  lineWidth: z.number().min(1).max(8).default(1),
  showValue: z.boolean().default(true),
  colorBreached: z.boolean().default(true),
  yAxisId: z.string().default('y0'),
});

const AnalysisConfigSchema = z.object({
  statistics: z.array(z.enum(['min', 'max', 'avg', 'latest'])).default([]),
  thresholds: z.array(ThresholdSchema).default([]),
  comparison: z
    .enum(['none', 'previous', 'day', 'week', 'month', 'year', 'custom'])
    .default('none'),
  comparisonOffsetMs: z.number().nonnegative().default(0),
  enableExport: z.boolean().default(false),
  nullHandling: z.enum(['break', 'connect', 'zero', 'previous', 'linear']).default('break'),
  interpolationMaxGapMs: z.number().positive().default(300000),
  tooltip: z
    .object({
      show: z.boolean().default(true),
      trigger: z.enum(['axis', 'item']).default('axis'),
      showTime: z.boolean().default(true),
      showUnit: z.boolean().default(true),
      crosshair: z.boolean().default(true),
      sort: z.enum(['series', 'valueAsc', 'valueDesc']).default('series'),
    })
    .default({}),
  legend: z
    .object({
      show: z.boolean().default(true),
      position: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
      filterable: z.boolean().default(true),
      showStatistics: z.boolean().default(false),
    })
    .default({}),
});

export const RealtimeHistoryConfigSchema = z.object({
  data: DataConfigSchema.default({}),
  series: z.record(z.string(), SeriesConfigSchema).default({}),
  layout: LayoutConfigSchema.default({}),
  style: ChartStyleConfigSchema.default({}),
  xAxis: XAxisConfigSchema.default({}),
  yAxes: z
    .array(YAxisConfigSchema)
    .min(1)
    .max(4)
    .default([{ id: 'y0' }]),
  analysis: AnalysisConfigSchema.default({}),
});

export const PropsSchema = z.object({
  config: RealtimeHistoryConfigSchema.default({}),
});

export type Props = z.infer<typeof PropsSchema>;
export type RealtimeHistoryConfig = z.infer<typeof RealtimeHistoryConfigSchema>;
export type SeriesConfig = z.infer<typeof SeriesConfigSchema>;
export type YAxisConfig = z.infer<typeof YAxisConfigSchema>;
export type Threshold = z.infer<typeof ThresholdSchema>;
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
