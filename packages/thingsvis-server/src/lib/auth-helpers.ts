import { auth } from './auth'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from './db'

/**
 * Get current user from NextAuth session OR Bearer token
 * Supports both NextAuth (for server-side rendering) and JWT Bearer tokens (for API)
 */
export async function getSessionUser(request?: NextRequest) {
  // Try NextAuth session first
  const session = await auth()
  if (session?.user) {
    return session.user
  }

  // If no session, try Bearer token from request
  if (!request) return null

  try {
    const authHeader = request.headers.get('authorization')
    console.log('[auth-helpers] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'none')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[auth-helpers] No Bearer token found')
      return null
    }

    const token = authHeader.substring(7)
    console.log('[auth-helpers] Extracted token:', token.substring(0, 30) + '...')
    
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'thingsvis-dev-secret-key'
    )
    console.log('[auth-helpers] Using secret length:', secret.length)

    const { payload } = await jwtVerify(token, secret)
    console.log('[auth-helpers] JWT verification successful:', payload)
    
    // Return user object matching session user format
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
      tenantId: payload.tenantId as string,
    }
  } catch (error) {
    console.error('[auth-helpers] Token verification failed:', error)
    return null
  }
}
