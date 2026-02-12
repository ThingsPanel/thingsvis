import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5002',  // ThingsPanel frontend
  'http://localhost:5173',  // Vue Host
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5002',
  'http://127.0.0.1:5173',
  'http://c.thingspanel.cn',   // ThingsPanel 测试环境
  'https://c.thingspanel.cn',  // ThingsPanel 测试环境 (HTTPS)
  'http://47.92.253.145',      // ThingsVis 测试服务器
  'http://47.92.253.145:3000', // ThingsVis Studio
  'http://47.92.253.145:3001', // ThingsVis Server
]

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
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || 'thingsvis-dev-secret-key'
  )

  try {
    await jwtVerify(token, secret)
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

  // Allow auth routes, public routes, and health check
  if (isAuthRoute || isPublicRoute || isHealthRoute) {
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
