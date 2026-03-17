import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { EMBED_SSO_LOGIN_SOURCE, STANDALONE_LOGIN_SOURCE } from '@/lib/validators/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verify token
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'thingsvis-dev-secret-key');

    try {
      const { payload } = await jwtVerify(token, secret);
      const loginSource = (payload as { loginSource?: unknown }).loginSource;

      // Get fresh user data
      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        include: { tenant: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }

      return NextResponse.json({
        id: user.id,
        email: user.displayEmail || user.email,
        name: user.name,
        role: user.role,
        authType: user.authType,
        loginSource:
          typeof loginSource === 'string'
            ? loginSource
            : user.authType === 'SSO'
              ? EMBED_SSO_LOGIN_SOURCE
              : STANDALONE_LOGIN_SOURCE,
        tenantId: user.tenantId,
        tenant: user.tenant
          ? {
              id: user.tenant.id,
              name: user.tenant.name,
            }
          : null,
      });
    } catch (_jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
