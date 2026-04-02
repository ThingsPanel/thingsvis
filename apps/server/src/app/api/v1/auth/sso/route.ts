import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/db';
import { EMBED_SSO_LOGIN_SOURCE, SSO_AUTH_TYPE, SSOExchangeSchema } from '@/lib/validators/auth';
import { ensureDefaultDashboardForUser } from '@/lib/dashboard-helpers';

const ACCESS_TOKEN_EXPIRY = 2 * 60 * 60;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      const text = await request.text();
      if (!text || text.trim().length === 0) {
        return addCorsHeaders(
          NextResponse.json({ error: 'Request body is required' }, { status: 400 }),
        );
      }

      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[SSO] JSON parse error:', parseError);
      return addCorsHeaders(
        NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }),
      );
    }

    const result = SSOExchangeSchema.safeParse(body);
    if (!result.success) {
      console.error('[SSO] Validation failed:', result.error.flatten());
      return addCorsHeaders(
        NextResponse.json(
          {
            error: 'Validation failed',
            details: result.error.flatten(),
          },
          { status: 400 },
        ),
      );
    }

    const { platform, userInfo, role } = result.data;

    let tenant = await prisma.tenant.findUnique({
      where: { slug: `${platform}-${userInfo.tenantId}` },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `${platform} - ${userInfo.tenantId}`,
          slug: `${platform}-${userInfo.tenantId}`,
          plan: 'FREE',
        },
      });
    }

    let user = await prisma.user.findFirst({
      where: {
        ssoProvider: platform,
        ssoSubject: userInfo.id,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: buildSsoShadowEmail(platform, userInfo.id),
          displayEmail: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          ssoProvider: platform,
          ssoSubject: userInfo.id,
          tenantId: tenant.id,
          role: role || 'EDITOR',
          authType: SSO_AUTH_TYPE,
          lastLoginAt: new Date(),
        },
        include: {
          tenant: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayEmail: userInfo.email,
          tenantId: tenant.id,
          name: userInfo.name || user.name,
          authType: SSO_AUTH_TYPE,
          lastLoginAt: new Date(),
        },
        include: {
          tenant: true,
        },
      });
    }

    // Initialize default dashboard for SUPER_ADMIN or TENANT_ADMIN
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
      await ensureDefaultDashboardForUser(user.id, tenant.id, role);
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'thingsvis-dev-secret-key');

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      displayEmail: user.displayEmail,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      authType: user.authType,
      loginSource: EMBED_SSO_LOGIN_SOURCE,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_EXPIRY}s`)
      .sign(secret);

    const refreshToken = await new SignJWT({
      sub: user.id,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${REFRESH_TOKEN_EXPIRY}s`)
      .sign(secret);

    return addCorsHeaders(
      NextResponse.json({
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        authType: user.authType,
        loginSource: EMBED_SSO_LOGIN_SOURCE,
        user: {
          id: user.id,
          email: user.displayEmail || user.email,
          name: user.name,
          role: user.role,
          authType: user.authType,
          loginSource: EMBED_SSO_LOGIN_SOURCE,
          tenantId: user.tenantId,
          tenant: user.tenant
            ? {
                id: user.tenant.id,
                name: user.tenant.name,
              }
            : null,
        },
      }),
    );
  } catch (error) {
    console.error('[SSO] Token exchange error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

function buildSsoShadowEmail(platform: string, subject: string): string {
  const encodedIdentity = Buffer.from(`${platform}:${subject}`).toString('base64url');
  return `sso+${encodedIdentity}@sso.thingsvis.local`;
}
