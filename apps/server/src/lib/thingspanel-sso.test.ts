import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyThingsPanelSession } from './thingspanel-sso';

function response(authority: string, overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    code: 200,
    data: {
      id: 'user-1', email: 'user@example.com', name: 'Verified User',
      tenant_id: 'tenant-1', authority, ...overrides,
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('maps ThingsPanel authorities to ThingsVis roles from verified response', async () => {
  for (const [authority, role] of [
    ['SYS_ADMIN', 'SUPER_ADMIN'],
    ['TENANT_ADMIN', 'TENANT_ADMIN'],
  ]) {
    let request: RequestInit | undefined;
    const result = await verifyThingsPanelSession('signed-jwt', {
      baseUrl: 'https://thingspanel.example.com/',
      fetcher: async (url, init) => {
        assert.equal(url, 'https://thingspanel.example.com/api/v1/board/user/info');
        request = init;
        return response(authority);
      },
    });
    assert.deepEqual(request?.headers, { 'x-token': 'signed-jwt', Accept: 'application/json' });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.user.role, role);
  }
});

test('maps a tenantless ThingsPanel superadmin to the stable ThingsVis system tenant', async () => {
  const result = await verifyThingsPanelSession('signed-admin-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => response('SYS_ADMIN', { tenant_id: '' }),
  });

  assert.deepEqual(result, {
    ok: true,
    user: {
      id: 'user-1', email: 'user@example.com', name: 'Verified User',
      tenantId: 'sys-admin', role: 'SUPER_ADMIN',
    },
  });
});

test('still rejects tenantless tenant accounts', async () => {
  const result = await verifyThingsPanelSession('signed-tenant-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => response('TENANT_ADMIN', { tenant_id: '' }),
  });

  assert.deepEqual(result, { ok: false, status: 401 });
});

test('rejects unknown roles, invalid tokens, and missing verifier configuration', async () => {
  const unknownRole = await verifyThingsPanelSession('signed-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => response('ROOT'),
  });
  assert.deepEqual(unknownRole, { ok: false, status: 401 });

  const invalidToken = await verifyThingsPanelSession('forged-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => new Response('{}', { status: 401 }),
  });
  assert.deepEqual(invalidToken, { ok: false, status: 401 });
  assert.deepEqual(await verifyThingsPanelSession('token', { baseUrl: '' }), { ok: false, status: 503 });
  assert.deepEqual(await verifyThingsPanelSession('token', { baseUrl: 'http://backend.example.com' }), {
    ok: false, status: 503,
  });
});

test('ignores caller identity fields by returning only the verified authority result', async () => {
  const result = await verifyThingsPanelSession('valid-user-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => response('TENANT_ADMIN', { id: 'verified-id', tenant_id: 'verified-tenant' }),
  });
  assert.deepEqual(result, {
    ok: true,
    user: {
      id: 'verified-id', email: 'user@example.com', name: 'Verified User',
      tenantId: 'verified-tenant', role: 'TENANT_ADMIN',
    },
  });
});

test('rejects community-incompatible tenant user authority even when caller requests a stronger role', async () => {
  const result = await verifyThingsPanelSession('signed-tenant-user-jwt', {
    baseUrl: 'https://thingspanel.example.com',
    fetcher: async () => response('TENANT_USER'),
  });

  assert.deepEqual(result, { ok: false, status: 401 });
});
