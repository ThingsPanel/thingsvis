import { prisma } from '@/lib/db';
import {
  DEFAULT_DASHBOARD_CONFIGS,
  type DefaultDashboardRole,
} from '@/constants/default-dashboards';
import { logger } from '@/lib/logger';

/**
 * Ensures the user has a default home dashboard based on their role.
 *
 * Flow:
 * 1. Find or create the default project for the tenant
 * 2. Find or create the default dashboard within that project
 * 3. Set the dashboard as the home dashboard (homeFlag: true)
 *
 * This function is idempotent — running it multiple times is safe.
 */
export async function ensureDefaultDashboardForUser(
  userId: string,
  tenantId: string,
  role: DefaultDashboardRole,
): Promise<void> {
  const config = DEFAULT_DASHBOARD_CONFIGS[role];

  // 1. Find or create project
  let project = await prisma.project.findFirst({
    where: {
      tenantId,
      name: config.projectName,
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: config.projectName,
        tenantId,
        createdById: userId,
      },
    });

    logger.info({
      msg: '[DashboardInit] Created default project',
      projectId: project.id,
      projectName: project.name,
      role,
    });
  }

  // 2. Check if dashboard already exists
  const existingDashboard = await prisma.dashboard.findFirst({
    where: {
      projectId: project.id,
      name: config.dashboardName,
    },
  });

  if (existingDashboard) {
    // Dashboard already exists, skip creation
    logger.info({
      msg: '[DashboardInit] Default dashboard already exists, skipping',
      dashboardId: existingDashboard.id,
      dashboardName: existingDashboard.name,
      role,
    });
    return;
  }

  // 3. Create dashboard
  const dashboard = await prisma.dashboard.create({
    data: {
      name: config.dashboardName,
      projectId: project.id,
      createdById: userId,
      homeFlag: true,
      canvasConfig: config.canvasConfig,
      nodes: config.nodes,
      dataSources: config.dataSources,
      variables: config.variables,
      version: 1,
    },
  });

  logger.info({
    msg: '[DashboardInit] Created default dashboard',
    dashboardId: dashboard.id,
    dashboardName: dashboard.name,
    projectId: project.id,
    role,
  });
}
