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

describe('chart/echarts-bar widget', () => {
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

    expect(Main.defaultProps.data.length).toBeGreaterThan(0);
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
});
