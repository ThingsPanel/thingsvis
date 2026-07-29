import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getSessionUser } from './auth-helpers';
import { authorizeMarketInternalRequest } from './market-internal-auth';

vi.mock('./auth-helpers', () => ({
  getSessionUser: vi.fn(),
}));

const mockedGetSessionUser = vi.mocked(getSessionUser);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.MARKET_TEMPLATE_INTERNAL_TOKEN;
});

describe('authorizeMarketInternalRequest', () => {
  it('uses the ThingsVis bearer identity when provided', async () => {
    mockedGetSessionUser.mockResolvedValue({
      id: 'thingsvis-user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'EDITOR',
      tenantId: 'thingsvis-tenant-1',
    });
    const request = new NextRequest('http://localhost/api/internal/market-dashboards/1/analyze', {
      headers: { Authorization: 'Bearer short-lived-token' },
    });

    await expect(authorizeMarketInternalRequest(request)).resolves.toEqual({
      ok: true,
      context: {
        tenantId: 'thingsvis-tenant-1',
        userId: 'thingsvis-user-1',
      },
    });
  });

  it('rejects an invalid bearer token without falling back', async () => {
    mockedGetSessionUser.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/internal/market-dashboards/1/analyze', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    await expect(authorizeMarketInternalRequest(request)).resolves.toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });

  it('keeps the existing internal-token flow as a compatibility fallback', async () => {
    process.env.MARKET_TEMPLATE_INTERNAL_TOKEN = 'shared-secret';
    const request = new NextRequest('http://localhost/api/internal/market-dashboards/1/analyze', {
      headers: {
        'X-Internal-Token': 'shared-secret',
        'X-Tenant-ID': 'tenant-1',
        'X-User-ID': 'user-1',
      },
    });

    await expect(authorizeMarketInternalRequest(request)).resolves.toEqual({
      ok: true,
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
      },
    });
  });
});
