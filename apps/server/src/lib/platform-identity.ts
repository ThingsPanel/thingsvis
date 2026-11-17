import { z } from 'zod';

const Identity = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  tenantId: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR', 'VIEWER']),
});

export class PlatformIdentityError extends Error {
  constructor(
    public status: number,
    public reason = 'PLATFORM_UNAVAILABLE',
  ) {
    super('Platform authentication failed');
  }
}

export function platformIdentityURL(configured: string | undefined): URL {
  if (!configured) throw new PlatformIdentityError(503, 'PLATFORM_NOT_CONFIGURED');
  try {
    const endpoint = new URL(configured);
    if (
      !['http:', 'https:'].includes(endpoint.protocol) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new Error();
    const base = endpoint.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    endpoint.pathname = base + '/api/v1/auth/sso/identity';
    return endpoint;
  } catch {
    throw new PlatformIdentityError(503, 'PLATFORM_INVALID_URL');
  }
}

// Only deployment configuration selects the upstream. Never trust browser identity assertions.
export async function verifyPlatformIdentity(platform: string, token: string) {
  if (platform !== 'thingspanel' || !token || token.length > 8192)
    throw new PlatformIdentityError(401);
  const endpoint = platformIdentityURL(process.env.THINGSPANEL_API_URL);
  try {
    const response = await fetch(endpoint, {
      headers: { 'x-token': token },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) throw new PlatformIdentityError(503, 'PLATFORM_ENDPOINT_MISSING');
    if (!response.ok)
      throw new PlatformIdentityError(
        response.status >= 500 ? 503 : 401,
        response.status >= 500 ? 'PLATFORM_UNAVAILABLE' : 'PLATFORM_SESSION_REJECTED',
      );
    const text = await response.text();
    if (text.length > 16384) throw new PlatformIdentityError(503);
    const body = JSON.parse(text);
    if (body.code !== 200) throw new PlatformIdentityError(401);
    return Identity.parse(body.data);
  } catch (error) {
    if (error instanceof PlatformIdentityError) throw error;
    throw new PlatformIdentityError(503);
  }
}
