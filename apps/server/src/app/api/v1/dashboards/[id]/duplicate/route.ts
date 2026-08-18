import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';

type Params = { params: Promise<{ id: string }> };

function nextCopyName(name: string): string {
  const versionMatch = name.match(/^(.*?)(?:v|V)(\d+)$/);
  if (versionMatch) {
    return `${versionMatch[1]}v${Number(versionMatch[2]) + 1}`;
  }
  return `${name} 副本`;
}

// POST /api/v1/dashboards/:id/duplicate - Copy a dashboard in the same project.
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const source = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  });

  if (!source) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      name: nextCopyName(source.name),
      projectId: source.projectId,
      createdById: user.id,
      canvasConfig: source.canvasConfig,
      nodes: source.nodes,
      dataSources: source.dataSources,
      variables: source.variables,
      thumbnail: source.thumbnail,
      homeFlag: false,
      version: 1,
    },
  });

  return NextResponse.json({
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    variables: JSON.parse(dashboard.variables || '[]'),
  });
}
