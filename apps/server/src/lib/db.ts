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
  logger.info('');
  logger.info('ThingsVis Server Startup Diagnostic');
  logger.info('----------------------------------------');

  const dbUrlSet = !!process.env.DATABASE_URL;
  const authSecretSet = !!process.env.AUTH_SECRET;
  logger.debug('[ENV] DATABASE_URL: ' + (dbUrlSet ? 'SET' : 'NOT SET'));
  logger.debug('[ENV] AUTH_SECRET: ' + (authSecretSet ? 'SET' : 'NOT SET'));
  logger.info('[ENV] AUTH_URL: ' + (process.env.AUTH_URL || 'NOT SET'));
  logger.info('[ENV] NODE_ENV: ' + (process.env.NODE_ENV || 'NOT SET'));
  logger.info('[ENV] PORT: ' + (process.env.PORT || 'NOT SET'));

  // Test database connection
  const startTime = Date.now();
  try {
    logger.debug('[DB] Testing database connection...');
    await prisma.$connect();
    const elapsed = Date.now() - startTime;
    logger.info('[DB] Database connected successfully in ' + elapsed + 'ms');
    await prisma.$disconnect();
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error({
      msg: '[DB] Database connection FAILED',
      error: error instanceof Error ? error.message : String(error),
      elapsed,
    });
  }

  logger.info('----------------------------------------');
}

// Run diagnostic on module load (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  startupDiagnostic();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
