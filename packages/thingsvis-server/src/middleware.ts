import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public')
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health'

  // Allow auth routes and public routes
  if (isAuthRoute || isPublicRoute || isHealthRoute) return

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
})

export const config = {
  matcher: ['/api/:path*'],
}
