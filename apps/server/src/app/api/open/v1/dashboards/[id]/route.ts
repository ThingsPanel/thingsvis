import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyApiKey, hasPermission } from '@/lib/auth/api-key-auth';
import { UpdateDashboardSchema } from '@/lib/validators/dashboard';

type Params = { params: Promise<{ id: string }> };

function parseDashboard(dashboard: {
  canvasConfig: string;
  nodes: string;
  dataSources: string;
  variables?: unknown;
  shareConfig?: string | null;
  [key: string]: unknown;
}) {
  return {
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    variables: JSON.parse((dashboard.variables as string) || '[]'),
    shareConfig: dashboard.shareConfig ? JSON.parse(dashboard.shareConfig) : null,
  };
}

// GET /api/open/v1/dashboards/:id
export async function GET(request: NextRequest, { params }: Params) {
  const principal = await verifyApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(principal, 'dashboard:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: principal.tenantId } },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  return NextResponse.json(parseDashboard(dashboard));
}

// PUT /api/open/v1/dashboards/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const principal = await verifyApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(principal, 'dashboard:write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const result = UpdateDashboardSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: principal.tenantId } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  try {
    await prisma.dashboardVersion.create({
      data: {
        dashboardId: existing.id,
        version: existing.version,
        canvasConfig: existing.canvasConfig,
        nodes: existing.nodes,
        dataSources: existing.dataSources,
        variables: existing.variables,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
      throw error;
    }
  }

  const updateData: Record<string, unknown> = {
    version: { increment: 1 },
  };

  if (result.data.name !== undefined) updateData.name = result.data.name;
  if (result.data.canvasConfig !== undefined)
    updateData.canvasConfig = JSON.stringify(result.data.canvasConfig);
  if (result.data.nodes !== undefined) updateData.nodes = JSON.stringify(result.data.nodes);
  if (result.data.dataSources !== undefined)
    updateData.dataSources = JSON.stringify(result.data.dataSources);
  if (result.data.variables !== undefined)
    updateData.variables = JSON.stringify(result.data.variables);
  if (result.data.thumbnail !== undefined) updateData.thumbnail = result.data.thumbnail;

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(parseDashboard(dashboard));
}

// DELETE /api/open/v1/dashboards/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const principal = await verifyApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(principal, 'dashboard:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: principal.tenantId } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  await prisma.dashboard.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
