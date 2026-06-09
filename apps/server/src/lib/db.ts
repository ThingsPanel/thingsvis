import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  dbStartupPromise?: Promise<void>;
};

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

  const startTime = Date.now();

  try {
    logger.debug('[DB] Testing database connection...');
    await prisma.$connect();
    const elapsed = Date.now() - startTime;
    logger.info('[DB] Database connected successfully in ' + elapsed + 'ms');
    logger.info('----------------------------------------');
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    logger.fatal({
      msg: '[DB] Database connection FAILED - refusing to start server',
      error: message,
      elapsed,
    });
    logger.info('----------------------------------------');

    throw new Error(message);
  }
}

export function ensureDatabaseStartup(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }

  if (!globalForPrisma.dbStartupPromise) {
    globalForPrisma.dbStartupPromise = startupDiagnostic();
  }

  return globalForPrisma.dbStartupPromise;
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
