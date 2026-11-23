import { afterEach, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

it('loads and renders camera control alongside the ordinary video player', async () => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('WebSocket', class { static CLOSED = 3; });

  const { default: video } = await import('../video-player/src/index');
  const { default: camera } = await import('./src/index');
  const videoHarness = mountWidget(video, { locale: 'en' });
  const cameraHarness = mountWidget(camera, { locale: 'en' });
  try {
    expect(videoHarness.element.textContent).toContain('video');
    expect(cameraHarness.element.textContent).toContain('Bind a live or playback stream URL');
    expect(camera.defaultSize).toEqual({ width: 560, height: 360 });
  } finally {
    cameraHarness.destroy();
    videoHarness.destroy();
  }
});
