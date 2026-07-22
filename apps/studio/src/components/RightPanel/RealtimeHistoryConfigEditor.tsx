import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ColorInput } from '@/components/ui/color-input';
import { NumericInput } from '@/components/ui/NumericInput';
import {
  type PlatformDevice,
  type PlatformDeviceField,
  usePlatformDeviceStore,
} from '@/lib/stores/platformDeviceStore';

import { DeviceSelectorModal } from './DeviceSelectorModal';

type Props = { value: unknown; onChange: (value: Record<string, unknown>) => void };

const COLORS = ['#6965db', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
const AGGREGATION_WINDOWS = [
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
] as const;
const RANGE_MINIMUM_WINDOW: Record<string, (typeof AGGREGATION_WINDOWS)[number]> = {
  last_3h: '30s',
  last_6h: '1m',
  last_12h: '2m',
  last_24h: '5m',
  last_3d: '10m',
  last_7d: '30m',
  last_15d: '1h',
  last_30d: '3h',
  last_60d: '6h',
  last_90d: '1d',
  last_6m: '7d',
  last_1y: '1mo',
};

const TIME_RANGES = [
  ['last_5m', '最近 5 分钟'],
  ['last_15m', '最近 15 分钟'],
  ['last_30m', '最近 30 分钟'],
  ['last_1h', '最近 1 小时'],
  ['last_3h', '最近 3 小时'],
  ['last_6h', '最近 6 小时'],
  ['last_12h', '最近 12 小时'],
  ['last_24h', '最近 24 小时'],
  ['last_3d', '最近 3 天'],
  ['last_7d', '最近 7 天'],
  ['last_15d', '最近 15 天'],
  ['last_30d', '最近 30 天'],
  ['last_60d', '最近 60 天'],
  ['last_90d', '最近 90 天'],
  ['last_6m', '最近 6 个月'],
  ['last_1y', '最近 1 年'],
  ['custom', '自定义'],
] as const;

export function toDatetimeLocalValue(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
}

export function getMinimumAggregationWindow(
  data: Record<string, any>,
): (typeof AGGREGATION_WINDOWS)[number] {
  if (data.timeRange !== 'custom') return RANGE_MINIMUM_WINDOW[data.timeRange] ?? 'no_aggregate';
  const span = Math.max(0, Number(data.endTime) - Number(data.startTime));
  if (span < 3 * 3600000) return 'no_aggregate';
  if (span < 6 * 3600000) return '1m';
  if (span < 12 * 3600000) return '2m';
  if (span < 24 * 3600000) return '5m';
  if (span < 3 * 86400000) return '10m';
  if (span < 7 * 86400000) return '30m';
  if (span < 15 * 86400000) return '1h';
  if (span < 30 * 86400000) return '3h';
  if (span < 60 * 86400000) return '6h';
  if (span < 90 * 86400000) return '1d';
  if (span < 365 * 86400000) return '7d';
  return '1mo';
}

export const DEFAULT_REALTIME_HISTORY_CONFIG = {
  data: {
    deviceId: '',
    metricKeys: [] as string[],
    timeRange: 'last_1h',
    startTime: 0,
    endTime: 0,
    aggregationMode: 'auto',
    aggregationWindow: 'no_aggregate',
    aggregationFunction: 'avg',
    maxDataPoints: 1000,
    realtimeAppend: true,
  },
  series: {} as Record<string, unknown>,
  layout: {
    marginMode: 'auto',
    top: 40,
    right: 16,
    bottom: 16,
    left: 16,
  },
  style: {
    axisLabelColor: '',
    xAxisFontSize: 12,
    yAxisFontSize: 12,
    axisTitleColor: '',
    axisTitleFontSize: 12,
    legendColor: '',
    legendFontSize: 12,
    axisLineColor: '',
    gridLineColor: '',
  },
  xAxis: {
    show: true,
    title: '',
    timeFormat: 'auto',
    labelStrategy: 'auto',
    labelCount: 8,
    labelInterval: '1h',
    labelRotation: 0,
    showTicks: true,
    showAxisLine: true,
    showGrid: true,
    zoom: true,
    pan: true,
    showDataZoom: false,
  },
  yAxes: [
    {
      id: 'y0',
      title: '',
      unit: '',
      position: 'left',
      minMode: 'auto',
      min: 0,
      maxMode: 'auto',
      max: 100,
      tickMode: 'auto',
      splitNumber: 5,
      interval: 10,
      decimals: 2,
      showTicks: true,
      showAxisLine: true,
      showGrid: true,
    },
  ],
  analysis: {
    statistics: [] as string[],
    thresholds: [] as unknown[],
    comparison: 'none',
    comparisonOffsetMs: 0,
    enableExport: false,
    nullHandling: 'break',
    interpolationMaxGapMs: 300000,
    tooltip: {
      show: true,
      trigger: 'axis',
      showTime: true,
      showUnit: true,
      crosshair: true,
      sort: 'series',
    },
    legend: { show: true, position: 'top', filterable: true, showStatistics: false },
  },
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function normalize(value: unknown) {
  const source = asRecord(value);
  return {
    ...DEFAULT_REALTIME_HISTORY_CONFIG,
    ...source,
    data: { ...DEFAULT_REALTIME_HISTORY_CONFIG.data, ...asRecord(source.data) },
    series: { ...DEFAULT_REALTIME_HISTORY_CONFIG.series, ...asRecord(source.series) },
    layout: { ...DEFAULT_REALTIME_HISTORY_CONFIG.layout, ...asRecord(source.layout) },
    style: { ...DEFAULT_REALTIME_HISTORY_CONFIG.style, ...asRecord(source.style) },
    xAxis: { ...DEFAULT_REALTIME_HISTORY_CONFIG.xAxis, ...asRecord(source.xAxis) },
    yAxes:
      Array.isArray(source.yAxes) && source.yAxes.length
        ? source.yAxes
        : DEFAULT_REALTIME_HISTORY_CONFIG.yAxes,
    analysis: {
      ...DEFAULT_REALTIME_HISTORY_CONFIG.analysis,
      ...asRecord(source.analysis),
      tooltip: {
        ...DEFAULT_REALTIME_HISTORY_CONFIG.analysis.tooltip,
        ...asRecord(source.analysis?.tooltip),
      },
      legend: {
        ...DEFAULT_REALTIME_HISTORY_CONFIG.analysis.legend,
        ...asRecord(source.analysis?.legend),
      },
    },
  };
}

function requestDeviceFields(device: PlatformDevice): Promise<PlatformDeviceField[]> {
  if (Array.isArray(device.fields) && device.fields.length) return Promise.resolve(device.fields);
  if (window.parent === window) return Promise.resolve([]);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve([]);
    }, 8000);
    const handler = (event: MessageEvent) => {
      const message = event.data as {
        type?: string;
        payload?: { deviceId?: string; fields?: unknown[] };
      };
      if (message?.type !== 'tv:device-fields' || message.payload?.deviceId !== device.deviceId)
        return;
      window.clearTimeout(timer);
      window.removeEventListener('message', handler);
      const fields = Array.isArray(message.payload.fields)
        ? (message.payload.fields as PlatformDeviceField[])
        : [];
      usePlatformDeviceStore.getState().updateDeviceFields(device.deviceId, fields);
      resolve(fields);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage(
      {
        type: 'thingsvis:requestDeviceFields',
        payload: {
          deviceId: device.deviceId,
          templateId: device.templateId,
          deviceConfigId: device.deviceConfigId,
        },
      },
      '*',
    );
  });
}

