import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

// GET /api/v1/dashboards/:id/validate-share?shareToken=xxx
// Stateless validation - no authentication required
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get('shareToken');

  if (!shareToken) {
    return NextResponse.json({ valid: false, error: 'Share token is required' }, { status: 400 });
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!dashboard) {
    return NextResponse.json({ valid: false, error: 'Dashboard not found' }, { status: 404 });
  }

  // Check if sharing is enabled
  if (!dashboard.shareEnabled) {
    return NextResponse.json({ valid: false, error: 'Share not enabled' }, { status: 403 });
  }

  // Check if token matches
  if (dashboard.shareToken !== shareToken) {
    return NextResponse.json({ valid: false, error: 'Invalid share token' }, { status: 403 });
  }

  // Check if token has expired
  if (dashboard.shareExpiry && dashboard.shareExpiry < new Date()) {
    return NextResponse.json({ valid: false, error: 'Share link has expired' }, { status: 403 });
  }

  // All checks passed - return the dashboard data
  return NextResponse.json({
    valid: true,
    dashboard: parseDashboard(dashboard),
  });
}
