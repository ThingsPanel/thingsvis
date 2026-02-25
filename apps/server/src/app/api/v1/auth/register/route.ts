import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { RegisterSchema } from '@/lib/validators/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = RegisterSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, name, tenantId } = result.data

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    let finalTenantId = tenantId

    // If no tenantId provided, create a new tenant
    if (!finalTenantId) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email.split('@')[0]}'s Workspace`,
          slug: `tenant-${Date.now()}`,
        },
      })
      finalTenantId = tenant.id
    } else {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: finalTenantId },
      })
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Determine role: first user in tenant is OWNER
    const existingUsers = await prisma.user.count({
      where: { tenantId: finalTenantId },
    })
    const role = existingUsers === 0 ? 'OWNER' : 'VIEWER'

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        tenantId: finalTenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('[Auth] Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
