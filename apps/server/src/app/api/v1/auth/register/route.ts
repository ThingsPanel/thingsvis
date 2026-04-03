import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { LOCAL_AUTH_TYPE, RegisterSchema } from '@/lib/validators/auth';
import { ensureDefaultDashboardForUser } from '@/lib/dashboard-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, name, tenantId, role } = result.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);

    let finalTenantId = tenantId;

    // If no tenantId provided, create a new tenant
    if (!finalTenantId) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email.split('@')[0]}'s Workspace`,
          slug: `tenant-${Date.now()}`,
        },
      });
      finalTenantId = tenant.id;
    } else {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: finalTenantId },
      });
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
    }

    // Determine role: if SUPER_ADMIN or TENANT_ADMIN is provided, use it; otherwise first user is OWNER, rest are VIEWER
    const existingUsers = await prisma.user.count({
      where: { tenantId: finalTenantId },
    });
    const finalRole = role || (existingUsers === 0 ? 'OWNER' : 'VIEWER');

    const user = await prisma.user.create({
      data: {
        email,
        displayEmail: email,
        passwordHash,
        name,
        role: finalRole,
        authType: LOCAL_AUTH_TYPE,
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
    });

    // Initialize default dashboard for SUPER_ADMIN or TENANT_ADMIN
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
      await ensureDefaultDashboardForUser(user.id, finalTenantId, role);
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error({
      msg: 'Register API Error',
      err: error,
      path: '/api/v1/auth/register',
    });

    // Check if it's a Prisma connection error
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P1001') {
        return NextResponse.json(
          { error: 'Database connection failed. Is the database running?' },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
