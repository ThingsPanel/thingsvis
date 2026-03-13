import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/db';
import { SSOExchangeSchema } from '@/lib/validators/auth';

// Token expiry in seconds
const ACCESS_TOKEN_EXPIRY = 2 * 60 * 60; // 2 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

/**
 * CORS configuration for SSO API
 * Allows cross-origin requests from Host Platform and other platforms
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins in development
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(_request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

/**
 * SSO Token Exchange API
 *
 * POST /api/v1/auth/sso
 *
 * Exchanges a Host Platform token for a ThingsVis JWT token.
 * This enables Single Sign-On (SSO) integration.
 *
 * @example Request
 * {
 *   "platform": "host-platform",
 *   "platformToken": "tp_jwt_token_here",
 *   "userInfo": {
 *     "id": "tp_user_123",
 *     "email": "user@example.com",
 *     "name": "张三",
 *     "tenantId": "tenant_abc"
 *   }
 * }
 *
 * @example Response
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresIn": 7200,
 *   "user": {
 *     "id": "user_xyz",
 *     "email": "user@example.com",
 *     "name": "张三",
 *     "role": "EDITOR"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Read and parse request body
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim().length === 0) {
        console.error('[SSO] Empty request body');
        const response = NextResponse.json({ error: 'Request body is required' }, { status: 400 });
        return addCorsHeaders(response);
      }

      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[SSO] JSON parse error:', parseError);
      const response = NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
      return addCorsHeaders(response);
    }

    const result = SSOExchangeSchema.safeParse(body);

    if (!result.success) {
      console.error('[SSO] Validation failed:', result.error.flatten());
      const response = NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        { status: 400 },
      );
      return addCorsHeaders(response);
    }

    const { platform, platformToken: _platformToken, userInfo } = result.data;

    // TODO: Verify platformToken with host platform API
    // For now, we trust the token for development purposes
    // In production, you should implement this verification:
    //
    // const isValid = await verifyHostPlatformToken(platformToken)
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid platform token' },
    //     { status: 401 }
    //   )
    // }
    // 1. Find or create tenant
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

    // 2. Find or create user
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
      // Check if email already exists (for migration scenarios)
      const existingUser = await prisma.user.findUnique({
        where: { email: userInfo.email },
      });

      if (existingUser) {
        // Update existing user with SSO info
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ssoProvider: platform,
            ssoSubject: userInfo.id,
            name: userInfo.name || existingUser.name,
            lastLoginAt: new Date(),
          },
          include: {
            tenant: true,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            ssoProvider: platform,
            ssoSubject: userInfo.id,
            tenantId: tenant.id,
            role: 'EDITOR', // Default role for SSO users
            lastLoginAt: new Date(),
          },
          include: {
            tenant: true,
          },
        });
      }
    } else {
      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // 3. Generate JWT tokens
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'thingsvis-dev-secret-key');

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
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
    const response = NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant
          ? {
              id: user.tenant.id,
              name: user.tenant.name,
            }
          : null,
      },
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error('[SSO] Token exchange error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
