import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { generateApiKey } from '@/lib/auth/api-key-auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const CreateAppSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).nonempty().default(['dashboard:read']),
  allowedOrigins: z.array(z.string()).default([]),
  initialKeyLabel: z.string().max(100).optional(),
});

// GET /api/open/v1/apps - List third-party apps for current tenant
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apps = await prisma.thirdPartyApp.findMany({
    where: { tenantId: user.tenantId },
    select: {
      id: true,
      appId: true,
      name: true,
      permissions: true,
      allowedOrigins: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      apiKeys: {
        where: { isRevoked: false },
        select: {
          id: true,
          prefix: true,
          label: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    data: apps.map((app) => ({
      ...app,
      permissions: JSON.parse(app.permissions as string),
      allowedOrigins: JSON.parse(app.allowedOrigins as string),
    })),
  });
}

// POST /api/open/v1/apps - Register a new third-party app and create its first key
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const result = CreateAppSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { name, permissions, allowedOrigins, initialKeyLabel } = result.data;

  const appId = nanoid(16);
  const { rawKey, prefix, keyHash } = generateApiKey();

  const app = await prisma.thirdPartyApp.create({
    data: {
      appId,
      name,
      appSecretHash: '',
      permissions: JSON.stringify(permissions),
      allowedOrigins: JSON.stringify(allowedOrigins),
      isActive: true,
      tenantId: user.tenantId,
      apiKeys: {
        create: {
          prefix,
          keyHash,
          label: initialKeyLabel ?? 'Initial key',
        },
      },
    },
    include: {
      apiKeys: { select: { id: true, prefix: true, label: true } },
    },
  });

  // rawKey is returned ONCE and never stored — the caller must save it
  return NextResponse.json(
    {
      app: {
        id: app.id,
        appId: app.appId,
        name: app.name,
        permissions,
        allowedOrigins,
        isActive: app.isActive,
      },
      key: {
        id: app.apiKeys[0].id,
        prefix: app.apiKeys[0].prefix,
        label: app.apiKeys[0].label,
        rawKey,
      },
      warning: 'Store the rawKey securely. It will not be shown again.',
    },
    { status: 201 },
  );
}
