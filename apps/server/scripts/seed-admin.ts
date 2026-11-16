import { compare } from 'bcryptjs';

export async function seedAdmin(
  prisma: any,
  hash: (password: string, rounds: number) => Promise<string>,
) {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@thingsvis.io';
  // Preserve existing passwords except for the previously distributed default.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && (!existing.passwordHash || !(await compare('admin123', existing.passwordHash))))
    return;
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  if (password.length < 12 || password === 'admin123' || new Set(password).size < 6) {
    throw new Error(
      'Set a unique SEED_ADMIN_PASSWORD of at least 12 characters for initialization or legacy default-password replacement',
    );
  }
  if (existing) {
    await prisma.user.updateMany({
      where: { id: existing.id, passwordHash: existing.passwordHash },
      data: { passwordHash: await hash(password, 12) },
    });
    return;
  }
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { name: 'Default Tenant', slug: 'default', plan: 'FREE' },
  });
  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      displayEmail: email,
      name: process.env.SEED_ADMIN_NAME || 'Admin',
      passwordHash,
      role: 'OWNER',
      authType: 'LOCAL',
      tenantId: tenant.id,
    },
  });
}
