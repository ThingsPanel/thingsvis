import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getSessionUser } from './auth-helpers';

export type MarketInternalContext = {
  tenantId: string;
  userId: string;
};

export type MarketInternalAuthResult =
  | { ok: true; context: MarketInternalContext }
  | { ok: false; status: 401 | 503; error: string };

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authorizeMarketInternalRequest(
  request: NextRequest,
): Promise<MarketInternalAuthResult> {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    const user = await getSessionUser(request);
    if (!user?.id || !user.tenantId) {
      return { ok: false, status: 401, error: 'Unauthorized' };
    }
    return {
      ok: true,
      context: {
        tenantId: user.tenantId,
        userId: user.id,
      },
    };
  }

  const configuredToken = process.env.MARKET_TEMPLATE_INTERNAL_TOKEN;
  if (!configuredToken) {
    return { ok: false, status: 503, error: 'Market template integration is not configured' };
  }

  const suppliedToken = request.headers.get('x-internal-token') ?? '';
  if (!safeEqual(suppliedToken, configuredToken)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const tenantId = request.headers.get('x-tenant-id')?.trim();
  const userId = request.headers.get('x-user-id')?.trim();
  if (!tenantId || !userId) {
    return { ok: false, status: 401, error: 'Missing internal identity context' };
  }

  return { ok: true, context: { tenantId, userId } };
}
