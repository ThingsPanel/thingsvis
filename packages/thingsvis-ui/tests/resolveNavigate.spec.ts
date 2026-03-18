import { describe, expect, it } from 'vitest';
import { _resolveNavigateDestination as resolveNavigateDestination } from '../src/engine/executeActions';

describe('resolveNavigateDestination', () => {
  it('keeps absolute URLs unchanged', () => {
    expect(
      resolveNavigateDestination('https://example.com/device/manage', {
        currentOrigin: 'http://localhost:3000',
        referrer: 'http://localhost:5002/visualization/thingsvis-editor?id=1',
        isEmbedded: true,
      }),
    ).toEqual({
      url: 'https://example.com/device/manage',
      target: '_blank',
    });
  });

  it('resolves root-relative URLs against host referrer origin when embedded', () => {
    expect(
      resolveNavigateDestination('/device/manage', {
        currentOrigin: 'http://localhost:3000',
        referrer: 'https://demo.thingspanel.com/visualization/thingsvis-editor?id=1',
        isEmbedded: true,
      }),
    ).toEqual({
      url: 'https://demo.thingspanel.com/device/manage',
      target: '_top',
    });
  });

  it('resolves root-relative URLs against current origin when standalone', () => {
    expect(
      resolveNavigateDestination('/visualization/thingsvis', {
        currentOrigin: 'https://demo.thingspanel.com',
        referrer: '',
        isEmbedded: false,
      }),
    ).toEqual({
      url: 'https://demo.thingspanel.com/visualization/thingsvis',
      target: '_self',
    });
  });
});
