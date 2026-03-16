import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, 'apps/studio/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    alias: {
      '@': path.resolve(__dirname, './apps/studio/src'),
      '@thingsvis/kernel': path.resolve(__dirname, './packages/thingsvis-kernel/src'),
      '@thingsvis/schema': path.resolve(__dirname, './packages/thingsvis-schema/src'),
      '@thingsvis/ui': path.resolve(__dirname, './packages/thingsvis-ui/src'),
      '@thingsvis/utils': path.resolve(__dirname, './packages/thingsvis-utils/src'),
      '@thingsvis/widget-sdk': path.resolve(__dirname, './packages/thingsvis-widget-sdk/src'),
    },
  },
});
