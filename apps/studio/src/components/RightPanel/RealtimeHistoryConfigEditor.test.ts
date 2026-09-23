import { describe, expect, it } from 'vitest';
import {
  assignedYAxisId,
  assignMetricToYAxis,
  getMinimumAggregationWindow,
  toDatetimeLocalValue,
  updateAreaFill,
  updateMetricColor,
} from './RealtimeHistoryConfigEditor';

describe('RealtimeHistoryConfigEditor helpers', () => {
  it('matches API minimum aggregation windows for presets and custom ranges', () => {
    expect(getMinimumAggregationWindow({ timeRange: 'last_1h' })).toBe('30s');
    expect(getMinimumAggregationWindow({ timeRange: 'last_3h' })).toBe('30s');
    expect(getMinimumAggregationWindow({ timeRange: 'last_24h' })).toBe('5m');
    expect(getMinimumAggregationWindow({ timeRange: 'last_1y' })).toBe('1mo');
    expect(
      getMinimumAggregationWindow({ timeRange: 'custom', startTime: 0, endTime: 3 * 3600000 }),
    ).toBe('1m');
    expect(
      getMinimumAggregationWindow({ timeRange: 'custom', startTime: 0, endTime: 180 * 86400000 }),
    ).toBe('7d');
  });

  it('formats datetime-local values in local time rather than UTC', () => {
    const timestamp = new Date(2026, 6, 21, 14, 30).getTime();
    expect(toDatetimeLocalValue(timestamp)).toBe('2026-07-21T14:30');
  });

  it('assigns each metric to exactly one Y axis while preserving its series settings', () => {
    const config = {
      yAxes: [{ id: 'y0' }, { id: 'y1' }],
      series: { pressure: { name: '压力', color: '#123456', yAxisId: 'y0' } },
    };
    const next = assignMetricToYAxis(config, 'pressure', 'y1');
    expect(assignedYAxisId(next, 'pressure')).toBe('y1');
    expect(next.series.pressure).toMatchObject({
      name: '压力',
      color: '#123456',
      yAxisId: 'y1',
    });
    expect(assignedYAxisId({ yAxes: [{ id: 'main' }], series: {} }, 'temperature')).toBe('main');
  });

  it('updates one metric color without changing its Y-axis binding', () => {
    const config = {
      series: { pressure: { name: '压力', color: '#123456', yAxisId: 'y1' } },
    };
    const next = updateMetricColor(config, 'pressure', '#ee6666');
    expect(next.series.pressure).toEqual({
      name: '压力',
      color: '#ee6666',
      yAxisId: 'y1',
    });
  });

  it('toggles area fill for selected metrics without changing other series settings', () => {
    const config = {
      data: { metricKeys: ['pm25', 'pm10'] },
      series: {
        pm25: { color: '#123456', areaFill: 'none', areaOpacity: 0.3 },
        pm10: { color: '#654321', areaFill: 'gradient', areaOpacity: 0.4 },
      },
    };
    const enabled = updateAreaFill(config, true);
    expect(enabled.series.pm25).toEqual({ color: '#123456', areaFill: 'solid', areaOpacity: 0.3 });
    expect(enabled.series.pm10).toEqual({
      color: '#654321',
      areaFill: 'gradient',
      areaOpacity: 0.4,
    });
    const disabled = updateAreaFill(enabled, false);
    expect(disabled.series.pm25.areaFill).toBe('none');
    expect(disabled.series.pm10.areaFill).toBe('none');
    expect(config.series.pm25.areaFill).toBe('none');
  });
});
