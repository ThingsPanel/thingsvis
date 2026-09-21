import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./apps/server/src', import.meta.url)) } },
  test: { environment: 'node', include: ['apps/server/src/**/*.test.ts'] },
});
