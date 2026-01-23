import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]

function corsMiddleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  return null
}

export default auth((req) => {
  // Handle CORS preflight
  const corsResponse = corsMiddleware(req)
  if (corsResponse) return corsResponse

  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/v1/auth')
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public')
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health'

  // Get origin for CORS headers
  const origin = req.headers.get('origin')
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
  }

  // Allow auth routes, public routes, and health check
  if (isAuthRoute || isPublicRoute || isHealthRoute) {
    return NextResponse.next({
      headers: corsHeaders,
    })
  }

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
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
