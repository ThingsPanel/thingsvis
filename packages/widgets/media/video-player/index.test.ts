import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

describe('media/video-player widget', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('WebSocket', class {
      static CLOSED = 3;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('shows localized empty guidance before a video source is configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });

    expect(harness.element.textContent).toContain('Configure a video source');

    harness.destroy();
  });
});
