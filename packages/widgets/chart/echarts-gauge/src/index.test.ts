import { describe, expect, it } from 'vitest';
import { getDefaultProps } from './schema';
import { buildOption } from './index';

const colors = {
  bg: '#07182e',
  fg: '#ffffff',
  primary: '#56d6ff',
  axis: '#334155',
  grid: '#1e293b',
  series: ['#56d6ff', '#4ce6c0'],
} as any;

function firstSeries(option: ReturnType<typeof buildOption>): any {
  return Array.isArray(option.series) ? option.series[0] : option.series;
}

describe('echarts gauge compatibility', () => {
  it('keeps legacy rendering defaults without thresholds', () => {
    const series = firstSeries(buildOption(getDefaultProps(), colors));
    expect(series.min).toBe(0);
    expect(series.max).toBe(100);
    expect(series.startAngle).toBe(210);
    expect(series.endAngle).toBe(-30);
    expect(series.progress.show).toBe(true);
    expect(series.pointer.show).toBe(true);
    expect(series.axisLine.lineStyle.color).toEqual([[1, colors.axis]]);
  });

  it('maps thresholds to colored axis segments and active colors', () => {
    const option = buildOption({
      ...getDefaultProps(),
      data: 58,
      max: 300,
      thresholds: [
        { value: 50, label: '优', color: '#22c55e' },
        { value: 100, label: '良', color: '#84cc16' },
        { value: 300, label: '污染', color: '#ef4444' },
      ],
      useThresholdColor: true,
    }, colors);
    const series = firstSeries(option);
    expect(series.axisLine.lineStyle.color).toEqual([
      [50 / 300, '#22c55e'],
      [100 / 300, '#84cc16'],
      [1, '#ef4444'],
    ]);
    expect(series.pointer.itemStyle.color).toBe('#84cc16');
    expect(series.detail.color).toBe('#84cc16');
  });
});
