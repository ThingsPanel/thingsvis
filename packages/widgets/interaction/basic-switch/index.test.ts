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
});
