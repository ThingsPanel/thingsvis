import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// CORS configuration — configurable via ALLOWED_ORIGINS env var
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:5173',  // Vite dev server
]

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : defaultOrigins

function corsMiddleware(req: NextRequest) {
  const origin = req.headers.get('origin')

  // In development, allow all localhost/127.0.0.1 origins
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const isLocalhost = origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')
  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || (isDevelopment && isLocalhost))

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin! : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  return null
}

async function hasValidBearerToken(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.substring(7)
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    console.error('AUTH_SECRET is not set — token validation will fail')
    return false
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
  if (corsResponse) return corsResponse

  const isLoggedIn = !!req.auth
  const hasBearer = await hasValidBearerToken(req)
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/v1/auth')
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public')
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health'
  // TODO: Remove this temporary bypass once token authentication is properly configured
  const isUploadsRoute = req.nextUrl.pathname.startsWith('/api/v1/uploads')

  // Get origin for CORS headers
  const origin = req.headers.get('origin')
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const isLocalhost = origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')
  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || (isDevelopment && isLocalhost))

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin! : allowedOrigins[0],
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

