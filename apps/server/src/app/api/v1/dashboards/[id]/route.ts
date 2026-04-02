import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { UpdateDashboardSchema } from '@/lib/validators/dashboard';

type Params = { params: Promise<{ id: string }> };

// Helper to parse dashboard JSON fields for response
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

// GET /api/v1/dashboards/:id - Get dashboard details with parsed JSON fields
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  return NextResponse.json(parseDashboard(dashboard));
}

// PUT /api/v1/dashboards/:id - Update dashboard (creates version history)
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    where: { id, project: { tenantId: user.tenantId } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  // Save version history before updating.
  // Under rapid auto-save, concurrent requests may try to snapshot the same old version.
  // Treat duplicate snapshot creation as harmless and continue.
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

  // Prepare update data - only include fields that are provided
  const updateData: Record<string, unknown> = {
    version: { increment: 1 },
  };

  if (result.data.name !== undefined) {
    updateData.name = result.data.name;
  }
  if (result.data.canvasConfig !== undefined) {
    updateData.canvasConfig = JSON.stringify(result.data.canvasConfig);

    // Sync homeFlag from canvasConfig to Dashboard field
    if (typeof result.data.canvasConfig.homeFlag === 'boolean') {
      if (result.data.canvasConfig.homeFlag) {
        // Clear other homepages in the same project
        await prisma.dashboard.updateMany({
          where: {
            projectId: existing.projectId,
            id: { not: id },
          },
          data: { homeFlag: false },
        });
      }
      updateData.homeFlag = result.data.canvasConfig.homeFlag;
    }
  }
  if (result.data.nodes !== undefined) {
    updateData.nodes = JSON.stringify(result.data.nodes);
  }
  if (result.data.dataSources !== undefined) {
    updateData.dataSources = JSON.stringify(result.data.dataSources);
  }
  if (result.data.variables !== undefined) {
    updateData.variables = JSON.stringify(result.data.variables);
  }
  if (result.data.thumbnail !== undefined) {
    updateData.thumbnail = result.data.thumbnail;
  }

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(parseDashboard(dashboard));
}

// DELETE /api/v1/dashboards/:id - Delete dashboard (cascades to versions)
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  await prisma.dashboard.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
