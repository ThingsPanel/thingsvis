import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

class UPlotMock {
  static paths = {
    spline: () => undefined,
    linear: () => undefined,
  };

  static lastData: unknown = null;
  static lastOpts: unknown = null;
  static throwOnConstruct = false;

  root: HTMLDivElement;

  constructor(opts: unknown, data: unknown, target: HTMLElement) {
    UPlotMock.lastOpts = opts;
    UPlotMock.lastData = data;
    if (UPlotMock.throwOnConstruct) {
      throw new RangeError('Invalid array length');
    }
    this.root = document.createElement('div');
    this.root.className = 'uplot';
    target.appendChild(this.root);
  }

  setSize() {}
  destroy() {
    this.root.remove();
  }
}

vi.mock('uplot', () => ({
  default: UPlotMock,
}));

vi.mock('uplot/dist/uPlot.min.css', () => ({}));

describe('chart/uplot-line widget', () => {
  beforeEach(() => {
    UPlotMock.lastData = null;
    UPlotMock.lastOpts = null;
    UPlotMock.throwOnConstruct = false;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('shows localized preview guidance when no time-series data is configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [],
      },
    });

    expect(harness.element.textContent).toContain('Waiting for time series data');

    harness.destroy();
  });

  it('matches the generic ECharts line defaults for line, fill, points and grid', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [
          { timestamp: '2026-01-01T00:00:00Z', value: 18 },
          { timestamp: '2026-01-01T01:00:00Z', value: 22 },
        ],
      },
    });

    const opts = UPlotMock.lastOpts as {
      padding?: number[];
      scales?: {
        y?: {
          auto?: boolean;
          range?: (self: unknown, min: number, max: number) => [number, number];
        };
      };
      axes: Array<{
        grid?: { show?: boolean; dash?: number[] };
        ticks?: { width?: number };
        gap?: number;
        size?: number | ((self: unknown, values: string[]) => number);
      }>;
      series: Array<{
        fill?: string;
        paths?: unknown;
        points?: { show?: boolean; fill?: string; width?: number };
      }>;
    };

    expect(Main.defaultProps.showArea).toBe(false);
    expect(Main.defaultProps.smooth).toBe(false);
    expect(Main.defaultProps.lineWidth).toBe(1.5);
    expect(Main.defaultProps.yAxisMin).toBeNull();
    expect(Main.defaultProps.yAxisMax).toBeNull();
    const minimumControl = Main.controls.groups
      .flatMap((group) => group.fields)
      .find((field) => field.path === 'yAxisMin');
    expect(minimumControl).toMatchObject({ allowEmpty: true });
    expect(
      Main.controls.groups
        .flatMap((group) => group.fields)
        .some((field) => field.path === 'timeRangePreset'),
    ).toBe(false);
    expect(opts.axes[0]?.grid?.show).toBe(false);
    expect(opts.axes[1]?.grid?.dash).toBeUndefined();
    expect(opts.axes[1]?.ticks?.width).toBe(1);
    expect(opts.padding?.[0]).toBeLessThanOrEqual(6);
    expect(opts.axes[0]?.gap).toBeGreaterThanOrEqual(3);
    expect(typeof opts.axes[1]?.size).toBe('function');
    const yAxisSize = opts.axes[1]?.size as (self: unknown, values: string[]) => number;
    expect(yAxisSize(null, ['0', '25', '50'])).toBeLessThan(50);
    expect(opts.series[1]?.fill).toBeUndefined();
    expect(opts.series[1]?.points).toMatchObject({ show: false, fill: '#ffffff', width: 2 });

    expect(opts.scales?.y?.auto).toBe(true);
    expect(opts.scales?.y?.range?.(null, 12, 48)).toEqual([12, 48]);

    harness.destroy();
  });

  it('provides a dense 24-hour standalone preview with 5-minute samples', async () => {
    const { default: Main } = await import('./src/index');
    const previewData = Main.standaloneDefaults?.data as Array<{
      timestamp: string;
      value: number;
    }>;

    expect(previewData).toHaveLength(288);
    expect(Date.parse(previewData[1]!.timestamp) - Date.parse(previewData[0]!.timestamp)).toBe(
      5 * 60 * 1000,
    );
    expect(new Set(previewData.map((point) => point.value)).size).toBeGreaterThan(100);
  });

  it('applies lower-only, upper-only and fixed Y-axis ranges', async () => {
    const { default: Main } = await import('./src/index');
    const renderWithBounds = (yAxisMin?: number, yAxisMax?: number) => {
      const harness = mountWidget(Main, {
        locale: 'en',
        props: {
          yAxisMin,
          yAxisMax,
          data: [
            { timestamp: '2026-01-01T00:00:00Z', value: 18 },
            { timestamp: '2026-01-01T01:00:00Z', value: 22 },
          ],
        },
      });
      const range = (
        UPlotMock.lastOpts as {
          scales: { y: { range: (self: unknown, min: number, max: number) => [number, number] } };
        }
      ).scales.y.range;
      const result = range(null, 18, 22);
      harness.destroy();
      return result;
    };

    expect(renderWithBounds(0, undefined)).toEqual([0, 22]);
    expect(renderWithBounds(undefined, 30)).toEqual([18, 30]);
    expect(renderWithBounds(0, 50)).toEqual([0, 50]);
  });

  it('does not apply the legacy component time range on top of bound history data', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        timeRangePreset: '1h',
        data: [
          { timestamp: '2026-01-01T00:00:00Z', value: 18 },
          { timestamp: '2026-01-01T10:00:00Z', value: 22 },
        ],
      },
    });

    const data = UPlotMock.lastData as [number[], number[]];
    expect(data[0]).toHaveLength(2);
    expect(data[1]).toEqual([18, 22]);
    harness.destroy();
  });

  it('expands a single valid time-series point before handing data to uPlot', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [{ timestamp: '2026-01-01T00:00:00Z', value: 18 }],
      },
    });

    const data = UPlotMock.lastData as [number[], number[]];
    const opts = UPlotMock.lastOpts as {
      legend?: { show?: boolean };
      series: Array<{ label?: string }>;
    };

    expect(data[0]).toHaveLength(2);
    expect(data[1]).toEqual([18, 18]);
    expect(data[0][0]).toBeLessThan(data[0][1]);
    expect(opts.legend?.show).toBe(false);
    expect(opts.series[1]?.label).toBeUndefined();

    harness.destroy();
  });

  it('does not let uPlot render failures escape the widget render loop', async () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();
    UPlotMock.throwOnConstruct = true;

    const { default: Main } = await import('./src/index');
    try {
      const harness = mountWidget(Main, {
        locale: 'en',
        props: {
          data: [{ timestamp: '2026-01-01T00:00:00Z', value: 18 }],
        },
      });

      expect(harness.element.textContent).toContain('Waiting for time series data');
      harness.destroy();
    } finally {
      UPlotMock.throwOnConstruct = false;
      console.error = originalConsoleError;
    }
  });

  it('renders multiple grouped time-series lines', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [
          {
            name: 'Supply',
            data: [
              { timestamp: '2026-01-01T00:00:00Z', value: 18 },
              { timestamp: '2026-01-01T01:00:00Z', value: 22 },
            ],
          },
          {
            name: 'Return',
            data: [
              { timestamp: '2026-01-01T00:00:00Z', value: 9 },
              { timestamp: '2026-01-01T01:00:00Z', value: 12 },
            ],
          },
        ],
      },
    });

    const data = UPlotMock.lastData as [number[], number[], number[]];
    const opts = UPlotMock.lastOpts as {
      legend?: { show?: boolean };
      series: Array<{ label?: string }>;
    };

    expect(data).toHaveLength(3);
    expect(data[1]).toEqual([18, 22]);
    expect(data[2]).toEqual([9, 12]);
    expect(opts.legend?.show).toBe(true);
    expect(opts.series.map((series) => series.label)).toEqual([undefined, 'Supply', 'Return']);

    harness.destroy();
  });

  it('limits grouped time-series lines to four entries', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: Array.from({ length: 5 }, (_, index) => ({
          name: `Series ${index + 1}`,
          data: [{ timestamp: `2026-01-01T0${index}:00:00Z`, value: index + 1 }],
        })),
      },
    });

    const data = UPlotMock.lastData as unknown[];
    const opts = UPlotMock.lastOpts as { series: Array<{ label?: string }> };

    expect(data).toHaveLength(5);
    expect(opts.series.map((series) => series.label)).toEqual([
      undefined,
      'Series 1',
      'Series 2',
      'Series 3',
      'Series 4',
    ]);

    harness.destroy();
  });
});
