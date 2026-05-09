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
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
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

  it('expands a single valid time-series point before handing data to uPlot', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [{ timestamp: '2026-01-01T00:00:00Z', value: 18 }],
      },
    });

    const data = UPlotMock.lastData as [number[], number[]];
    expect(data[0]).toHaveLength(2);
    expect(data[1]).toEqual([18, 18]);
    expect(data[0][0]).toBeLessThan(data[0][1]);

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
    const opts = UPlotMock.lastOpts as { series: Array<{ label?: string }> };

    expect(data).toHaveLength(3);
    expect(data[1]).toEqual([18, 22]);
    expect(data[2]).toEqual([9, 12]);
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
