import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { generateApiKey } from '@/lib/auth/api-key-auth';
import { z } from 'zod';

type Params = { params: Promise<{ appId: string }> };

const CreateKeySchema = z.object({
  label: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

// POST /api/open/v1/apps/:appId/keys - Create a new API key for the app
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appId } = await params;

  const app = await prisma.thirdPartyApp.findFirst({
    where: { appId, tenantId: user.tenantId },
  });

  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const result = CreateKeySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { rawKey, prefix, keyHash } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      prefix,
      keyHash,
      label: result.data.label,
      expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
      appId: app.id,
    },
  });

  // rawKey is returned ONCE and never stored
  return NextResponse.json(
    {
      key: {
        id: apiKey.id,
        prefix: apiKey.prefix,
        label: apiKey.label,
        expiresAt: apiKey.expiresAt,
        rawKey,
      },
      warning: 'Store the rawKey securely. It will not be shown again.',
    },
    { status: 201 },
  );
}

// DELETE /api/open/v1/apps/:appId/keys - Revoke all non-revoked keys for the app
// To revoke a specific key, pass ?keyId=<id> in the query string.
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appId } = await params;

  const app = await prisma.thirdPartyApp.findFirst({
    where: { appId, tenantId: user.tenantId },
  });

  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('keyId');

  if (keyId) {
    // Revoke a specific key
    const existing = await prisma.apiKey.findFirst({
      where: { id: keyId, appId: app.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isRevoked: true },
    });

    return NextResponse.json({ success: true, revokedCount: 1 });
  }

  // Revoke all active keys for the app
  const { count } = await prisma.apiKey.updateMany({
    where: { appId: app.id, isRevoked: false },
    data: { isRevoked: true },
  });

  return NextResponse.json({ success: true, revokedCount: count });
}
