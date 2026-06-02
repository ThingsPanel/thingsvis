import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

describe('interaction/basic-switch widget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('clears optimistic loading feedback quickly after a toggle', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: false, showLabel: false },
      emit,
    });

    harness.element.querySelector<HTMLElement>('#track')?.click();

    expect(emit).toHaveBeenCalledWith('change', true);
    expect(harness.element.innerHTML).toContain('tv-switch-spin');

    vi.advanceTimersByTime(800);

    expect(harness.element.innerHTML).not.toContain('tv-switch-spin');

    harness.destroy();
  });

  it('emits numeric 0/1 payloads when the current value is numeric', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: 0, showLabel: false },
      emit,
    });

    harness.element.querySelector<HTMLElement>('#track')?.click();

    expect(emit).toHaveBeenCalledWith('change', 1);

    harness.update({ props: { value: 1 } });
    harness.element.querySelector<HTMLElement>('#track')?.click();

    expect(emit).toHaveBeenLastCalledWith('change', 0);

    harness.destroy();
  });

  it('hides the external label when showLabel is false-like', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { label: '开关状态', showLabel: 'false' },
    });

    expect(harness.element.textContent).not.toContain('开关状态');

    harness.update({ props: { label: '开关状态', showLabel: true } });

    expect(harness.element.textContent).toContain('开关状态');

    harness.destroy();
  });
});
