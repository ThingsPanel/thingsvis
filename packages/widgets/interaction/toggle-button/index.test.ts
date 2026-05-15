import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

describe('interaction/toggle-button widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('toggles value and emits change', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      mode: 'view',
      props: {
        value: false,
        onLabel: 'ON',
        offLabel: 'OFF',
        onColor: '#00ff00',
        offColor: '#ff0000',
      },
      emit,
    });

    expect(harness.element.innerHTML).toContain('OFF');
    expect(harness.element.innerHTML).toContain('#ff0000');

    harness.element.querySelector<HTMLButtonElement>('[data-tv-toggle-btn]')?.click();

    expect(emit).toHaveBeenCalledWith('change', true);
    expect(harness.element.innerHTML).toContain('ON');
    expect(harness.element.innerHTML).toContain('#00ff00');

    harness.destroy();
  });

  it('uses theme primary when onColor is empty', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: true, onColor: '', onLabel: 'ON', offColor: '#333333' },
    });

    expect(harness.element.innerHTML).toContain('background: #6965db');
    expect(harness.element.innerHTML).not.toContain('#22c55e');

    harness.destroy();
  });

  it('coerces numeric 0/1 from bindings to boolean', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: 1, onLabel: '开', offLabel: '关' },
    });

    expect(harness.element.innerHTML).toContain('开');

    harness.update({ props: { value: 0 } });
    expect(harness.element.innerHTML).toContain('关');

    harness.destroy();
  });
});
