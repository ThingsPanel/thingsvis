import type { RealtimeHistoryConfig } from './schema';

export type TimePoint = { time: number; value: number | null };
export type HistoryResult = {
  points: TimePoint[];
  start: number;
  end: number;
  fileName?: string;
  filePath?: string;
};

export const TIME_RANGE_MS: Record<string, number> = {
  last_5m: 300000,
  last_15m: 900000,
  last_30m: 1800000,
  last_1h: 3600000,
  last_3h: 10800000,
  last_6h: 21600000,
  last_12h: 43200000,
  last_24h: 86400000,
  last_3d: 259200000,
  last_7d: 604800000,
  last_15d: 1296000000,
  last_30d: 2592000000,
  last_60d: 5184000000,
  last_90d: 7776000000,
  last_6m: 15552000000,
  last_1y: 31536000000,
};

export const WINDOW_MS: Record<string, number> = {
  no_aggregate: 0,
  '30s': 30000,
  '1m': 60000,
  '2m': 120000,
  '5m': 300000,
  '10m': 600000,
  '30m': 1800000,
  '1h': 3600000,
  '3h': 10800000,
  '6h': 21600000,
  '1d': 86400000,
  '7d': 604800000,
  '1mo': 2592000000,
};

const WINDOWS = Object.keys(WINDOW_MS);

export function getTimeBounds(data: RealtimeHistoryConfig['data'], now = Date.now()) {
  if (data.timeRange === 'custom') return { start: data.startTime, end: data.endTime };
  return { start: now - (TIME_RANGE_MS[data.timeRange] ?? TIME_RANGE_MS.last_1h!), end: now };
}

export function minimumWindowForSpan(spanMs: number): string {
  if (spanMs < 3 * 3600000) return 'no_aggregate';
  if (spanMs < 6 * 3600000) return '30s';
  if (spanMs < 12 * 3600000) return '1m';
  if (spanMs < 24 * 3600000) return '2m';
  if (spanMs < 3 * 86400000) return '5m';
  if (spanMs < 7 * 86400000) return '10m';
  if (spanMs < 15 * 86400000) return '30m';
  if (spanMs < 30 * 86400000) return '1h';
  if (spanMs < 60 * 86400000) return '3h';
  if (spanMs < 90 * 86400000) return '6h';
  if (spanMs < 180 * 86400000) return '1d';
  if (spanMs < 365 * 86400000) return '7d';
  return '1mo';
}

export function minimumWindowForData(
  data: RealtimeHistoryConfig['data'],
  now = Date.now(),
): string {
  const bounds = getTimeBounds(data, now);
  const minimum = minimumWindowForSpan(Math.max(1, bounds.end - bounds.start));
  // The API documents a stricter boundary for manually selected ranges:
  // custom ranges >= 3h cannot use either raw or 30-second aggregation.
  return data.timeRange === 'custom' &&
    bounds.end - bounds.start >= 3 * 3600000 &&
    minimum === '30s'
    ? '1m'
    : minimum;
}

export function resolveAggregation(
  data: RealtimeHistoryConfig['data'],
  now = Date.now(),
  overriddenBounds?: { start: number; end: number },
) {
  const bounds = overriddenBounds ?? getTimeBounds(data, now);
  const span = Math.max(1, bounds.end - bounds.start);
  let minimum = minimumWindowForSpan(span);
  if (data.timeRange === 'custom' && span >= 3 * 3600000 && minimum === '30s') minimum = '1m';
  if (data.aggregationMode === 'raw') {
    return {
      window: minimum === 'no_aggregate' ? 'no_aggregate' : minimum,
      // Once the API forces an aggregate window, aggregate_function is mandatory.
      fn: minimum === 'no_aggregate' ? undefined : data.aggregationFunction,
    };
  }
  if (data.aggregationMode === 'custom') {
    const requestedMs = WINDOW_MS[data.aggregationWindow] ?? 0;
    const minimumMs = WINDOW_MS[minimum] ?? 0;
    const window = requestedMs >= minimumMs ? data.aggregationWindow : minimum;
    return { window, fn: window === 'no_aggregate' ? undefined : data.aggregationFunction };
  }
  const targetMs = span / Math.max(100, data.maxDataPoints);
  const minimumMs = WINDOW_MS[minimum] ?? 0;
  const window =
    WINDOWS.find((item) => (WINDOW_MS[item] ?? 0) >= Math.max(targetMs, minimumMs)) ?? '1mo';
  return { window, fn: window === 'no_aggregate' ? undefined : data.aggregationFunction };
}

function parseTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value))
    return value > 1e11 ? value : value * 1000;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 1e9) return numeric > 1e11 ? numeric : numeric * 1000;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeHistoryResponse(payload: unknown): HistoryResult {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, any>) : {};
  const data =
    root.data && typeof root.data === 'object' ? (root.data as Record<string, any>) : root;
  const rows = Array.isArray(data.time_series) ? data.time_series : Array.isArray(data) ? data : [];
  const deduped = new Map<number, number | null>();
  rows.forEach((row: unknown) => {
    const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const time = parseTime(record.x ?? record.ts ?? record.time ?? record.timestamp);
    const raw = record.y ?? record.value;
    const value = raw == null ? null : Number(raw);
    if (time !== null && (value === null || Number.isFinite(value))) deduped.set(time, value);
  });
  const points = Array.from(deduped, ([time, value]) => ({ time, value })).sort(
    (a, b) => a.time - b.time,
  );
  const range =
    data.x_time_range && typeof data.x_time_range === 'object'
      ? (data.x_time_range as Record<string, unknown>)
      : {};
  return {
    points,
    start: parseTime(range.start) ?? points[0]?.time ?? 0,
    end: parseTime(range.end) ?? points[points.length - 1]?.time ?? 0,
    fileName: typeof data.file_name === 'string' ? data.file_name : undefined,
    filePath: typeof data.file_path === 'string' ? data.file_path : undefined,
  };
}

