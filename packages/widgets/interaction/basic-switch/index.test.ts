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

  it('renders a compact control layout with semantic state text', async () => {
    const { default: Main } = await import('./src/index');
    const { getDefaultProps } = await import('./src/schema');
    const harness = mountWidget(Main, {
      mode: 'view',
      size: { width: 120, height: 320 },
      props: { label: 'Bedroom light', value: false, offLabel: 'Off', onLabel: 'On' },
    });

    expect(getDefaultProps().value).toBe(false);
    expect(harness.element.querySelector('[data-tv-switch-icon]')).not.toBeNull();
    expect(harness.element.querySelector('[data-tv-switch-title]')?.textContent).toBe('Bedroom light');
    expect(harness.element.querySelector('[data-tv-switch-status]')?.textContent).toBe('Off');
    expect(harness.element.innerHTML).not.toContain('backdrop-filter');
    expect(harness.element.style.background).toBe('');

    const trackStyle = harness.element.querySelector<HTMLElement>('#track')?.getAttribute('style') ?? '';
    expect(trackStyle).toContain('width: 52px');
    expect(trackStyle).toContain('height: 30px');

    harness.destroy();
  });

  it('keeps the switch on the right in the default layout', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { label: 'Bedroom light', offLabel: 'Off' },
    });

    const layout = harness.element.firstElementChild as HTMLElement | null;
    expect(layout?.style.flexDirection).toBe('row');
    expect(layout?.firstElementChild?.getAttribute('data-tv-switch-content')).toBe('');
    expect(layout?.lastElementChild?.id).toBe('track');

    harness.destroy();
  });

  it('renders a configurable Lucide icon without owning a glass surface', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { icon: 'Power', showLabel: false },
    });

    expect(harness.element.querySelector('svg.lucide-power')).not.toBeNull();
    expect(harness.element.innerHTML).not.toContain('backdrop-filter');
    expect(harness.element.style.background).toBe('');

    harness.destroy();
  });

  it('toggles from keyboard activation as well as click', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: false, showLabel: false },
      emit,
    });

    harness.element.querySelector<HTMLElement>('#track')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );

    expect(emit).toHaveBeenCalledWith('change', true);

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

  it('applies onColor and offColor from props', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: {
        value: true,
        showLabel: false,
        onColor: '#41d276',
        offColor: '#d1d5db',
      },
    });

    expect(harness.element.innerHTML).toContain('#41d276');

    harness.update({ props: { value: false, showLabel: false, onColor: '#41d276', offColor: '#d1d5db' } });

    expect(harness.element.innerHTML).toContain('#d1d5db');

    harness.destroy();
  });

  it('uses theme primary when onColor is empty', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { value: true, showLabel: false, onColor: '', offColor: '#333333' },
    });

    expect(harness.element.innerHTML).toContain('background: #6965db');
    expect(harness.element.innerHTML).not.toContain('#22c55e');

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

  it('keeps the default track size stable when the widget card grows', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      mode: 'view',
      props: { label: 'Switch', labelFontSize: 24 },
    });
    Object.defineProperty(harness.element, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(harness.element, 'clientHeight', { configurable: true, value: 72 });

    harness.update({ props: { label: 'Switch', labelFontSize: 24 } });

    const trackStyle = harness.element.querySelector<HTMLElement>('#track')?.getAttribute('style') ?? '';
    const trackWidth = Number.parseFloat(trackStyle.match(/width:\s*(\d+)px/)?.[1] ?? '0');
    const trackHeight = Number.parseFloat(trackStyle.match(/height:\s*(\d+)px/)?.[1] ?? '0');

    expect(trackWidth).toBe(52);
    expect(trackHeight).toBe(30);
    expect(harness.element.innerHTML).toContain('font-size: 24px');

    harness.update({ props: { label: 'Switch', size: 'small' } });
    const compactTrackStyle = harness.element.querySelector<HTMLElement>('#track')?.getAttribute('style') ?? '';
    expect(compactTrackStyle).toContain('width: 42px');
    expect(compactTrackStyle).toContain('height: 24px');

    harness.destroy();
  });
});
