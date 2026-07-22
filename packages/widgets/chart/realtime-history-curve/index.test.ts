import { describe, expect, it } from 'vitest';
import { getDefaultProps } from './src/schema';
import {
  appendRealtime,
  buildHistoryUrl,
  limitPoints,
  minimumWindowForData,
  normalizeHistoryResponse,
  normalizeTimestamp,
  resolveAggregation,
} from './src/history';

describe('chart/realtime-history-curve history contract', () => {
  it.each([
    ['last_3h', '30s'],
    ['last_6h', '1m'],
    ['last_12h', '2m'],
    ['last_24h', '5m'],
    ['last_3d', '10m'],
    ['last_7d', '30m'],
    ['last_15d', '1h'],
    ['last_30d', '3h'],
    ['last_60d', '6h'],
    ['last_90d', '1d'],
    ['last_6m', '7d'],
    ['last_1y', '1mo'],
  ] as const)('enforces the API minimum window for %s', (timeRange, expectedWindow) => {
    const data = { ...getDefaultProps().config.data, timeRange, aggregationMode: 'raw' as const };
    expect(resolveAggregation(data).window).toBe(expectedWindow);
  });

  it('uses the ThingsPanel telemetry statistic endpoint and one metric key', () => {
    const data = {
      ...getDefaultProps().config.data,
      deviceId: 'dev-1',
      metricKeys: ['temperature'],
      timeRange: 'last_1h' as const,
      aggregationMode: 'raw' as const,
    };
    const url = new URL(buildHistoryUrl('/proxy-default', data, 'temperature'), 'http://localhost');
    expect(url.pathname).toBe('/proxy-default/telemetry/datas/statistic');
    expect(url.searchParams.get('device_id')).toBe('dev-1');
    expect(url.searchParams.get('key')).toBe('temperature');
    expect(url.searchParams.get('time_range')).toBe('last_1h');
    expect(url.searchParams.get('aggregate_window')).toBe('no_aggregate');
    expect(url.searchParams.has('aggregate_function')).toBe(false);
  });

  it('forces a legal aggregation window for ranges that cannot use raw data', () => {
    const data = {
      ...getDefaultProps().config.data,
      timeRange: 'last_24h' as const,
      aggregationMode: 'raw' as const,
    };
    expect(resolveAggregation(data).window).toBe('5m');
    expect(resolveAggregation(data).fn).toBe('avg');
  });

  it('applies the stricter three-hour boundary to custom ranges', () => {
    const data = {
      ...getDefaultProps().config.data,
      timeRange: 'custom' as const,
      startTime: 0,
      endTime: 3 * 3600000,
      aggregationMode: 'custom' as const,
      aggregationWindow: '30s' as const,
    };
    expect(minimumWindowForData(data)).toBe('1m');
    expect(resolveAggregation(data).window).toBe('1m');
    const preset = {
      ...getDefaultProps().config.data,
      timeRange: 'last_3h' as const,
      aggregationMode: 'custom' as const,
      aggregationWindow: '30s' as const,
    };
    const comparisonUrl = new URL(
      buildHistoryUrl('/proxy-default', preset, 'temperature', { start: 0, end: 3 * 3600000 }),
      'http://localhost',
    );
    expect(comparisonUrl.searchParams.get('aggregate_window')).toBe('1m');
  });

  it('selects an automatic interval from span and maximum data points', () => {
    const data = {
      ...getDefaultProps().config.data,
      timeRange: 'last_1h' as const,
      aggregationMode: 'auto' as const,
      maxDataPoints: 100,
    };
    expect(resolveAggregation(data).window).toBe('1m');
    expect(resolveAggregation(data).fn).toBe('avg');
  });

  it('normalizes, orders and de-duplicates API time_series responses', () => {
    const result = normalizeHistoryResponse({
      data: {
        time_series: [
          { x: '2026-01-01T00:01:00Z', y: 2 },
          { x: '2026-01-01T00:00:00Z', y: 1 },
          { x: '2026-01-01T00:01:00Z', y: 3 },
        ],
        x_time_range: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T01:00:00Z' },
      },
    });
    expect(result.points.map((point) => point.value)).toEqual([1, 3]);
    expect(result.start).toBe(Date.parse('2026-01-01T00:00:00Z'));
  });

  it('deduplicates real-time overlap and enforces max points', () => {
    const points = [
      { time: 1, value: 1 },
      { time: 2, value: 2 },
    ];
    expect(appendRealtime(points, { time: 2, value: 20 }, 2)).toEqual([
      { time: 1, value: 1 },
      { time: 2, value: 20 },
    ]);
    expect(appendRealtime(points, { time: 3, value: 3 }, 2)).toEqual([
      { time: 2, value: 2 },
      { time: 3, value: 3 },
    ]);
  });

  it('limits render points without discarding the beginning of the requested range', () => {
    const points = Array.from({ length: 11 }, (_, time) => ({
      time,
      value: time === 5 ? 100 : time,
    }));
    const limited = limitPoints(points, 4);
    expect(limited).toHaveLength(4);
    expect(limited[0]).toEqual({ time: 0, value: 0 });
    expect(limited.at(-1)).toEqual({ time: 10, value: 10 });
    expect(limited).toContainEqual({ time: 5, value: 100 });
  });

  it('uses the same endpoint for API-backed export', () => {
    const data = { ...getDefaultProps().config.data, deviceId: 'dev-1' };
    const url = new URL(
      buildHistoryUrl('/proxy-default', data, 'temperature', { export: true }),
      'http://localhost',
    );
    expect(url.searchParams.get('is_export')).toBe('true');
    const exportResult = normalizeHistoryResponse({
      data: { file_name: 'telemetry.csv', file_path: 'files\\excel\\telemetry.csv' },
    });
    expect(exportResult.fileName).toBe('telemetry.csv');
    expect(exportResult.filePath).toBe('files\\excel\\telemetry.csv');
  });

  it('sends custom bounds and the selected aggregation function', () => {
    const data = {
      ...getDefaultProps().config.data,
      deviceId: 'dev-1',
      timeRange: 'custom' as const,
      startTime: 1_700_000_000_000,
      endTime: 1_700_003_600_000,
      aggregationMode: 'custom' as const,
      aggregationWindow: '10m' as const,
      aggregationFunction: 'max' as const,
    };
    const url = new URL(buildHistoryUrl('/proxy-default', data, 'pressure'), 'http://localhost');
    expect(url.searchParams.get('time_range')).toBe('custom');
    expect(url.searchParams.get('start_time')).toBe(String(data.startTime));
    expect(url.searchParams.get('end_time')).toBe(String(data.endTime));
    expect(url.searchParams.get('aggregate_window')).toBe('10m');
    expect(url.searchParams.get('aggregate_function')).toBe('max');
  });

  it('rejects an invalid custom time range before issuing a request', () => {
    const data = {
      ...getDefaultProps().config.data,
      timeRange: 'custom' as const,
      startTime: 20,
      endTime: 10,
    };
    expect(() => buildHistoryUrl('/proxy-default', data, 'temperature')).toThrow(
      '结束时间必须晚于开始时间',
    );
  });

  it('normalizes real-time timestamps expressed in seconds or milliseconds', () => {
    expect(normalizeTimestamp(1_700_000_000)).toBe(1_700_000_000_000);
    expect(normalizeTimestamp(1_700_000_000_000)).toBe(1_700_000_000_000);
  });
});
