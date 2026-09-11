import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, upsert } = vi.hoisted(() => ({ findFirst: vi.fn(), upsert: vi.fn() }));

vi.mock('./db', () => ({
  prisma: { project: { findFirst, upsert } },
}));

import { DEFAULT_PROJECT_NAME, defaultProjectId, ensureDefaultProject } from './default-project';

describe('ensureDefaultProject', () => {
  beforeEach(() => {
    findFirst.mockReset();
    upsert.mockReset();
    findFirst.mockResolvedValue(null);
  });

  it('uses a deterministic tenant-scoped id and is safe to call repeatedly', async () => {
    upsert.mockResolvedValue({ id: defaultProjectId('tenant-1') });

    await ensureDefaultProject('tenant-1', 'user-1');

    expect(upsert).toHaveBeenCalledWith({
      where: { id: defaultProjectId('tenant-1') },
      update: {},
      create: {
        id: defaultProjectId('tenant-1'),
        name: DEFAULT_PROJECT_NAME,
        tenantId: 'tenant-1',
        createdById: 'user-1',
      },
    });
  });
});
