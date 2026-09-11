import { prisma } from './db';

export const DEFAULT_PROJECT_SYSTEM_KEY = 'DEFAULT';
export const DEFAULT_PROJECT_NAME = '默认项目';

export async function ensureDefaultProject(tenantId: string, createdById: string) {
  return prisma.project.upsert({
    where: {
      tenantId_systemKey: { tenantId, systemKey: DEFAULT_PROJECT_SYSTEM_KEY },
    },
    update: {},
    create: {
      name: DEFAULT_PROJECT_NAME,
      systemKey: DEFAULT_PROJECT_SYSTEM_KEY,
      tenantId,
      createdById,
    },
  });
}