const pendingDeviceRequests = new Set<string>();

function requestDeviceById(deviceId: string): void {
  if (!deviceId || window.parent === window || pendingDeviceRequests.has(deviceId)) return;
  pendingDeviceRequests.add(deviceId);
  const handler = (event: MessageEvent) => {
    const message = event.data as {
      type?: string;
      payload?: { deviceId?: string; device?: PlatformDevice | null };
    };
    if (message?.type !== 'tv:device-by-id' || message.payload?.deviceId !== deviceId) return;
    window.removeEventListener('message', handler);
    pendingDeviceRequests.delete(deviceId);
    if (message.payload.device?.deviceId) {
      usePlatformDeviceStore.getState().setDevices([message.payload.device]);
    }
  };
  window.addEventListener('message', handler);
  window.parent.postMessage(
    {
      type: 'thingsvis:requestDeviceById',
      payload: { reqId: `realtime-history-${deviceId}`, deviceId },
    },
    '*',
  );
}

const inputClass =
  'w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring';
const labelClass = 'block text-sm font-medium text-muted-foreground';
const checkClass = 'flex items-center gap-2 text-sm text-muted-foreground';
const sectionClass = 'space-y-3 border-t border-border pt-4';
const sectionTitleClass = 'text-[12px] font-normal text-muted-foreground uppercase tracking-wider';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={sectionClass}>
      <h3 className={sectionTitleClass}>{title}</h3>
      {children}
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <StaticPropertyLabel label={label} />
      <ColorInput value={value} onChange={onChange} />
    </div>
  );
}

function StaticPropertyLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className={`${labelClass} min-w-0 flex-1 truncate`}>{label}</label>
      <select
        aria-label={`${label}模式`}
        value="static"
        onChange={() => undefined}
        className="appearance-none h-6 px-2.5 pr-6 text-[11px] font-medium rounded border border-border bg-transparent text-muted-foreground outline-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
          backgroundSize: '12px',
        }}
      >
        <option value="static">静态</option>
      </select>
    </div>
  );
}

function FontSizeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <StaticPropertyLabel label={label} />
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={10}
          max={32}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-[#6965db]"
        />
        <NumericInput
          aria-label={label}
          min={10}
          max={32}
          value={value}
          onValueChange={(nextValue) => onChange(nextValue ?? value)}
          className="h-8 w-16 text-sm tabular-nums"
          mode="int"
        />
      </div>
    </div>
  );
}

export function assignedYAxisId(config: Record<string, any>, metricKey: string): string {
  return asRecord(config.series?.[metricKey]).yAxisId || config.yAxes?.[0]?.id || 'y0';
}

export function assignMetricToYAxis(
  config: Record<string, any>,
  metricKey: string,
  yAxisId: string,
): Record<string, any> {
  const current = asRecord(config.series?.[metricKey]);
  return {
    ...config,
    series: {
      ...asRecord(config.series),
      [metricKey]: { ...current, yAxisId },
    },
  };
}

export function updateMetricColor(
  config: Record<string, any>,
  metricKey: string,
  color: string,
): Record<string, any> {
  const current = asRecord(config.series?.[metricKey]);
  return {
    ...config,
    series: {
      ...asRecord(config.series),
      [metricKey]: { ...current, color },
    },
  };
}

