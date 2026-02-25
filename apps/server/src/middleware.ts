import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// CORS configuration — configurable via ALLOWED_ORIGINS env var
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '*'
const allowedOrigins = allowedOriginsStr === '*' ? [] : allowedOriginsStr.split(',').map(s => s.trim()).filter(Boolean)

function corsMiddleware(req: NextRequest) {
  const origin = req.headers.get('origin')

  // If ALLOWED_ORIGINS is '*' (or empty which defaults to '*'), allow all origins.
  // Otherwise, only allow if it's in the list.
  const isAllowedOrigin = allowedOriginsStr === '*' ? true : (origin && allowedOrigins.includes(origin))
  const responseOrigin = isAllowedOrigin && origin ? origin : (allowedOrigins[0] || '*')

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
    })
  }

  return { origin: responseOrigin }
}

async function hasValidBearerToken(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.substring(7)
  const secret = process.env.AUTH_SECRET || 'thingsvis-dev-secret-key'
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
    console.error('[Auth] WARNING: AUTH_SECRET is not set in production — using insecure default!')
  }
  const encodedSecret = new TextEncoder().encode(secret)

  try {
    await jwtVerify(token, encodedSecret)
    return true
  } catch {
    return false
  }
}

export default auth(async (req) => {
  // Handle CORS preflight
  const corsResponse = corsMiddleware(req)
  if (corsResponse && corsResponse instanceof NextResponse) return corsResponse

  const responseOrigin = corsResponse ? corsResponse.origin : allowedOriginsStr === '*' ? (req.headers.get('origin') || '*') : (allowedOrigins[0] || '*')

  const isLoggedIn = !!req.auth
  const hasBearer = await hasValidBearerToken(req)
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/v1/auth')
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public')
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health'
  // TODO: Remove this temporary bypass once token authentication is properly configured
  const isUploadsRoute = req.nextUrl.pathname.startsWith('/api/v1/uploads')

  const corsHeaders = {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
  }

  // Allow auth routes, public routes, health check, and uploads (temporary)
  if (isAuthRoute || isPublicRoute || isHealthRoute || isUploadsRoute) {
    return NextResponse.next({
      headers: corsHeaders,
    })
  }

  // Protect API routes
  if (isApiRoute && !isLoggedIn && !hasBearer) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    )
  }

  // Add CORS headers to all responses
  const response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
})

export const config = {
  matcher: ['/api/:path*'],
}

