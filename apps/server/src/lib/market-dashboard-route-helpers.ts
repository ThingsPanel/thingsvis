import { prisma } from './db';
import type { MarketDashboardSnapshot } from './market-dashboard-template';

export async function findTenantDashboard(dashboardId: string, tenantId: string) {
  return prisma.dashboard.findFirst({
    where: { id: dashboardId, project: { tenantId } },
  });
}

export function toMarketDashboardSnapshot(dashboard: {
  name: string;
  canvasConfig: string;
  nodes: string;
  dataSources: string;
  variables: string;
}): MarketDashboardSnapshot {
  return {
    name: dashboard.name,
    schemaVersion: 'thingsvis-1',
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    variables: JSON.parse(dashboard.variables || '[]'),
  };
}