export function RealtimeHistoryConfigEditor({ value, onChange }: Props) {
  const config = useMemo(() => normalize(value), [value]);
  const groups = usePlatformDeviceStore((state) => state.groups);
  const devices = usePlatformDeviceStore((state) => state.devices);
  const [deviceSelectorOpen, setDeviceSelectorOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const selectedDevice = devices.find((item) => item.deviceId === config.data.deviceId);
  const minimumAggregationWindow = getMinimumAggregationWindow(config.data);
  const minimumAggregationIndex = AGGREGATION_WINDOWS.indexOf(minimumAggregationWindow);
  const customRangeInvalid =
    config.data.timeRange === 'custom' &&
    (!config.data.startTime ||
      !config.data.endTime ||
      config.data.endTime <= config.data.startTime);

  useEffect(() => {
    const source = asRecord(value);
    const sourceAnalysis = asRecord(source.analysis);
    const sourceLegend = asRecord(sourceAnalysis.legend);
    const hasLegacyAnalysisUi =
      (Array.isArray(sourceAnalysis.statistics) && sourceAnalysis.statistics.length > 0) ||
      sourceAnalysis.enableExport === true ||
      sourceLegend.showStatistics === true;
    if (!hasLegacyAnalysisUi) return;
    onChange({
      ...config,
      analysis: {
        ...config.analysis,
        statistics: [],
        enableExport: false,
        legend: { ...config.analysis.legend, showStatistics: false },
      },
      xAxis: { ...config.xAxis, showDataZoom: false },
    });
  }, [config, onChange, value]);

  useEffect(() => {
    if (config.data.deviceId && !selectedDevice) requestDeviceById(config.data.deviceId);
    if (selectedDevice?.groupId) setSelectedGroupId(selectedDevice.groupId);
    if (selectedDevice && (!selectedDevice.fields || selectedDevice.fields.length === 0)) {
      void requestDeviceFields(selectedDevice);
    }
  }, [config.data.deviceId, selectedDevice]);

  const fields = (selectedDevice?.fields ?? []).filter((field) => {
    const dataType = String(field.dataType || 'telemetry').toLowerCase();
    const valueType = String(field.type || 'number').toLowerCase();
    return (
      dataType === 'telemetry' &&
      ['number', 'integer', 'int', 'float', 'double'].includes(valueType)
    );
  });

  const patch = (section: string, next: Record<string, unknown>) =>
    onChange({ ...config, [section]: { ...asRecord((config as any)[section]), ...next } });
  const patchData = (next: Record<string, unknown>) => {
    const data = { ...config.data, ...next };
    if (data.aggregationMode === 'custom') {
      const minimum = getMinimumAggregationWindow(data);
      if (
        AGGREGATION_WINDOWS.indexOf(
          data.aggregationWindow as (typeof AGGREGATION_WINDOWS)[number],
        ) < AGGREGATION_WINDOWS.indexOf(minimum)
      ) {
        data.aggregationWindow = minimum;
      }
    }
    onChange({ ...config, data });
  };

  const selectDevice = (device: PlatformDevice) => {
    if (device.groupId) setSelectedGroupId(device.groupId);
    onChange({
      ...config,
      data: { ...config.data, deviceId: device.deviceId, metricKeys: [] },
      series: {},
    });
  };

  const setMetric = (field: PlatformDeviceField, checked: boolean) => {
    if (checked && config.data.metricKeys.length >= 10) return;
    const metricKeys = checked
      ? Array.from(new Set([...config.data.metricKeys, field.id]))
      : config.data.metricKeys.filter((key: string) => key !== field.id);
    const series = { ...config.series };
    if (checked && !series[field.id]) {
      series[field.id] = {
        name: field.alias || field.name || field.id,
        unit: field.unit || '',
        decimals: 2,
        color: COLORS[Object.keys(series).length % COLORS.length],
        lineWidth: 2,
        curve: 'straight',
        showPoints: 'auto',
        pointSize: 5,
        areaFill: 'none',
        areaOpacity: 0.2,
        segmentColor: false,
        yAxisId: config.yAxes[0]?.id || 'y0',
        hidden: false,
      };
    }
    if (!checked) delete series[field.id];
    onChange({ ...config, data: { ...config.data, metricKeys }, series });
  };

  const removeYAxis = (index: number) => {
    const removedId = config.yAxes[index]?.id;
    const yAxes = config.yAxes.filter((_: unknown, itemIndex: number) => itemIndex !== index);
    const fallbackId = yAxes[0]?.id ?? 'y0';
    const series = Object.fromEntries(
      Object.entries(config.series).map(([key, item]) => {
        const current = asRecord(item);
        return [key, current.yAxisId === removedId ? { ...current, yAxisId: fallbackId } : current];
      }),
    );
    onChange({ ...config, yAxes, series });
  };

  const metricLabel = (key: string) => {
    const field = fields.find((item) => item.id === key);
    return field?.alias || field?.name || asRecord(config.series[key]).name || key;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className={labelClass}>设备</label>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-between overflow-hidden px-3 font-normal"
            onClick={() => setDeviceSelectorOpen(true)}
          >
            <span className="truncate">
              {selectedDevice?.deviceName || config.data.deviceId || '请选择设备'}
            </span>
            <span aria-hidden className="ml-2 text-muted-foreground">
              ⌄
            </span>
          </Button>
          <DeviceSelectorModal
            open={deviceSelectorOpen}
            onOpenChange={setDeviceSelectorOpen}
            groups={groups}
            selectedGroupId={selectedGroupId}
            selectedDeviceId={selectedDevice?.deviceId}
            onGroupChange={setSelectedGroupId}
            onGroupsLoaded={(nextGroups) => usePlatformDeviceStore.getState().setGroups(nextGroups)}
            onDevicesLoaded={(groupId, nextDevices) =>
              usePlatformDeviceStore.getState().setDevicesForGroup(groupId, nextDevices)
            }
            onSelect={selectDevice}
          />
        </div>

        <div className="space-y-1.5">
          <div className={labelClass}>指标字段（多选，最多 10 项）</div>
          <div className="max-h-40 overflow-y-auto rounded-md border border-input bg-background p-2 space-y-1.5">
            {!selectedDevice && <div className="text-xs text-muted-foreground">请先选择设备</div>}
            {selectedDevice && fields.length === 0 && (
              <div className="text-xs text-muted-foreground">正在加载或没有数值型遥测字段</div>
            )}
            {fields.map((field) => (
              <label key={field.id} className={checkClass}>
                <input
                  type="checkbox"
                  checked={config.data.metricKeys.includes(field.id)}
                  disabled={
                    !config.data.metricKeys.includes(field.id) &&
                    config.data.metricKeys.length >= 10
                  }
                  onChange={(event) => setMetric(field, event.target.checked)}
                />
                <span className="truncate">
                  {field.alias || field.name || field.id}
                  {field.unit ? ` (${field.unit})` : ''}
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className={labelClass}>
          时间范围
          <select
            className={`${inputClass} mt-1.5`}
            value={config.data.timeRange}
            onChange={(event) => patchData({ timeRange: event.target.value })}
          >
            {TIME_RANGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {config.data.timeRange === 'custom' && (
          <div className="space-y-2">
            <label className={labelClass}>
              开始时间
              <input
                type="datetime-local"
                className={`${inputClass} mt-1.5`}
                value={toDatetimeLocalValue(config.data.startTime)}
                onChange={(event) =>
                  patchData({ startTime: new Date(event.target.value).getTime() })
                }
              />
            </label>
            <label className={labelClass}>
              结束时间
              <input
                type="datetime-local"
                className={`${inputClass} mt-1.5`}
                value={toDatetimeLocalValue(config.data.endTime)}
                onChange={(event) => patchData({ endTime: new Date(event.target.value).getTime() })}
              />
            </label>
            {customRangeInvalid && (
              <p className="text-xs text-destructive">结束时间必须晚于开始时间。</p>
            )}
          </div>
        )}

        <label className={labelClass}>
          聚合模式
          <select
            className={`${inputClass} mt-1.5`}
            value={config.data.aggregationMode}
            onChange={(event) => patchData({ aggregationMode: event.target.value })}
          >
            <option value="auto">自动</option>
            <option value="raw">原始数据</option>
            <option value="custom">自定义</option>
          </select>
        </label>

        {config.data.aggregationMode === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <label className={labelClass}>
              聚合间隔
              <select
                className={`${inputClass} mt-1.5`}
                value={config.data.aggregationWindow}
                onChange={(event) => patchData({ aggregationWindow: event.target.value })}
              >
                {AGGREGATION_WINDOWS.map((window, index) => (
                  <option key={window} value={window} disabled={index < minimumAggregationIndex}>
                    {window === 'no_aggregate' ? '不聚合' : window}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              聚合函数
              <select
                className={`${inputClass} mt-1.5`}
                value={config.data.aggregationFunction}
                onChange={(event) => patchData({ aggregationFunction: event.target.value })}
              >
                <option value="avg">平均值</option>
                <option value="max">最大值</option>
                <option value="mix">最小值</option>
                <option value="sum">求和</option>
                <option value="diff">极差</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <Section title="布局">
        <label className={labelClass}>
          绘图区边距
          <select
            className={`${inputClass} mt-1.5`}
            value={config.layout.marginMode}
            onChange={(event) => patch('layout', { marginMode: event.target.value })}
          >
            <option value="auto">自动</option>
            <option value="custom">自定义</option>
          </select>
        </label>
        {config.layout.marginMode === 'auto' ? (
          <p className="text-xs leading-5 text-muted-foreground">
            根据图例位置和左右 Y 轴数量自动计算，避免文字裁切与无效留白。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['top', '上边距'],
                ['right', '右边距'],
                ['bottom', '下边距'],
                ['left', '左边距'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={labelClass}>
                {label}
                <input
                  type="number"
                  min={0}
                  max={200}
                  className={`${inputClass} mt-1.5`}
                  value={config.layout[key]}
                  onChange={(event) =>
                    patch('layout', { [key]: Math.max(0, Number(event.target.value)) })
                  }
                />
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="样式">
        <ColorField
          label="坐标文字颜色"
          value={config.style.axisLabelColor}
          onChange={(axisLabelColor) => patch('style', { axisLabelColor })}
        />
        <FontSizeField
          label="X 轴字号"
          value={config.style.xAxisFontSize}
          onChange={(xAxisFontSize) => patch('style', { xAxisFontSize })}
        />
        <FontSizeField
          label="Y 轴字号"
          value={config.style.yAxisFontSize}
          onChange={(yAxisFontSize) => patch('style', { yAxisFontSize })}
        />
        <ColorField
          label="坐标轴标题颜色"
          value={config.style.axisTitleColor}
          onChange={(axisTitleColor) => patch('style', { axisTitleColor })}
        />
        <FontSizeField
          label="坐标轴标题字号"
          value={config.style.axisTitleFontSize}
          onChange={(axisTitleFontSize) => patch('style', { axisTitleFontSize })}
        />
        <ColorField
          label="图例文字颜色"
          value={config.style.legendColor}
          onChange={(legendColor) => patch('style', { legendColor })}
        />
        <FontSizeField
          label="图例字号"
          value={config.style.legendFontSize}
          onChange={(legendFontSize) => patch('style', { legendFontSize })}
        />
        <ColorField
          label="轴线与刻度颜色"
          value={config.style.axisLineColor}
          onChange={(axisLineColor) => patch('style', { axisLineColor })}
        />
        <ColorField
          label="网格线颜色"
          value={config.style.gridLineColor}
          onChange={(gridLineColor) => patch('style', { gridLineColor })}
        />
        {config.data.metricKeys.length > 0 && (
          <div className="space-y-3 border-t border-border pt-3">
            <p className={labelClass}>指标曲线颜色</p>
            {config.data.metricKeys.map((metricKey: string, index: number) => (
              <ColorField
                key={metricKey}
                label={metricLabel(metricKey)}
                value={asRecord(config.series[metricKey]).color || COLORS[index % COLORS.length]!}
                onChange={(color) => onChange(updateMetricColor(config, metricKey, color))}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="X 轴">
        <label className={checkClass}>
          <input
            type="checkbox"
            checked={config.xAxis.show}
            onChange={(event) => patch('xAxis', { show: event.target.checked })}
          />
          显示 X 轴
        </label>
        <label className={labelClass}>
          标题
          <input
            className={`${inputClass} mt-1.5`}
            value={config.xAxis.title}
            onChange={(event) => patch('xAxis', { title: event.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>
            时间格式
            <select
              className={`${inputClass} mt-1.5`}
              value={config.xAxis.timeFormat}
              onChange={(event) => patch('xAxis', { timeFormat: event.target.value })}
            >
              {['auto', 'HH:mm', 'MM-dd HH:mm', 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            标签策略
            <select
              className={`${inputClass} mt-1.5`}
              value={config.xAxis.labelStrategy}
              onChange={(event) => patch('xAxis', { labelStrategy: event.target.value })}
            >
              <option value="auto">自动</option>
              <option value="count">标签数量</option>
              <option value="interval">固定间隔</option>
            </select>
          </label>
        </div>
        {config.xAxis.labelStrategy === 'count' && (
          <label className={labelClass}>
            标签数量
            <input
              type="number"
              min={2}
              max={30}
              className={`${inputClass} mt-1.5`}
              value={config.xAxis.labelCount}
              onChange={(event) => patch('xAxis', { labelCount: Number(event.target.value) })}
            />
          </label>
        )}
        {config.xAxis.labelStrategy === 'interval' && (
          <label className={labelClass}>
            标签间隔
            <select
              className={`${inputClass} mt-1.5`}
              value={config.xAxis.labelInterval}
              onChange={(event) => patch('xAxis', { labelInterval: event.target.value })}
            >
              {AGGREGATION_WINDOWS.filter((item) => item !== 'no_aggregate').map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          标签旋转
          <input
            type="number"
            min={0}
            max={90}
            step={15}
            className={`${inputClass} mt-1.5`}
            value={config.xAxis.labelRotation}
            onChange={(event) => patch('xAxis', { labelRotation: Number(event.target.value) })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['showTicks', '刻度线'],
              ['showGrid', '网格线'],
              ['zoom', '缩放'],
              ['pan', '平移'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={checkClass}>
              <input
                type="checkbox"
                checked={!!config.xAxis[key]}
                onChange={(event) => patch('xAxis', { [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Y 轴">
        {config.yAxes.map((axis: any, index: number) => {
          const change = (next: Record<string, unknown>) =>
            onChange({
              ...config,
              yAxes: config.yAxes.map((item: any, itemIndex: number) =>
                itemIndex === index ? { ...item, ...next } : item,
              ),
            });
          return (
            <div key={axis.id} className="space-y-3 rounded-md border border-input p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Y 轴 {index + 1}</span>
                {config.yAxes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeYAxis(index)}
                  >
                    删除
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>绑定指标</label>
                {config.data.metricKeys.length ? (
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-2">
                    {config.data.metricKeys.map((metricKey: string) => {
                      const checked = assignedYAxisId(config, metricKey) === axis.id;
                      return (
                        <label
                          key={metricKey}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                onChange(assignMetricToYAxis(config, metricKey, axis.id));
                                return;
                              }
                              const fallbackAxis = config.yAxes.find(
                                (item: any) => item.id !== axis.id,
                              );
                              if (fallbackAxis) {
                                onChange(assignMetricToYAxis(config, metricKey, fallbackAxis.id));
                              }
                            }}
                          />
                          <span className="min-w-0 truncate" title={metricLabel(metricKey)}>
                            {metricLabel(metricKey)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">请先选择指标字段</p>
                )}
                <p className="text-xs text-muted-foreground">每个指标只能绑定一个 Y 轴。</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  标题
                  <input
                    className={`${inputClass} mt-1.5`}
                    value={axis.title || ''}
                    onChange={(event) => change({ title: event.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  单位
                  <input
                    className={`${inputClass} mt-1.5`}
                    value={axis.unit || ''}
                    onChange={(event) => change({ unit: event.target.value })}
                  />
                </label>
              </div>
              <label className={labelClass}>
                位置
                <select
                  className={`${inputClass} mt-1.5`}
                  value={axis.position}
                  onChange={(event) => change({ position: event.target.value })}
                >
                  <option value="left">左侧</option>
                  <option value="right">右侧</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  最小值
                  <select
                    className={`${inputClass} mt-1.5`}
                    value={axis.minMode}
                    onChange={(event) => change({ minMode: event.target.value })}
                  >
                    <option value="auto">自动</option>
                    <option value="fixed">固定</option>
                  </select>
                </label>
                <label className={labelClass}>
                  最大值
                  <select
                    className={`${inputClass} mt-1.5`}
                    value={axis.maxMode}
                    onChange={(event) => change({ maxMode: event.target.value })}
                  >
                    <option value="auto">自动</option>
                    <option value="fixed">固定</option>
                  </select>
                </label>
              </div>
              {(axis.minMode === 'fixed' || axis.maxMode === 'fixed') && (
                <div className="grid grid-cols-2 gap-2">
                  {axis.minMode === 'fixed' && (
                    <input
                      type="number"
                      aria-label="Y 轴最小值"
                      className={inputClass}
                      value={axis.min}
                      onChange={(event) => change({ min: Number(event.target.value) })}
                    />
                  )}
                  {axis.maxMode === 'fixed' && (
                    <input
                      type="number"
                      aria-label="Y 轴最大值"
                      className={inputClass}
                      value={axis.max}
                      onChange={(event) => change({ max: Number(event.target.value) })}
                    />
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  刻度策略
                  <select
                    className={`${inputClass} mt-1.5`}
                    value={axis.tickMode}
                    onChange={(event) => change({ tickMode: event.target.value })}
                  >
                    <option value="auto">自动</option>
                    <option value="split">分段数</option>
                    <option value="interval">固定间隔</option>
                  </select>
                </label>
                <label className={labelClass}>
                  小数位
                  <input
                    type="number"
                    min={0}
                    max={6}
                    className={`${inputClass} mt-1.5`}
                    value={axis.decimals}
                    onChange={(event) => change({ decimals: Number(event.target.value) })}
                  />
                </label>
              </div>
              {axis.tickMode === 'split' && (
                <label className={labelClass}>
                  分段数
                  <input
                    type="number"
                    min={2}
                    max={20}
                    className={`${inputClass} mt-1.5`}
                    value={axis.splitNumber}
                    onChange={(event) => change({ splitNumber: Number(event.target.value) })}
                  />
                </label>
              )}
              {axis.tickMode === 'interval' && (
                <label className={labelClass}>
                  固定刻度间隔
                  <input
                    type="number"
                    className={`${inputClass} mt-1.5`}
                    value={axis.interval}
                    onChange={(event) => change({ interval: Number(event.target.value) })}
                  />
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['showTicks', '刻度线'],
                    ['showGrid', '网格线'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={checkClass}>
                    <input
                      type="checkbox"
                      checked={!!axis[key]}
                      onChange={(event) => change({ [key]: event.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {config.yAxes.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...config,
                yAxes: [
                  ...config.yAxes,
                  {
                    ...DEFAULT_REALTIME_HISTORY_CONFIG.yAxes[0],
                    id: `y${Date.now()}`,
                    position: config.yAxes.length % 2 ? 'right' : 'left',
                    showGrid: false,
                  },
                ],
              })
            }
          >
            新增 Y 轴
          </Button>
        )}
      </Section>

      <Section title="高级">
        <label className={labelClass}>
          最大数据点数
          <input
            type="number"
            min={100}
            max={10000}
            className={`${inputClass} mt-1.5`}
            value={config.data.maxDataPoints}
            onChange={(event) => patchData({ maxDataPoints: Number(event.target.value) })}
          />
        </label>
        <label className={checkClass}>
          <input
            type="checkbox"
            checked={config.data.realtimeAppend}
            disabled={config.data.timeRange === 'custom'}
            onChange={(event) => patchData({ realtimeAppend: event.target.checked })}
          />
          实时追加{config.data.timeRange === 'custom' ? '（固定区间不可用）' : ''}
        </label>
      </Section>
    </div>
  );
}
