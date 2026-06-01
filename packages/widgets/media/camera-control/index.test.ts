import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

describe('media/camera-control widget', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'WebSocket',
      class {
        static CLOSED = 3;
      },
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('shows localized empty guidance before a stream source is configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });

    expect(harness.element.textContent).toContain('Bind a live or playback stream URL');

    harness.destroy();
  });

  it('emits command-shaped PTZ payloads', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      emit,
      props: { showPtz: true },
    });

    const leftButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.title === 'Left',
    );
    leftButton?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    leftButton?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    expect(emit).toHaveBeenCalledWith('ptzMove', { ptz_move: { direction: 'left', speed: 3 } });
    expect(emit).toHaveBeenCalledWith('ptzStop', { ptz_stop: {} });

    harness.destroy();
  });

  it('hides advanced camera controls by default', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en', mode: 'view' });

    const buttons = Array.from(harness.element.querySelectorAll('button'));
    expect(buttons.some((button) => button.title === 'Left')).toBe(false);
    expect(buttons.some((button) => button.title === 'Focus near')).toBe(false);
    expect(buttons.some((button) => button.title === 'Go to preset')).toBe(false);
    expect(buttons.some((button) => button.title === 'Snapshot')).toBe(true);
    expect(buttons.some((button) => button.title === 'Fullscreen')).toBe(true);
    expect(buttons.some((button) => button.title === 'Request playback')).toBe(true);

    harness.destroy();
  });

  it('emits optional advanced control payloads when enabled', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      emit,
      props: {
        showZoomControls: true,
        showFocusControls: true,
        showPresetControl: true,
      },
    });

    const clickByTitle = (title: string) => {
      const button = Array.from(harness.element.querySelectorAll('button')).find(
        (item) => item.title === title,
      );
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };

    clickByTitle('Zoom in');
    clickByTitle('Focus near');
    clickByTitle('Go to preset');

    expect(emit).toHaveBeenCalledWith('ptzZoom', { ptz_zoom: { action: 'in', speed: 3 } });
    expect(emit).toHaveBeenCalledWith('ptzFocus', { ptz_focus: { action: 'near' } });
    expect(emit).toHaveBeenCalledWith('presetGoto', { preset_goto: { presetId: '1' } });

    harness.destroy();
  });
});
