import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: 'pretty',
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

if (!globalForPrisma.prisma) {
  // @ts-ignore
  prisma.$on('error', (e) => {
    logger.error({ msg: 'Prisma Client Error', dbError: e });
  });
  // @ts-ignore
  prisma.$on('warn', (e) => {
    logger.warn({ msg: 'Prisma Client Warning', dbWarn: e });
  });
}

// Startup diagnostic - log environment and test database connection
async function startupDiagnostic() {
  console.log('========================================');
  console.log('=== ThingsVis Server Startup Diagnostic ===');
  console.log('========================================');

  // Log environment
  console.log(
    '[ENV] DATABASE_URL:',
    process.env.DATABASE_URL ? 'SET (length=' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
  );
  console.log('[ENV] AUTH_SECRET:', process.env.AUTH_SECRET ? 'SET' : 'NOT SET');
  console.log('[ENV] AUTH_URL:', process.env.AUTH_URL || 'NOT SET');
  console.log('[ENV] NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  console.log('[ENV] PORT:', process.env.PORT || 'NOT SET');

  // Test database connection
  try {
    console.log('[DB] Testing connection...');
    await prisma.$connect();
    console.log('[DB] ✓ Connected successfully');
    await prisma.$disconnect();
    console.log('[DB] ✓ Disconnected');
  } catch (error) {
    console.error('[DB] ✗ Connection FAILED:', error instanceof Error ? error.message : error);
  }

  console.log('========================================');
}

// Run diagnostic on module load (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  startupDiagnostic();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
