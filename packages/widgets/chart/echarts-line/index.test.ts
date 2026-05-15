import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

const setOption = vi.fn();
const resize = vi.fn();
const dispose = vi.fn();
const isDisposed = vi.fn(() => false);
const init = vi.fn(() => ({
  setOption,
  resize,
  dispose,
  isDisposed,
}));

vi.mock('echarts', () => ({
  init,
  graphic: {
    LinearGradient: class LinearGradient {
      constructor(...args: unknown[]) {
        Object.assign(this, { args });
      }
    },
  },
}));

describe('chart/echarts-line widget', () => {
  beforeEach(() => {
    setOption.mockClear();
    resize.mockClear();
    dispose.mockClear();
    isDisposed.mockClear();
    isDisposed.mockReturnValue(false);
    init.mockClear();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('renders sample data by default instead of a premature empty-state message', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });
    const latestOption = setOption.mock.calls.at(-1)?.[0];

    expect(init).toHaveBeenCalledTimes(1);
    expect(Main.defaultProps.data).toHaveLength(6);
    expect(latestOption?.graphic).toBeUndefined();

    harness.destroy();
  });

  it('shows localized empty guidance only after the data set is empty', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [],
      },
    });
    const latestOption = setOption.mock.calls.at(-1)?.[0];

    expect(latestOption?.graphic?.style?.text).toBe('Add data points or bind a data series');

    harness.destroy();
  });

  it('renders multiple category line series from grouped data', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [
          {
            name: 'Supply',
            data: [
              { name: 'Mon', value: 12 },
              { name: 'Tue', value: 18 },
            ],
          },
          {
            name: 'Return',
            data: [
              { name: 'Mon', value: 8 },
              { name: 'Tue', value: 11 },
            ],
          },
        ],
      },
    });
    const latestOption = setOption.mock.calls.at(-1)?.[0];

    expect(latestOption?.legend?.data).toEqual(['Supply', 'Return']);
    expect(latestOption?.xAxis?.data).toEqual(['Mon', 'Tue']);
    expect(latestOption?.series).toHaveLength(2);
    expect(latestOption?.series?.[0]?.data).toEqual([12, 18]);
    expect(latestOption?.series?.[1]?.data).toEqual([8, 11]);

    harness.destroy();
  });

  it('limits grouped line series to four entries', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: Array.from({ length: 5 }, (_, index) => ({
          name: `Series ${index + 1}`,
          data: [{ name: 'A', value: index + 1 }],
        })),
      },
    });
    const latestOption = setOption.mock.calls.at(-1)?.[0];

    expect(latestOption?.legend?.data).toEqual(['Series 1', 'Series 2', 'Series 3', 'Series 4']);
    expect(latestOption?.series).toHaveLength(4);

    harness.destroy();
  });

  it('renders multiple time line series from the original time-value point format', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [
          {
            name: 'Supply',
            data: [
              { time: '2026-03-19T09:00:00.000Z', value: 47.2 },
              { time: '2026-03-19T10:00:00.000Z', value: 47.8 },
            ],
          },
          {
            name: 'Return',
            data: [
              { time: '2026-03-19T09:00:00.000Z', value: 39.4 },
              { time: '2026-03-19T10:00:00.000Z', value: 40.1 },
            ],
          },
        ],
      },
    });
    const latestOption = setOption.mock.calls.at(-1)?.[0];

    expect(latestOption?.xAxis?.type).toBe('time');
    expect(latestOption?.series).toHaveLength(2);
    expect(latestOption?.series?.[0]?.encode).toEqual({ x: 0, y: 1, tooltip: [1] });
    expect(latestOption?.series?.[0]?.data).toEqual([
      { name: '2026-03-19T09:00:00.000Z', value: [1773910800000, 47.2] },
      { name: '2026-03-19T10:00:00.000Z', value: [1773914400000, 47.8] },
    ]);
    expect(latestOption?.series?.[1]?.data).toEqual([
      { name: '2026-03-19T09:00:00.000Z', value: [1773910800000, 39.4] },
      { name: '2026-03-19T10:00:00.000Z', value: [1773914400000, 40.1] },
    ]);

    harness.destroy();
  });
});
