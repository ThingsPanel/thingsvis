import { describe, expect, it } from 'vitest';
import { buildEmbeddedProviderDataSources } from './embedded-data-source-registry';

describe('embedded-data-source-registry', () => {
  it('treats the template placeholder as no concrete runtime device', () => {
    const [statusHistory] = buildEmbeddedProviderDataSources(
      'thingspanel',
      { deviceId: '__template__' },
      { groups: ['current-device-history'] },
    );

    expect(statusHistory?.mode).toBe('manual');
  });
});
