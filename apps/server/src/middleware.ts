import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const { auth } = NextAuth(authConfig);

// CORS configuration — configurable via ALLOWED_ORIGINS env var
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '*';
const allowedOrigins =
  allowedOriginsStr === '*'
    ? []
    : allowedOriginsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

function corsMiddleware(req: NextRequest) {
  const origin = req.headers.get('origin');

  // If ALLOWED_ORIGINS is '*' (or empty which defaults to '*'), allow all origins.
  // Otherwise, only allow if it's in the list.
  const isAllowedOrigin =
    allowedOriginsStr === '*' ? true : origin && allowedOrigins.includes(origin);
  const responseOrigin = isAllowedOrigin && origin ? origin : allowedOrigins[0] || '*';

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return { origin: responseOrigin };
}

async function hasValidBearerToken(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.substring(7);
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    console.error('[Auth] ERROR: AUTH_SECRET is not set. Environment must provide a valid secret.');
    return false;
  }

  const encodedSecret = new TextEncoder().encode(secret);

  try {
    await jwtVerify(token, encodedSecret);
    return true;
  } catch {
    return false;
  }
}

export default auth(async (req) => {
  // Handle CORS preflight
  const corsResponse = corsMiddleware(req);
  if (corsResponse && corsResponse instanceof NextResponse) return corsResponse;

  const responseOrigin = corsResponse
    ? corsResponse.origin
    : allowedOriginsStr === '*'
      ? req.headers.get('origin') || '*'
      : allowedOrigins[0] || '*';

  const isLoggedIn = !!req.auth;
  const hasBearer = await hasValidBearerToken(req);
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1');
  const isOpenApiRoute = req.nextUrl.pathname.startsWith('/api/open/v1');
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/v1/auth');
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public');
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health';
  const isUploadRoute = req.nextUrl.pathname.startsWith('/api/v1/uploads');

  const corsHeaders = {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Cookie, X-Requested-With, X-Api-Key',
  };

  // Open API routes: validated per-route by verifyApiKey(); middleware only sets CORS headers.
  // App-management routes under /api/open/v1/apps require a user session and are protected
  // at the route handler level by checking req.auth / getSessionUser().
  if (isOpenApiRoute) {
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Allow auth routes, public routes, health check, and uploads (handler has its own optional auth).
  if (isAuthRoute || isPublicRoute || isHealthRoute || isUploadRoute) {
    return NextResponse.next({
      headers: corsHeaders,
    });
  }

  // Protect API routes
  if (isApiRoute && !isLoggedIn && !hasBearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
});

export const config = {
  matcher: ['/api/:path*'],
};
