import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { ModuleFederationPlugin } from '@module-federation/rspack';
import path from 'path';
import fs from 'fs';
const { generateRegistryData } = require('../../scripts/generate-registry.js');

// -- 自动生成 Registry 插件 --
class GenerateRegistryPlugin {
  apply(compiler: any) {
    const generate = () => {
      try {
        return generateRegistryData();
      } catch (e) {
        console.warn('[GenerateRegistryPlugin] Failed to generate registry data', e);
        return null;
      }
    };

    // Write to public/ for dev server
    compiler.hooks.beforeCompile.tap('GenerateRegistryPlugin', () => {
      const registry = generate();
      if (!registry) return;
      const publicOutput = path.join(__dirname, 'public/registry.json');
      fs.mkdirSync(path.dirname(publicOutput), { recursive: true });
      fs.writeFileSync(publicOutput, JSON.stringify(registry, null, 2) + '\n', 'utf8');
      console.log(`[GenerateRegistryPlugin] Auto-generated registry.json with ${Object.keys(registry.components).length} components`);
    });

    // Also write to dist/ after build to guarantee it's in the output
    compiler.hooks.afterEmit.tap('GenerateRegistryPlugin', () => {
      const registry = generate();
      if (!registry) return;
      const distOutput = path.join(__dirname, 'dist/registry.json');
      if (fs.existsSync(path.dirname(distOutput))) {
        fs.writeFileSync(distOutput, JSON.stringify(registry, null, 2) + '\n', 'utf8');
      }
    });
  }
}

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx'
    },
    alias: {
      '@': './src',
      '@thingsvis/utils': path.resolve(__dirname, '../../packages/thingsvis-utils/src'),
      '@thingsvis/schema': path.resolve(__dirname, '../../packages/thingsvis-schema/src'),
      '@thingsvis/kernel': path.resolve(__dirname, '../../packages/thingsvis-kernel/src'),
      '@thingsvis/ui': path.resolve(__dirname, '../../packages/thingsvis-ui/src'),
    }
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    publicDir: {
      name: 'public',
      copyOnBuild: true,
    },
    proxy: {
      // Proxy API requests to local ThingsVis server
      '/api': {
        target: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy uploaded files to the backend server (files stored in apps/server/public/uploads/)
      '/uploads': {
        target: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  html: {
    title: 'ThingsVis 编辑器',
    template: path.resolve(__dirname, './index.html'),
  },
  dev: {
    setupMiddlewares: [
      (middlewares, server) => {
        // Serve widgets directory at /widgets path
        const sirv = require('sirv');
        const widgetsDir = path.resolve(__dirname, '../../widgets');
        const widgetsHandler = sirv(widgetsDir, { dev: true, etag: true });
        middlewares.unshift(
          (req: any, res: any, next: any) => {
            if (req.url?.startsWith('/widgets/')) {
              // Strip /widgets prefix for sirv to find the file
              const originalUrl = req.url;
              req.url = req.url.replace('/widgets', '');
              widgetsHandler(req, res, () => {
                // Restore original URL if not handled
                req.url = originalUrl;
                next();
              });
            } else {
              next();
            }
          }
        );
      },
    ],
  },
  output: {
    cleanDistPath: true,
    assetPrefix: process.env.PUBLIC_PATH || '/',
  },
  tools: {
    rspack: (config, { appendPlugins }) => {
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'thingsvis_host',
          shared: {
            react: { singleton: true, eager: true, requiredVersion: false },
            'react-dom': { singleton: true, eager: true, requiredVersion: false },
            'leafer-ui': { singleton: true, eager: true, requiredVersion: false },
            '@thingsvis/schema': { singleton: true, eager: true, requiredVersion: false },
            '@thingsvis/kernel': { singleton: true, eager: true, requiredVersion: false },
            '@thingsvis/ui': { singleton: true, eager: true, requiredVersion: false },
            '@thingsvis/utils': { singleton: true, eager: true, requiredVersion: false },
          },
        }),
        new GenerateRegistryPlugin(),
      ]);
    }
  }
});
