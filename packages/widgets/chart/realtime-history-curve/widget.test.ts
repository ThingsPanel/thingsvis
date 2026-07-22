import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { getDefaultProps } from './src/schema';

const chartMock = {
  options: [] as any[],
  setOption(option: any) {
    this.options.push(option);
  },
  resize() {},
  dispose() {},
  isDisposed() {
    return false;
  },
};

vi.mock('echarts', () => ({
  init: () => chartMock,
  graphic: {
    LinearGradient: class {
      constructor(..._args: unknown[]) {}
    },
  },
}));

describe('chart/realtime-history-curve widget runtime', () => {
  beforeEach(() => {
    chartMock.options = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('loads history through the statistic HTTP endpoint with runtime token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { time_series: [{ x: '2026-01-01T00:00:00Z', y: 12.3 }] } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: {
        ...defaults.config.data,
        deviceId: 'dev-1',
        metricKeys: ['temperature'],
        aggregationMode: 'raw' as const,
      },
      series: {
        temperature: {
          name: '温度',
          unit: '℃',
          decimals: 1,
          color: '#5470c6',
          lineWidth: 2,
          curve: 'straight' as const,
          showPoints: 'auto' as const,
          pointSize: 5,
          areaFill: 'none' as const,
          areaOpacity: 0.2,
          segmentColor: false,
          yAxisId: 'y0',
          hidden: false,
        },
      },
    };
    const harness = mountWidget(Main, {
      props: { config },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/proxy-default/telemetry/datas/statistic');
    expect(String(url)).toContain('key=temperature');
    expect(init.headers).toEqual({ 'x-token': 'token-1' });
    await vi.waitFor(() =>
      expect(chartMock.options.at(-1)?.series?.[0]?.data).toEqual([
        [Date.parse('2026-01-01T00:00:00Z'), 12.3],
      ]),
    );
    harness.destroy();
  });

  it('appends matching WebSocket telemetry without replacing HTTP history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { time_series: [{ x: 1000000000000, y: 1 }] } }),
      }),
    );
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: {
        ...defaults.config.data,
        deviceId: 'dev-1',
        metricKeys: ['temperature'],
        realtimeAppend: true,
      },
      series: {
        temperature: {
          name: '温度',
          unit: '℃',
          decimals: 1,
          color: '#5470c6',
          lineWidth: 2,
          curve: 'straight' as const,
          showPoints: 'auto' as const,
          pointSize: 5,
          areaFill: 'none' as const,
          areaOpacity: 0.2,
          segmentColor: false,
          yAxisId: 'y0',
          hidden: false,
        },
      },
    };
    const harness = mountWidget(Main, {
      props: { config },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    await vi.waitFor(() => expect(chartMock.options.at(-1)?.series?.[0]?.data?.length).toBe(1));
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'tv:platform-data',
          payload: {
            deviceId: 'dev-1',
            fieldId: 'temperature',
            value: 2,
            timestamp: 1000000001000,
          },
        },
      }),
    );
    expect(chartMock.options.at(-1).series[0].data).toEqual([
      [1000000000000, 1],
      [1000000001000, 2],
    ]);
    harness.destroy();
  });

  it('requests each selected metric separately and exports through the same API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { time_series: [{ x: 1000000000000, y: 1 }] } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: { ...defaults.config.data, deviceId: 'dev-1', metricKeys: ['temperature', 'pressure'] },
    };
    const harness = mountWidget(Main, {
      props: { config },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      fetchMock.mock.calls
        .map(([url]) => new URL(String(url), 'http://localhost').searchParams.get('key'))
        .sort(),
    ).toEqual(['pressure', 'temperature']);
    const exportButton = harness.element.querySelector('button') as HTMLButtonElement;
    exportButton.click();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(
      fetchMock.mock.calls
        .slice(2)
        .every(
          ([url]) =>
            new URL(String(url), 'http://localhost').searchParams.get('is_export') === 'true',
        ),
    ).toBe(true);
    harness.destroy();
  });

  it('renders fallback series, exact X interval, same-side Y offsets and linear null interpolation', async () => {
    const { buildChartOption } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: { ...defaults.config.data, metricKeys: ['temperature'] },
      series: {},
      layout: {
        ...defaults.config.layout,
        marginMode: 'custom' as const,
        top: 21,
        right: 22,
        bottom: 23,
        left: 24,
      },
      style: {
        ...defaults.config.style,
        axisLabelColor: '#112233',
        xAxisFontSize: 15,
        yAxisFontSize: 16,
        axisTitleColor: '#223344',
        axisTitleFontSize: 17,
        legendColor: '#334455',
        legendFontSize: 18,
        axisLineColor: '#445566',
        gridLineColor: '#556677',
      },
      xAxis: { ...defaults.config.xAxis, labelStrategy: 'interval' as const, labelInterval: '1h' },
      yAxes: [
        { ...defaults.config.yAxes[0]!, id: 'y0', position: 'left' as const },
        { ...defaults.config.yAxes[0]!, id: 'y1', position: 'left' as const },
        { ...defaults.config.yAxes[0]!, id: 'y2', position: 'right' as const },
      ],
      analysis: {
        ...defaults.config.analysis,
        nullHandling: 'linear' as const,
        interpolationMaxGapMs: 5000,
      },
    };
    const option = buildChartOption(
      config,
      [
        {
          key: 'temperature',
          points: [
            { time: 1000, value: 0 },
            { time: 2000, value: null },
            { time: 3000, value: 10 },
          ],
          statPoints: [
            { time: 1000, value: 0 },
            { time: 1500, value: 100 },
            { time: 3000, value: 10 },
          ],
          comparison: [],
        },
      ],
      { fg: '#111', axis: '#ddd', series: ['#123456'] } as any,
    ) as any;
    expect(option.series[0].name).toBe('temperature');
    expect(option.series[0].data).toEqual([
      [1000, 0],
      [2000, 5],
      [3000, 10],
    ]);
    expect(option.xAxis.interval).toBe(3600000);
    expect(option.yAxis.map((axis: any) => axis.offset)).toEqual([0, 48, 0]);
    expect(option.legend.formatter('temperature')).toBe('temperature');
    expect(option.grid).toMatchObject({ top: 21, right: 22, bottom: 23, left: 24 });
    expect(option.tooltip.axisPointer).toMatchObject({ type: 'cross', label: { show: false } });
    expect(option.legend.textStyle).toMatchObject({ color: '#334455', fontSize: 18 });
    expect(option.xAxis.axisLabel).toMatchObject({ color: '#112233', fontSize: 15 });
    expect(option.xAxis.nameTextStyle).toMatchObject({ color: '#223344', fontSize: 17 });
    expect(option.xAxis.axisLine.lineStyle.color).toBe('#445566');
    expect(option.xAxis.splitLine.lineStyle.color).toBe('#556677');
    expect(option.yAxis[0].axisLabel).toMatchObject({ color: '#112233', fontSize: 16 });
  });

  it('does not call the protected history endpoint without a platform token', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: { ...defaults.config.data, deviceId: 'dev-1', metricKeys: ['temperature'] },
    };
    const harness = mountWidget(Main, {
      props: { config },
      variables: { platformApiBaseUrl: '/proxy-default' },
    });
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(harness.element.textContent).toContain('API');
    harness.destroy();
  });

  it('renders previously saved configs that do not contain layout or style sections', async () => {
    const { buildChartOption } = await import('./src/index');
    const defaults = getDefaultProps();
    const legacyConfig = {
      ...defaults.config,
      data: { ...defaults.config.data, metricKeys: ['temperature'] },
      series: {},
    } as any;
    delete legacyConfig.layout;
    delete legacyConfig.style;

    const option = buildChartOption(
      legacyConfig,
      [{ key: 'temperature', points: [{ time: 1000, value: 8 }], comparison: [] }],
      { fg: '#eef2ff', axis: '#334155', series: ['#91cc75'] } as any,
    ) as any;

    expect(option.grid).toMatchObject({ top: 40, right: 16, bottom: 8, left: 16 });
    expect(option.xAxis.axisLabel).toMatchObject({ color: '#eef2ff', fontSize: 12 });
    expect(option.xAxis.splitLine.lineStyle.color).toBe('#334155');
    expect(option.series[0].lineStyle.color).toBe('#6965db');

    const titledOption = buildChartOption(
      {
        ...legacyConfig,
        xAxis: { ...legacyConfig.xAxis, title: '时间' },
      },
      [{ key: 'temperature', points: [{ time: 1000, value: 8 }], comparison: [] }],
      { fg: '#eef2ff', axis: '#334155', series: ['#91cc75'] } as any,
    ) as any;
    expect(titledOption.grid.bottom).toBe(24);
    expect(titledOption.xAxis).toMatchObject({ name: '时间', nameGap: 26 });
  });

  it('keeps current history visible when only the comparison request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            time_series: [{ x: 1000000000000, y: 8 }],
            x_time_range: { start: 1000000000000, end: 1000000001000 },
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: { ...defaults.config.data, deviceId: 'dev-1', metricKeys: ['temperature'] },
      analysis: { ...defaults.config.analysis, comparison: 'day' as const },
    };
    const harness = mountWidget(Main, {
      props: { config },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await vi.waitFor(() =>
      expect(chartMock.options.at(-1)?.series?.[0]?.data).toEqual([[1000000000000, 8]]),
    );
    expect(harness.element.textContent).toContain('同期数据查询失败');
    harness.destroy();
  });

  it('applies series styling, threshold coloring, Y-axis assignment and tooltip units', async () => {
    const { buildChartOption } = await import('./src/index');
    const defaults = getDefaultProps();
    const config = {
      ...defaults.config,
      data: { ...defaults.config.data, metricKeys: ['temperature'] },
      series: {
        temperature: {
          name: '温度',
          unit: '℃',
          decimals: 1,
          color: '#ff0000',
          lineWidth: 3,
          curve: 'step-middle' as const,
          showPoints: 'show' as const,
          pointSize: 7,
          areaFill: 'solid' as const,
          areaOpacity: 0.3,
          segmentColor: true,
          yAxisId: 'y1',
          hidden: false,
        },
      },
      yAxes: [
        { ...defaults.config.yAxes[0]!, id: 'y0' },
        { ...defaults.config.yAxes[0]!, id: 'y1', position: 'right' as const, unit: '℃' },
      ],
      analysis: {
        ...defaults.config.analysis,
        thresholds: [
          {
            id: 'high',
            name: '高温',
            operator: '>=' as const,
            value: 80,
            color: '#ff9900',
            lineStyle: 'dashed' as const,
            lineWidth: 2,
            showValue: true,
            colorBreached: true,
            yAxisId: 'y1',
          },
        ],
      },
    };
    const option = buildChartOption(
      config,
      [{ key: 'temperature', points: [{ time: 1000, value: 81.25 }], comparison: [] }],
      { fg: '#111', axis: '#ddd', series: [] } as any,
    ) as any;
    expect(option.series[0]).toMatchObject({
      name: '温度',
      yAxisIndex: 1,
      step: 'middle',
      showSymbol: true,
      symbolSize: 7,
    });
    expect(option.series[0].lineStyle).toMatchObject({ color: '#ff0000', width: 3 });
    expect(option.series[0].markLine.data[0]).toMatchObject({ name: '高温', yAxis: 80 });
    expect(option.visualMap[0].pieces[0]).toMatchObject({ gte: 80, color: '#ff9900' });
    const tooltip = option.tooltip.formatter([
      {
        seriesId: 'temperature',
        seriesName: '温度',
        seriesIndex: 0,
        marker: '',
        value: [1000, 81.25],
      },
    ]);
    expect(tooltip).toContain('81.3 ℃');
  });
});
