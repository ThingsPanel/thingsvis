import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyApiKey, hasPermission } from '@/lib/auth/api-key-auth';
import { CreateDashboardSchema, DEFAULT_CANVAS_CONFIG } from '@/lib/validators/dashboard';

function parseDashboardForResponse(dashboard: {
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

// GET /api/open/v1/dashboards - List dashboards
export async function GET(request: NextRequest) {
  const principal = await verifyApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(principal, 'dashboard:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  const where = {
    project: { tenantId: principal.tenantId },
    ...(projectId && { projectId }),
  };

  const [dashboards, total] = await Promise.all([
    prisma.dashboard.findMany({
      where,
      select: {
        id: true,
        name: true,
        version: true,
        isPublished: true,
        homeFlag: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dashboard.count({ where }),
  ]);

  return NextResponse.json({
    data: dashboards,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/open/v1/dashboards - Create a dashboard
export async function POST(request: NextRequest) {
  const principal = await verifyApiKey(request);
  if (!principal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(principal, 'dashboard:write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = CreateDashboardSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId: providedProjectId, canvasConfig, variables, ...data } = result.data;

  let projectId = providedProjectId;

  // API key requests have no user; resolve the tenant's first user as the system creator
  const systemUser = await prisma.user.findFirst({
    where: { tenantId: principal.tenantId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!systemUser) {
    return NextResponse.json({ error: 'No users found for tenant' }, { status: 500 });
  }

  if (!projectId) {
    const defaultProject = await prisma.project.findFirst({
      where: { tenantId: principal.tenantId, name: 'Default Project' },
    });

    if (defaultProject) {
      projectId = defaultProject.id;
    } else {
      const newProject = await prisma.project.create({
        data: {
          name: 'Default Project',
          tenantId: principal.tenantId,
          createdById: systemUser.id,
        },
      });
      projectId = newProject.id;
    }
  } else {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: principal.tenantId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      ...data,
      canvasConfig: JSON.stringify(canvasConfig || DEFAULT_CANVAS_CONFIG),
      nodes: '[]',
      dataSources: '[]',
      variables: JSON.stringify(variables || []),
      projectId,
      createdById: systemUser.id,
    },
  });

  return NextResponse.json(parseDashboardForResponse(dashboard), { status: 201 });
}
