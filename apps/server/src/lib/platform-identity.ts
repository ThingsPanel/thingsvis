import { z } from 'zod';

const Identity = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  tenantId: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR', 'VIEWER']),
});

export class PlatformIdentityError extends Error {
  constructor(public status: number) {
    super('Platform authentication failed');
  }
}

// Only deployment configuration selects the upstream. Never trust browser identity assertions.
export async function verifyPlatformIdentity(platform: string, token: string) {
  if (platform !== 'thingspanel' || !token || token.length > 8192)
    throw new PlatformIdentityError(401);
  const configured = process.env.THINGSPANEL_API_URL;
  if (!configured) throw new PlatformIdentityError(503);
  let endpoint: URL;
  try {
    endpoint = new URL(configured);
    if (
      !['http:', 'https:'].includes(endpoint.protocol) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new Error();
    endpoint.pathname = endpoint.pathname.replace(/\/$/, '') + '/api/v1/auth/sso/identity';
  } catch {
    throw new PlatformIdentityError(503);
  }
  try {
    const response = await fetch(endpoint, {
      headers: { 'x-token': token },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new PlatformIdentityError(response.status >= 500 ? 503 : 401);
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
