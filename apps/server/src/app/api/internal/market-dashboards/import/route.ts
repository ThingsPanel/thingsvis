import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authorizeMarketInternalRequest } from '@/lib/market-internal-auth';
import { importMarketDashboard } from '@/lib/market-dashboard-template';

const ImportRequestSchema = z.object({
  dashboardSnapshot: z.object({
    name: z.string().min(1).max(100),
    schemaVersion: z.string().min(1),
    canvasConfig: z.record(z.unknown()),
    nodes: z.array(z.unknown()),
    dataSources: z.array(z.unknown()),
    variables: z.array(z.unknown()),
  }),
  deviceBindings: z.array(
    z.object({
      bindingKey: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
      localDeviceId: z.string().min(1),
    }),
  ),
  name: z.string().min(1).max(100).optional(),
  projectId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authorizeMarketInternalRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = ImportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: auth.context.userId, tenantId: auth.context.tenantId },
  });
  if (!user) return NextResponse.json({ error: 'ThingsVis user not found' }, { status: 404 });

  let projectId = parsed.data.projectId;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: auth.context.tenantId },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  } else {
    const project =
      (await prisma.project.findFirst({
        where: { tenantId: auth.context.tenantId, name: 'Default Project' },
      })) ??
      (await prisma.project.create({
        data: {
          name: 'Default Project',
          tenantId: auth.context.tenantId,
          createdById: user.id,
        },
      }));
    projectId = project.id;
  }

  try {
    const snapshot = importMarketDashboard(
      parsed.data.dashboardSnapshot,
      parsed.data.deviceBindings,
    );
    const dashboard = await prisma.dashboard.create({
      data: {
        name: parsed.data.name ?? snapshot.name,
        canvasConfig: JSON.stringify(snapshot.canvasConfig),
        nodes: JSON.stringify(snapshot.nodes),
        dataSources: JSON.stringify(snapshot.dataSources),
        variables: JSON.stringify(snapshot.variables),
        projectId,
        createdById: user.id,
      },
    });

    return NextResponse.json(
      { dashboardId: dashboard.id, projectId: dashboard.projectId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dashboard import failed' },
      { status: 422 },
    );
  }
}
