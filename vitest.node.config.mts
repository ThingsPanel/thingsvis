import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(rootDir, './apps/studio/src'),
      '@thingsvis/kernel': path.resolve(rootDir, './packages/thingsvis-kernel/src'),
      '@thingsvis/schema': path.resolve(rootDir, './packages/thingsvis-schema/src'),
      '@thingsvis/ui': path.resolve(rootDir, './packages/thingsvis-ui/src'),
      '@thingsvis/utils': path.resolve(rootDir, './packages/thingsvis-utils/src'),
      '@thingsvis/widget-sdk': path.resolve(rootDir, './packages/thingsvis-widget-sdk/src'),
    },
  },
});
