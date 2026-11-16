import { afterEach, expect, it, vi } from 'vitest';
import { seedAdmin } from './seed-admin';
import { hash } from 'bcryptjs';
afterEach(() => vi.unstubAllEnvs());
function db(existing: unknown) {
  return {
    user: { findUnique: vi.fn().mockResolvedValue(existing), upsert: vi.fn(), updateMany: vi.fn() },
    tenant: { upsert: vi.fn().mockResolvedValue({ id: 't1' }) },
  };
}
it('preserves existing admin credentials on restart without requiring a seed password', async () => {
  const prisma = db({ id: 'existing' });
  vi.stubEnv('SEED_ADMIN_PASSWORD', '');
  await seedAdmin(prisma, vi.fn());
  expect(prisma.user.upsert).not.toHaveBeenCalled();
});
it('rejects an unset/default seed password before creating any records', async () => {
  for (const password of ['', 'admin123']) {
    vi.stubEnv('SEED_ADMIN_PASSWORD', password);
    const prisma = db(null);
    await expect(seedAdmin(prisma, vi.fn())).rejects.toThrow('SEED_ADMIN_PASSWORD');
    expect(prisma.tenant.upsert).not.toHaveBeenCalled();
  }
});
it('initializes once with a supplied password and never includes password in updates', async () => {
  vi.stubEnv('SEED_ADMIN_PASSWORD', 'test-only-LongPassword9');
  const prisma = db(null);
  await seedAdmin(prisma, vi.fn().mockResolvedValue('hash'));
  expect(prisma.user.upsert.mock.calls[0][0]).toMatchObject({
    update: {},
    create: { passwordHash: 'hash' },
  });
});
it('requires rotation for an existing legacy default password, preserving roles', async () => {
  const prisma = db({ id: 'old-admin', passwordHash: await hash('admin123', 4) });
  vi.stubEnv('SEED_ADMIN_PASSWORD', '');
  await expect(seedAdmin(prisma, vi.fn())).rejects.toThrow('SEED_ADMIN_PASSWORD');
  vi.stubEnv('SEED_ADMIN_PASSWORD', 'new-test-only-Password9');
  await seedAdmin(prisma, vi.fn().mockResolvedValue('new-hash'));
  expect(prisma.user.updateMany.mock.calls[0][0].data).toEqual({ passwordHash: 'new-hash' });
  expect(prisma.tenant.upsert).not.toHaveBeenCalled();
});
