import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyApiKey, hasPermission } from '@/lib/auth/api-key-auth';
import { UpdateDashboardSchema } from '@/lib/validators/dashboard';

type Params = { params: Promise<{ id: string }> };

class DashboardNotFoundError extends Error {}

class DashboardVersionConflictError extends Error {
  constructor(public readonly currentVersion: number) {
    super('Dashboard version conflict');
  }
}

function parseDashboard(dashboard: {
  canvasConfig: string;
  nodes: string;
  dataSources: string;
  variables?: unknown;
  [key: string]: unknown;
}) {
  return {
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    variables: JSON.parse((dashboard.variables as string) || '[]'),
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

  const { expectedVersion, ...updateInput } = result.data;
  const updateData: Record<string, unknown> = {
    version: { increment: 1 },
  };

  if (updateInput.name !== undefined) updateData.name = updateInput.name;
  if (updateInput.canvasConfig !== undefined)
    updateData.canvasConfig = JSON.stringify(updateInput.canvasConfig);
  if (updateInput.nodes !== undefined) updateData.nodes = JSON.stringify(updateInput.nodes);
  if (updateInput.dataSources !== undefined)
    updateData.dataSources = JSON.stringify(updateInput.dataSources);
  if (updateInput.variables !== undefined)
    updateData.variables = JSON.stringify(updateInput.variables);
  if (updateInput.thumbnail !== undefined) updateData.thumbnail = updateInput.thumbnail;

  try {
    const dashboard = await prisma.$transaction(async (tx) => {
      const existing = await tx.dashboard.findFirst({
        where: { id, project: { tenantId: principal.tenantId } },
      });
      if (!existing) throw new DashboardNotFoundError();

      await tx.dashboardVersion.createMany({
        data: [
          {
            dashboardId: existing.id,
            version: existing.version,
            canvasConfig: existing.canvasConfig,
            nodes: existing.nodes,
            dataSources: existing.dataSources,
            variables: existing.variables,
          },
        ],
        skipDuplicates: true,
      });

      const updated = await tx.dashboard.updateMany({
        where: {
          id,
          ...(expectedVersion === undefined ? {} : { version: expectedVersion }),
        },
        data: updateData,
      });
      if (updated.count !== 1) throw new DashboardVersionConflictError(existing.version);

      return tx.dashboard.findUniqueOrThrow({ where: { id } });
    });

    return NextResponse.json(parseDashboard(dashboard));
  } catch (error) {
    if (error instanceof DashboardNotFoundError) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }
    if (error instanceof DashboardVersionConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'DASHBOARD_VERSION_CONFLICT',
          currentVersion: error.currentVersion,
        },
        { status: 409 },
      );
    }
    throw error;
  }
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
