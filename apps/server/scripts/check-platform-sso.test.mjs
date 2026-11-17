import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPlatformSSO } from './check-platform-sso.mjs';

const env = {
  AUTH_SECRET: 'test-only-A9s7d6F5g4H3j2K1l0ZxCvBnMqWe',
  THINGSPANEL_API_URL: 'http://backend:9999/api/v1/',
};
test('accepts a protected platform endpoint without sending credentials', async () => {
  await checkPlatformSSO(env, async (url, options) => {
    assert.equal(url.href, 'http://backend:9999/api/v1/auth/sso/identity');
    assert.equal(options.headers, undefined);
    return Response.json({ code: 40100 }, { status: 401 });
  });
});
test('rejects absent endpoints, public endpoints and proxy errors', async () => {
  for (const status of [200, 404, 500, 503]) {
    await assert.rejects(checkPlatformSSO(env, async () => Response.json({}, { status })));
  }
  await assert.rejects(
    checkPlatformSSO(env, async () => new Response('proxy auth', { status: 401 })),
  );
  await assert.rejects(
    checkPlatformSSO(env, async () => {
      throw new Error('unreachable');
    }),
  );
});
test('rejects missing configuration and weak secrets before network access', async () => {
  const request = async () => {
    assert.fail('must not send a request');
  };
  await assert.rejects(checkPlatformSSO({ ...env, THINGSPANEL_API_URL: '' }, request));
  await assert.rejects(checkPlatformSSO({ ...env, AUTH_SECRET: 'change-me' }, request));
});
