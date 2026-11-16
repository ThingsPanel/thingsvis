import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'apps/server/src/lib/platform-identity.test.ts',
      'apps/server/src/lib/auth-secret.test.ts',
      'apps/server/src/app/api/v1/auth/sso/route.test.ts',
      'apps/server/scripts/seed-admin.test.ts',
    ],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
