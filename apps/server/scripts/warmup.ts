import { ensureDatabaseStartup } from '../src/lib/db';
import { logger } from '../src/lib/logger';

async function main() {
  logger.info('[BOOT] Warmup start: verifying database connectivity before server startup');
  await ensureDatabaseStartup();
  logger.info('[BOOT] Warmup complete: database ready, proceeding to Next.js startup');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  logger.fatal({
    msg: '[BOOT] Warmup failed - aborting server startup',
    error: message,
  });

  process.exit(1);
});
