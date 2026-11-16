import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { verifyPlatformIdentity } from './platform-identity';
const identity = { id: 'u1', email: 'user@example.com', tenantId: 't1', role: 'EDITOR' };
beforeEach(() => vi.stubEnv('THINGSPANEL_API_URL', 'http://backend:9999'));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('validates against the configured platform and carries only the token', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ code: 200, data: identity })));
  vi.stubGlobal('fetch', fetch);
  expect(await verifyPlatformIdentity('thingspanel', 'valid-token')).toEqual(identity);
  expect(String(fetch.mock.calls[0][0])).toBe('http://backend:9999/api/v1/auth/sso/identity');
  expect(fetch.mock.calls[0][1]).toMatchObject({
    headers: { 'x-token': 'valid-token' },
    redirect: 'error',
    cache: 'no-store',
  });
});
it.each([401, 403, 500])('rejects failed platform validation %i', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
  await expect(verifyPlatformIdentity('thingspanel', 'invalid')).rejects.toThrow();
});
it('fails closed for unknown platforms, missing configuration, network and malformed identities', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  await expect(verifyPlatformIdentity('attacker', 'x')).rejects.toThrow();
  await expect(verifyPlatformIdentity('thingspanel', 'x')).rejects.toThrow();
  vi.stubEnv('THINGSPANEL_API_URL', '');
  await expect(verifyPlatformIdentity('thingspanel', 'x')).rejects.toThrow();
  vi.stubEnv('THINGSPANEL_API_URL', 'http://backend:9999');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: { role: 'SUPER_ADMIN' } })),
      ),
  );
  await expect(verifyPlatformIdentity('thingspanel', 'x')).rejects.toThrow();
});
