import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'apps/server/src/lib/upload-security.test.ts',
      'apps/server/src/app/api/v1/uploads/route.test.ts',
    ],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
