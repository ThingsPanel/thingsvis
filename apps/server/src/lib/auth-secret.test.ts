import { afterEach, expect, it, vi } from 'vitest';
import { authSecret } from './auth-secret';
import authConfig from './auth.config';
afterEach(() => vi.unstubAllEnvs());
it('rejects missing, default and low-diversity authentication secrets', () => {
  for (const secret of [
    '',
    'thingsvis-dev-secret-key',
    'change-me-to-a-secure-random-string',
    'a'.repeat(64),
  ]) {
    vi.stubEnv('AUTH_SECRET', secret);
    expect(() => authSecret()).toThrow();
  }
});
it('also rejects cookie-session callbacks with an unsafe secret', async () => {
  vi.stubEnv('AUTH_SECRET', 'thingsvis-dev-secret-key');
  await expect(authConfig.callbacks.jwt({ token: {} } as any)).rejects.toThrow();
  await expect(authConfig.callbacks.session({ session: {}, token: {} } as any)).rejects.toThrow();
});