export function buildHistoryUrl(
  baseUrl: string,
  data: RealtimeHistoryConfig['data'],
  key: string,
  options?: { export?: boolean; start?: number; end?: number },
) {
  const cleanBase = (baseUrl || '/proxy-default').replace(/\/$/, '');
  const endpoint = `${cleanBase}/telemetry/datas/statistic`;
  const explicitBounds =
    options?.start != null && options?.end != null
      ? { start: options.start, end: options.end }
      : data.timeRange === 'custom'
        ? { start: data.startTime, end: data.endTime }
        : undefined;
  if (explicitBounds && explicitBounds.end <= explicitBounds.start) {
    throw new Error('结束时间必须晚于开始时间');
  }
  const aggregationData =
    options?.start != null && options?.end != null
      ? { ...data, timeRange: 'custom' as const, startTime: options.start, endTime: options.end }
      : data;
  const aggregation = resolveAggregation(aggregationData, options?.end, explicitBounds);
  const params = new URLSearchParams({
    device_id: data.deviceId,
    key,
    aggregate_window: aggregation.window,
  });
  if (options?.start != null && options?.end != null) {
    params.set('time_range', 'custom');
    params.set('start_time', String(options.start));
    params.set('end_time', String(options.end));
  } else {
    params.set('time_range', data.timeRange);
    if (data.timeRange === 'custom') {
      params.set('start_time', String(data.startTime));
      params.set('end_time', String(data.endTime));
    }
  }
  if (aggregation.fn) params.set('aggregate_function', aggregation.fn);
  if (options?.export) params.set('is_export', 'true');
  return `${endpoint}?${params.toString()}`;
}

export function normalizeTimestamp(value: unknown, fallback = Date.now()): number {
  return parseTime(value) ?? fallback;
}

export function appendRealtime(
  points: TimePoint[],
  point: TimePoint,
  maxPoints: number,
): TimePoint[] {
  const map = new Map(points.map((item) => [item.time, item.value]));
  map.set(point.time, point.value);
  return Array.from(map, ([time, value]) => ({ time, value }))
    .sort((a, b) => a.time - b.time)
    .slice(-maxPoints);
}

/** Largest-Triangle-Three-Buckets keeps the full time span and preserves visual peaks. */
export function limitPoints(points: TimePoint[], maxPoints: number): TimePoint[] {
  if (points.length <= maxPoints) return points;
  if (maxPoints <= 1) return [points[points.length - 1]!];
  if (maxPoints === 2) return [points[0]!, points[points.length - 1]!];
  const sampled: TimePoint[] = [points[0]!];
  const bucketWidth = (points.length - 2) / (maxPoints - 2);
  let selectedIndex = 0;
  for (let bucket = 0; bucket < maxPoints - 2; bucket += 1) {
    const averageStart = Math.floor((bucket + 1) * bucketWidth) + 1;
    const averageEnd = Math.min(Math.floor((bucket + 2) * bucketWidth) + 1, points.length);
    const averageSlice = points.slice(averageStart, averageEnd);
    const averageTime = averageSlice.length
      ? averageSlice.reduce((sum, point) => sum + point.time, 0) / averageSlice.length
      : points[points.length - 1]!.time;
    const averageValue = averageSlice.length
      ? averageSlice.reduce((sum, point) => sum + (point.value ?? 0), 0) / averageSlice.length
      : (points[points.length - 1]!.value ?? 0);
    const rangeStart = Math.floor(bucket * bucketWidth) + 1;
    const rangeEnd = Math.min(Math.floor((bucket + 1) * bucketWidth) + 1, points.length - 1);
    const anchor = points[selectedIndex]!;
    let maxArea = -1;
    let nextIndex = rangeStart;
    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const candidate = points[index]!;
      const area = Math.abs(
        (anchor.time - averageTime) * ((candidate.value ?? 0) - (anchor.value ?? 0)) -
          (anchor.time - candidate.time) * (averageValue - (anchor.value ?? 0)),
      );
      if (area > maxArea) {
        maxArea = area;
        nextIndex = index;
      }
    }
    selectedIndex = nextIndex;
    sampled.push(points[selectedIndex]!);
  }
  sampled.push(points[points.length - 1]!);
  return sampled;
}

export function comparisonOffset(
  mode: RealtimeHistoryConfig['analysis']['comparison'],
  spanMs: number,
  custom: number,
) {
  if (mode === 'previous') return spanMs;
  if (mode === 'day') return 86400000;
  if (mode === 'week') return 604800000;
  if (mode === 'month') return 2592000000;
  if (mode === 'year') return 31536000000;
  if (mode === 'custom') return custom;
  return 0;
}
