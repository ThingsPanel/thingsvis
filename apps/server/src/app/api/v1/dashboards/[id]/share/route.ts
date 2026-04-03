import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ id: string }> };
const AUTH_DEBUG = process.env.DEBUG_SHARE_AUTH === '1';

// POST /api/v1/dashboards/:id/share - Generate a share link
export async function POST(request: NextRequest, { params }: Params) {
  const authHeader = request.headers.get('authorization');
  if (AUTH_DEBUG) {
    logger.info({
      msg: 'Share POST auth diagnostics',
      path: request.nextUrl.pathname,
      hasAuthorizationHeader: Boolean(authHeader),
      authHeaderPrefix: authHeader?.split(' ')[0] || null,
      authHeaderLength: authHeader?.length || 0,
      hasCookieHeader: Boolean(request.headers.get('cookie')),
    });
  }

  const user = await getSessionUser(request);
  if (!user) {
    if (AUTH_DEBUG) {
      logger.warn({
        msg: 'Share POST unauthorized',
        path: request.nextUrl.pathname,
        reason: 'getSessionUser returned null',
      });
    }
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

  // Build embed URL with frontend origin, falling back to current request host.
  const frontendOrigin =
    process.env.AUTH_URL ||
    `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${request.headers.get('host') || 'localhost:3000'}`;
  const shareUrl = `${frontendOrigin}/#/embed?id=${id}&shareToken=${shareToken}`;

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

  const frontendOrigin =
    process.env.AUTH_URL ||
    `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${request.headers.get('host') || 'localhost:3000'}`;

  // Mask the token for security (show only first 8 chars)
  const maskedToken = dashboard.shareToken.substring(0, 8) + '****';
  const maskedUrl = `${frontendOrigin}/#/embed?id=${id}&shareToken=${maskedToken}`;

  return NextResponse.json({
    enabled: true,
    url: maskedUrl,
    expiresAt: dashboard.shareExpiry?.toISOString() || null,
  });
}

// DELETE /api/v1/dashboards/:id/share - Revoke share link
export async function DELETE(request: NextRequest, { params }: Params) {
  if (AUTH_DEBUG) {
    const authHeader = request.headers.get('authorization');
    logger.info({
      msg: 'Share DELETE auth diagnostics',
      path: request.nextUrl.pathname,
      hasAuthorizationHeader: Boolean(authHeader),
      authHeaderPrefix: authHeader?.split(' ')[0] || null,
      authHeaderLength: authHeader?.length || 0,
      hasCookieHeader: Boolean(request.headers.get('cookie')),
    });
  }

  const user = await getSessionUser(request);
  if (!user) {
    if (AUTH_DEBUG) {
      logger.warn({
        msg: 'Share DELETE unauthorized',
        path: request.nextUrl.pathname,
        reason: 'getSessionUser returned null',
      });
    }
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

  // 200 + JSON body is safer across all clients than 204 with body.
  return NextResponse.json({ success: true }, { status: 200 });
}
