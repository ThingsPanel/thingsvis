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
    const series = firstSeries(buildOption({ ...getDefaultProps(), data: 67 }, colors));
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
      colorMode: 'three',
      lowMax: 50,
      mediumMax: 100,
      lowColor: '#22c55e',
      mediumColor: '#84cc16',
      highColor: '#ef4444',
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
