import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrlFromHref } from './client';

describe('resolveApiBaseUrlFromHref', () => {
  it('uses thingsvisApiBaseUrl from search params', () => {
    expect(
      resolveApiBaseUrlFromHref(
        'http://c.thingspanel.cn/main/?thingsvisApiBaseUrl=http%3A%2F%2Fc.thingspanel.cn%2Fthingsvis-api',
        'http://c.thingspanel.cn',
      ),
    ).toBe('http://c.thingspanel.cn/thingsvis-api');
  });

  it('uses thingsvisApiBaseUrl from hash params before the default /api/v1 fallback', () => {
    expect(
      resolveApiBaseUrlFromHref(
        'http://c.thingspanel.cn/main/#/editor?mode=embedded&thingsvisApiBaseUrl=http%3A%2F%2Fc.thingspanel.cn%2Fthingsvis-api',
        'http://c.thingspanel.cn',
      ),
    ).toBe('http://c.thingspanel.cn/thingsvis-api');
  });

  it('keeps legacy apiBaseUrl precedence over thingsvisApiBaseUrl', () => {
    expect(
      resolveApiBaseUrlFromHref(
        'http://localhost:3000/#/editor?apiBaseUrl=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1&thingsvisApiBaseUrl=http%3A%2F%2Flocalhost%3A5002%2Fthingsvis-api',
        'http://localhost:3000',
      ),
    ).toBe('http://localhost:8000/api/v1');
  });
});
