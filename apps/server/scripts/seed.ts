import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { seedAdmin } from './seed-admin';
const prisma = new PrismaClient();
seedAdmin(prisma, hash)
  .then(() => console.log('Seed complete'))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
