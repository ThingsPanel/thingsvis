import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';

type Params = { params: Promise<{ id: string }> };

// POST /api/v1/dashboards/:id/share - Generate a share link
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  // Generate new UUID v4 share token
  const shareToken = randomUUID();

  // Calculate expiry time if expiresIn is provided (in seconds)
  let shareExpiry: Date | null = null;
  if (body.expiresIn && typeof body.expiresIn === 'number' && body.expiresIn > 0) {
    shareExpiry = new Date(Date.now() + body.expiresIn * 1000);
  }

  // Update dashboard with share settings
  await prisma.dashboard.update({
    where: { id },
    data: {
      shareToken,
      shareExpiry,
      shareEnabled: true,
    },
  });

  // Get the host from request headers for building full URL
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const shareUrl = `${protocol}://${host}/embed/dashboard?id=${id}&shareToken=${shareToken}`;

  return NextResponse.json({
    shareUrl,
    expiresAt: shareExpiry?.toISOString() || null,
  });
}

// GET /api/v1/dashboards/:id/share - Get share link info (with masked token)
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    select: {
      id: true,
      shareToken: true,
      shareExpiry: true,
      shareEnabled: true,
      updatedAt: true,
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  if (!dashboard.shareEnabled || !dashboard.shareToken) {
    return NextResponse.json({
      enabled: false,
      url: null,
      expiresAt: null,
    });
  }

  // Get the host from request headers for building full URL
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  // Mask the token for security (show only first 8 chars)
  const maskedToken = dashboard.shareToken.substring(0, 8) + '****';
  const maskedUrl = `${protocol}://${host}/embed/dashboard?id=${id}&shareToken=${maskedToken}`;

  return NextResponse.json({
    enabled: true,
    url: maskedUrl,
    expiresAt: dashboard.shareExpiry?.toISOString() || null,
  });
}

// DELETE /api/v1/dashboards/:id/share - Revoke share link
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  await prisma.dashboard.update({
    where: { id },
    data: {
      shareToken: null,
      shareExpiry: null,
      shareEnabled: false,
    },
  });

  return NextResponse.json({ success: true }, { status: 204 });
}
