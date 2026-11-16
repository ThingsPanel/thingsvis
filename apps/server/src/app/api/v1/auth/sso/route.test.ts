import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  tenant: { findUnique: vi.fn(), create: vi.fn() },
  user: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  dashboard: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ prisma: { tenant: mocks.tenant, user: mocks.user } }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/dashboard-helpers', () => ({ ensureDefaultDashboardForUser: mocks.dashboard }));
vi.mock('@/lib/platform-identity', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  verifyPlatformIdentity: mocks.verify,
}));
import { POST } from './route';
const secret = 'test-only-A9s7d6F5g4H3j2K1l0ZxCvBnMqWe';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('AUTH_SECRET', secret);
  mocks.tenant.findUnique.mockResolvedValue({ id: 'trusted-tenant' });
  mocks.user.findFirst.mockResolvedValue(null);
  mocks.user.create.mockImplementation(async ({ data }) => ({ ...data, id: 'vis-user' }));
});
function request() {
  return new NextRequest('http://localhost/api/v1/auth/sso', {
    method: 'POST',
    body: JSON.stringify({
      platform: 'thingspanel',
      platformToken: 'x',
      role: 'SUPER_ADMIN',
      userInfo: { id: 'victim', email: 'victim@example.com', tenantId: 'victim-tenant' },
    }),
  });
}
it('cannot create any account when token validation fails', async () => {
  mocks.verify.mockRejectedValue(new Error('invalid token'));
  expect((await POST(request())).status).toBeGreaterThanOrEqual(400);
  expect(mocks.tenant.findUnique).not.toHaveBeenCalled();
  expect(mocks.user.create).not.toHaveBeenCalled();
});
it('ignores all browser identity assertions and signs only verified identity', async () => {
  mocks.verify.mockResolvedValue({
    id: 'trusted-user',
    email: 'trusted@example.com',
    tenantId: 't1',
    role: 'EDITOR',
  });
  const response = await POST(request());
  expect(response.status).toBe(200);
  const body = await response.json();
  const { payload } = await jwtVerify(body.accessToken, new TextEncoder().encode(secret));
  expect(payload.role).toBe('EDITOR');
  expect(payload.tenantId).toBe('trusted-tenant');
  expect(mocks.user.create.mock.calls[0][0].data.ssoSubject).toBe('trusted-user');
  expect(mocks.dashboard).not.toHaveBeenCalled();
});
it('replaces a previously elevated role with current trusted role', async () => {
  mocks.verify.mockResolvedValue({
    id: 'u1',
    email: 'trusted@example.com',
    tenantId: 't1',
    role: 'VIEWER',
  });
  mocks.user.findFirst.mockResolvedValue({ id: 'vis-user', role: 'SUPER_ADMIN' });
  mocks.user.update.mockImplementation(async ({ data }) => ({ ...data, id: 'vis-user' }));
  expect((await POST(request())).status).toBe(200);
  expect(mocks.user.update.mock.calls[0][0].data.role).toBe('VIEWER');
});
