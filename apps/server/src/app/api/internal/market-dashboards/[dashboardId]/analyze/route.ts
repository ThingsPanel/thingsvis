import { NextRequest, NextResponse } from 'next/server';
import { authorizeMarketInternalRequest } from '@/lib/market-internal-auth';
import {
  findTenantDashboard,
  toMarketDashboardSnapshot,
} from '@/lib/market-dashboard-route-helpers';
import { analyzeMarketDashboard } from '@/lib/market-dashboard-template';

type Params = { params: Promise<{ dashboardId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await authorizeMarketInternalRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { dashboardId } = await params;
  const dashboard = await findTenantDashboard(dashboardId, auth.context.tenantId);
  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  try {
    const snapshot = toMarketDashboardSnapshot(dashboard);
    return NextResponse.json({
      dashboard: { id: dashboard.id, name: dashboard.name },
      deviceReferences: analyzeMarketDashboard(snapshot),
    });
  } catch {
    return NextResponse.json({ error: 'Dashboard data is invalid' }, { status: 422 });
  }
}
