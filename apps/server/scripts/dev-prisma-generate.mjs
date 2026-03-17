import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function writeOutput(stdout, stderr) {
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

function resolvePrismaEnginePath() {
  const prismaClientPackage = require.resolve('@prisma/client/package.json');
  const prismaClientDir = path.dirname(prismaClientPackage);
  return path.resolve(prismaClientDir, '..', '..', '.prisma', 'client', 'query_engine-windows.dll.node');
}

const command = process.platform === 'win32' ? 'pnpm exec prisma generate' : 'pnpm exec prisma generate';
const result = spawnSync(command, {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: true,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status === 0) {
  writeOutput(result.stdout, result.stderr);
  process.exit(0);
}

const combinedOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;
const isWindowsEngineRenameLock =
  process.platform === 'win32' &&
  combinedOutput.includes('EPERM: operation not permitted, rename') &&
  combinedOutput.includes('query_engine-windows.dll.node');
const existingEnginePath = resolvePrismaEnginePath();
const hasExistingEngine = fs.existsSync(existingEnginePath);

if (isWindowsEngineRenameLock && hasExistingEngine) {
  writeOutput(result.stdout, result.stderr);
  console.warn(
    [
      'Prisma generate hit a locked Windows query engine DLL during dev startup.',
      `Using existing generated client instead: ${existingEnginePath}`,
      'If you changed prisma/schema.prisma, stop the running server process and run `pnpm --filter @thingsvis/server db:generate` manually.',
    ].join('\n'),
  );
  process.exit(0);
}

writeOutput(result.stdout, result.stderr);
process.exit(result.status ?? 1);
