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

  it('switches the visible time range without changing the saved widget config', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { time_series: [] } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: {
        config: {
          ...defaults.config,
          data: { ...defaults.config.data, deviceId: 'dev-1', metricKeys: ['temperature'] },
        },
      },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const select = harness.element.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('last_1h');
    select.value = 'last_24h';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('time_range=last_24h');
    expect(defaults.config.data.timeRange).toBe('last_1h');
    harness.destroy();
  });

  it('shows a configurable title and a compact configured-range label', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: {
        config: {
          ...defaults.config,
          header: { show: true, title: '深圳龙华 PM2.5', fontSize: 20 },
          data: { ...defaults.config.data, timeRange: 'last_12h' },
        },
      },
    });
    const title = harness.element.children[1] as HTMLElement;
    expect(title.textContent).toBe('深圳龙华 PM2.5');
    expect(title.style.font).toContain('20px');
    const select = harness.element.querySelector('select') as HTMLSelectElement;
    expect(select.selectedOptions[0]?.textContent).toBe('最近 12 小时');
    expect((harness.element.children[0] as HTMLElement).style.top).toBe('40px');
    expect(chartMock.options.at(-1)?.grid?.top).toBe(40);
    harness.destroy();
  });

  it('lightens only the frosted range pill and keeps the arrow inset', async () => {
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    document.body.setAttribute('data-canvas-theme', 'frost');
    try {
      const harness = mountWidget(Main, {
        props: { config: { ...defaults.config, data: { ...defaults.config.data, timeRange: 'last_7d' } } },
      });
      const select = harness.element.querySelector('select') as HTMLSelectElement;
      const arrow = harness.element.querySelector('span[aria-hidden="true"]') as HTMLElement;
      expect(select.matches('[data-canvas-theme="frost"] .tv-history-range')).toBe(true);
      expect(harness.element.querySelector('style')?.textContent).toContain('rgba(255,255,255,.16)');
      expect(select.options[0]?.style.color).toBe('rgb(31, 41, 55)');
      expect(select.options[0]?.style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(Number.parseInt(select.style.width, 10)).toBeLessThan(148);
      expect(select.style.paddingRight).toBe('38px');
      expect(arrow.style.right).toBe('28px');
      harness.destroy();
    } finally {
      document.body.removeAttribute('data-canvas-theme');
    }
    const plain = mountWidget(Main, { props: { config: defaults.config } });
    expect(plain.element.querySelector('select')?.matches('[data-canvas-theme="frost"] .tv-history-range')).toBe(false);
    expect((plain.element.querySelector('select') as HTMLSelectElement).style.background).toContain('var(--w-surface');
    plain.destroy();
  });

  it('centers only the no-data message and resets its position while loading', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { time_series: [] } }) });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: { config: { ...defaults.config, data: { ...defaults.config.data, deviceId: 'dev-1', metricKeys: ['temperature'] } } },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });
    const status = harness.element.children[2] as HTMLElement;
    await vi.waitFor(() => expect(status.textContent).toBe('No data in the selected time range'));
    expect(status.style.top).toBe('calc(50% + 20px)');
    expect(status.style.transform).toBe('translate(-50%, -50%)');
    harness.update({ variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-2' } });
    expect(status.style.top).toBe('72px');
    harness.destroy();
  });

  it('retries with the backend-advertised aggregation window for 207004', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 207004,
          message: '查询时间范围超过30天，聚合间隔不能小于1h，当前配置为30m',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { time_series: [{ x: 1000000000000, y: 12.3 }] } }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        config: {
          ...defaults.config,
          data: {
            ...defaults.config.data,
            deviceId: 'dev-1',
            metricKeys: ['temperature'],
            timeRange: 'last_30d',
            aggregationMode: 'raw',
          },
        },
      },
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('aggregate_window=3h');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('aggregate_window=1h');
    harness.destroy();
  });

  it('normalizes partially persisted nested config before rendering', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { time_series: [{ x: 1000000000000, y: 26.1 }] } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      props: {
        config: {
          data: {
            deviceId: 'dev-1',
            metricKeys: ['temperature'],
            timeRange: 'last_1h',
          },
          series: {},
          layout: {},
          style: {},
          xAxis: {},
          yAxes: [{ id: 'y0' }],
          analysis: {},
        },
      } as any,
      variables: { platformApiBaseUrl: '/proxy-default', platformToken: 'token-1' },
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(chartMock.options.at(-1)?.yAxis).toHaveLength(1));
    expect(chartMock.options.at(-1)?.series?.[0]?.data).toEqual([[1000000000000, 26.1]]);
    harness.destroy();
  });

  it('renders bound platform history without calling the legacy history endpoint', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        data: [
          { timestamp: 1000000000000, value: 20 },
          { timestamp: 1000000001000, value: 21 },
        ],
        config: defaults.config,
      },
    });

    await vi.waitFor(() =>
      expect(chartMock.options.at(-1)?.series?.[0]?.data).toEqual([
        [1000000000000, 20],
        [1000000001000, 21],
      ]),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    harness.destroy();
  });

  it('shows a recognizable example curve before a device or metric is bound', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { props: { config: getDefaultProps().config } });

    await vi.waitFor(() =>
      expect(chartMock.options.at(-1)?.series?.[0]?.data?.length).toBeGreaterThanOrEqual(36),
    );
    expect(chartMock.options.at(-1)?.series?.[0]?.name).toBe('示例曲线');
    expect(chartMock.options.at(-1)?.legend?.formatter('示例曲线')).toBe('示例曲线');
    expect(fetchMock).not.toHaveBeenCalled();
    harness.destroy();
  });

  it('previews a template metric without querying the placeholder device', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        config: {
          ...defaults.config,
          data: { ...defaults.config.data, deviceId: '__template__', metricKeys: ['temperature'] },
        },
      },
    });

    await vi.waitFor(() => expect(chartMock.options.at(-1)?.series?.[0]?.name).toBe('示例曲线'));
    expect(chartMock.options.at(-1)?.legend?.selected).toHaveProperty('示例曲线', true);
    expect(fetchMock).not.toHaveBeenCalled();
    harness.destroy();
  });

  it('resolves a template curve to the runtime device in a device detail viewer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { time_series: [{ x: 1000000000000, y: 35 }] } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        config: {
          ...defaults.config,
          data: {
            ...defaults.config.data,
            deviceId: '__template__',
            metricKeys: ['pm25'],
            timeRange: 'last_12h',
          },
        },
      },
      variables: {
        deviceId: 'real-device-1',
        platformApiBaseUrl: '/proxy-default',
        platformToken: 'token-1',
      },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('device_id=real-device-1');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('time_range=last_12h');
    await vi.waitFor(() => expect(chartMock.options.at(-1)?.series?.[0]?.name).not.toBe('示例曲线'));
    expect(defaults.config.data.deviceId).toBe('');
    harness.destroy();
  });

  it('uses the selected field name and unit instead of the internal bound label', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        data: [{ timestamp: 1000000000000, value: 625.28 }],
        config: {
          ...defaults.config,
          data: { ...defaults.config.data, metricKeys: ['illuminance'] },
          series: { illuminance: { name: '光照强度', unit: 'lux' } },
        },
      },
    });

    await vi.waitFor(() => expect(chartMock.options.at(-1)?.series?.[0]?.name).toBe('光照强度'));
    const option = chartMock.options.at(-1) as any;
    expect(option.legend.formatter('光照强度')).toBe('光照强度（lux）');
    expect(option.yAxis[0].name).toBe('lux');
    expect(
      option.tooltip.formatter([
        {
          seriesId: 'illuminance',
          seriesName: '光照强度',
          value: [1000000000000, 625.28],
        },
      ]),
    ).toContain('625.28 lux');
    harness.destroy();
  });

  it('appends platform realtime data to a single bound history series', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { default: Main } = await import('./src/index');
    const defaults = getDefaultProps();
    const harness = mountWidget(Main, {
      props: {
        data: [{ timestamp: 1000000000000, value: 20 }],
        config: defaults.config,
      },
    });

    await vi.waitFor(() => expect(chartMock.options.at(-1)?.series?.[0]?.data).toHaveLength(1));
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'tv:platform-data',
          payload: { fieldId: 'temperature', value: 21, timestamp: 1000000001000 },
        },
      }),
    );
    expect(chartMock.options.at(-1)?.series?.[0]?.data).toEqual([
      [1000000000000, 20],
      [1000000001000, 21],
    ]);
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
    expect(option.grid).toMatchObject({ top: 40, right: 22, bottom: 23, left: 24 });
    expect(option.tooltip.axisPointer).toMatchObject({ type: 'cross', label: { show: false } });
    expect(option.legend.textStyle).toMatchObject({ color: '#334455', fontSize: 18 });
    expect(option.xAxis.axisLabel).toMatchObject({ color: '#112233', fontSize: 15 });
    expect(option.xAxis.nameTextStyle).toMatchObject({ color: '#223344', fontSize: 17 });
    expect(option.xAxis.axisLine.lineStyle.color).toBe('#445566');
    expect(option.xAxis.splitLine.lineStyle.color).toBe('#556677');
    expect(option.yAxis[0].axisLabel).toMatchObject({ color: '#112233', fontSize: 16 });
    expect(option.yAxis[0].axisLabel.formatter(40)).toBe('40.00');
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
    expect(option.yAxis[1].name).toBe('℃');
    expect(option.yAxis[1].axisLabel.formatter(40)).toBe('40.00');
  });
});
