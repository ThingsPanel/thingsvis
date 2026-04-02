import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ token: string }> };

// GET /api/v1/public/dashboard/:token - Get public dashboard data
export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params;

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      shareToken: token,
      isPublished: true,
      shareEnabled: true,
    },
    select: {
      id: true,
      name: true,
      canvasConfig: true,
      nodes: true,
      dataSources: true,
      shareExpiry: true,
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  // Check expiration
  if (dashboard.shareExpiry && dashboard.shareExpiry < new Date()) {
    return NextResponse.json({ error: 'Share link expired' }, { status: 410 });
  }

  // Return only public-safe dashboard fields
  return NextResponse.json({
    id: dashboard.id,
    name: dashboard.name,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
  });
}
