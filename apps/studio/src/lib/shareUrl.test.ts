import { describe, expect, it } from 'vitest';
import { resolveShareUrl } from './shareUrl';

describe('resolveShareUrl', () => {
  it('uses the host preview URL and preserves its deployed origin and base path', () => {
    expect(
      resolveShareUrl({
        shareToken: 'secret-token',
        standaloneShareUrl: 'http://localhost:3000/#/embed?id=d1&shareToken=secret-token',
        hostPreviewUrl: 'http://localhost:5002/tv-preview?id=d1',
      }),
    ).toBe('http://localhost:5002/tv-preview?id=d1&shareToken=secret-token');

    expect(
      resolveShareUrl({
        shareToken: 'secret-token',
        standaloneShareUrl: 'http://thingsvis:3000/#/embed?id=d1&shareToken=secret-token',
        hostPreviewUrl: 'https://panel.example.com/iot/tv-preview?id=d1',
      }),
    ).toBe('https://panel.example.com/iot/tv-preview?id=d1&shareToken=secret-token');
  });

  it('falls back to the standalone URL when no valid host URL is provided', () => {
    const standaloneShareUrl = 'http://localhost:3000/#/embed?id=d1&shareToken=secret-token';
    expect(
      resolveShareUrl({
        shareToken: 'secret-token',
        standaloneShareUrl,
        hostPreviewUrl: 'not-a-url',
      }),
    ).toBe(standaloneShareUrl);
  });
});
