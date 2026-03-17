import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

class ImageMock {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(value: string) {
    if (value.includes('fail')) {
      this.onerror?.();
      return;
    }
    this.onload?.();
  }
}

describe('media/image widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('shows localized empty guidance before an image is configured', () => {
    vi.stubGlobal('Image', ImageMock);
    const harness = mountWidget(Main, { locale: 'en' });

    expect(harness.element.textContent).toContain('Please configure an image');

    harness.destroy();
  });

  it('loads an image and hides the placeholder when the source becomes valid', () => {
    vi.stubGlobal('Image', ImageMock);
    const harness = mountWidget(Main, { locale: 'en' });

    harness.update({
      props: {
        dataUrl: 'https://example.com/widget.png',
      },
    });

    const img = harness.element.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/widget.png');
    expect(harness.element.textContent).not.toContain('Please configure an image');

    harness.destroy();
  });
});
