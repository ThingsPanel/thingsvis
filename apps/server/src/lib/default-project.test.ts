import { beforeEach, describe, expect, it, vi } from 'vitest';

const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock('./db', () => ({
  prisma: { project: { upsert } },
}));

import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PROJECT_SYSTEM_KEY,
  ensureDefaultProject,
} from './default-project';

describe('ensureDefaultProject', () => {
  beforeEach(() => upsert.mockReset());

  it('uses a tenant-scoped system key and is safe to call repeatedly', async () => {
    upsert.mockResolvedValue({ id: 'default-project' });

    await ensureDefaultProject('tenant-1', 'user-1');

    expect(upsert).toHaveBeenCalledWith({
      where: {
        tenantId_systemKey: {
          tenantId: 'tenant-1',
          systemKey: DEFAULT_PROJECT_SYSTEM_KEY,
        },
      },
      update: {},
      create: {
        name: DEFAULT_PROJECT_NAME,
        systemKey: DEFAULT_PROJECT_SYSTEM_KEY,
        tenantId: 'tenant-1',
        createdById: 'user-1',
      },
    });
  });
});
