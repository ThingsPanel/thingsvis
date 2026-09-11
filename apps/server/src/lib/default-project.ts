import { createHash } from 'node:crypto';
import { prisma } from './db';

export const DEFAULT_PROJECT_NAME = '默认项目';
const LEGACY_DEFAULT_PROJECT_NAME = 'Default Project';

export function defaultProjectId(tenantId: string) {
  const suffix = createHash('sha256').update(tenantId).digest('hex').slice(0, 24);
  return `default-project-${suffix}`;
}

export function isDefaultProject(project: { id: string; name: string; tenantId: string }) {
  return (
    project.id === defaultProjectId(project.tenantId) ||
    project.name === DEFAULT_PROJECT_NAME ||
    project.name === LEGACY_DEFAULT_PROJECT_NAME
  );
}

export async function ensureDefaultProject(tenantId: string, createdById: string) {
  const existing = await prisma.project.findFirst({
    where: { tenantId, name: { in: [DEFAULT_PROJECT_NAME, LEGACY_DEFAULT_PROJECT_NAME] } },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  return prisma.project.upsert({
    where: { id: defaultProjectId(tenantId) },
    update: {},
    create: {
      id: defaultProjectId(tenantId),
      name: DEFAULT_PROJECT_NAME,
      tenantId,
      createdById,
    },
  });
}
