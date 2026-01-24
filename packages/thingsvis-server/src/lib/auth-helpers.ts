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
    
    
    if (!authHeader?.startsWith('Bearer ')) {
      
      return null
    }

    const token = authHeader.substring(7)
    
    
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'thingsvis-dev-secret-key'
    )
    

    const { payload } = await jwtVerify(token, secret)
    
    
    // Return user object matching session user format
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
      tenantId: payload.tenantId as string,
    }
  } catch (error) {
    
    return null
  }
}
