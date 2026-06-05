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
    delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
    delete (document as { exitFullscreen?: unknown }).exitFullscreen;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    vi.unstubAllGlobals();
  });

  it('shows localized empty guidance before a stream source is configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });

    expect(harness.element.textContent).toContain('Bind a live or playback stream URL');

    harness.destroy();
  });

  it('hides the PTZ pad even when legacy configs enable it', async () => {
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

    expect(leftButton).toBeUndefined();
    expect(emit).not.toHaveBeenCalled();

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
    expect(buttons.some((button) => button.title === 'Playback')).toBe(true);

    harness.destroy();
  });

  it('opens the playback panel and emits playback_open with selected times', async () => {
    const { default: Main } = await import('./src/index');
    const emit = vi.fn();
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      emit,
      props: {
        playbackStart: '2026-06-04T08:00:00.000Z',
        playbackEnd: '2026-06-04T09:00:00.000Z',
      },
    });

    const playbackButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.title === 'Playback',
    );
    playbackButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const panel = harness.element.querySelector('.tv-camera-playback-modal');
    expect(panel).toBeTruthy();
    expect(getComputedStyle(panel as HTMLElement).display).not.toBe('none');
    expect(harness.element.querySelector('.tv-camera-playback-calendar')).toBeTruthy();
    expect(harness.element.textContent).toContain('Video playback');

    const dayButton = Array.from(harness.element.querySelectorAll('.tv-camera-calendar-day')).find(
      (button) => button.textContent === '4',
    );
    expect(dayButton).toBeTruthy();

    const playButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Start playback',
    );
    playButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emit).toHaveBeenCalledWith(
      'playbackRequest',
      expect.objectContaining({
        playback_open: expect.objectContaining({
          start: expect.any(String),
          end: expect.any(String),
        }),
      }),
    );

    const returnButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.title === 'Return to live',
    );
    expect(returnButton).toBeTruthy();

    harness.destroy();
  });

  it('toggles the camera shell fullscreen state from the toolbar button', async () => {
    const { default: Main } = await import('./src/index');
    const requestFullscreen = vi.fn();
    const exitFullscreen = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });

    const harness = mountWidget(Main, { locale: 'en', mode: 'view' });
    const fullscreenButton = () =>
      Array.from(harness.element.querySelectorAll('button')).find(
        (button) => button.title === 'Fullscreen' || button.title === 'Exit fullscreen',
      );

    fullscreenButton()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    const shell = harness.element.children.item(2);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: shell,
    });
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(fullscreenButton()?.title).toBe('Exit fullscreen');
    fullscreenButton()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(exitFullscreen).toHaveBeenCalledTimes(1);

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
