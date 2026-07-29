import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeMarketInternalRequest } from '@/lib/market-internal-auth';
import {
  findTenantDashboard,
  toMarketDashboardSnapshot,
} from '@/lib/market-dashboard-route-helpers';
import { exportMarketDashboard } from '@/lib/market-dashboard-template';

type Params = { params: Promise<{ dashboardId: string }> };

const ExportRequestSchema = z.object({
  deviceRoles: z.array(
    z.object({
      sourceDeviceId: z.string().min(1),
      bindingKey: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
      displayName: z.string().max(100).optional(),
    }),
  ),
});

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await authorizeMarketInternalRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = ExportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { dashboardId } = await params;
  const dashboard = await findTenantDashboard(dashboardId, auth.context.tenantId);
  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
  }

  try {
    return NextResponse.json(
      exportMarketDashboard(toMarketDashboardSnapshot(dashboard), parsed.data.deviceRoles),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dashboard export failed' },
      { status: 422 },
    );
  }
}
