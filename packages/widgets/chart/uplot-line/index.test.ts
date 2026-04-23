import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

class UPlotMock {
  static paths = {
    spline: () => undefined,
    linear: () => undefined,
  };

  static lastData: unknown = null;
  static throwOnConstruct = false;

  root: HTMLDivElement;

  constructor(_opts: unknown, data: unknown, target: HTMLElement) {
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
});
