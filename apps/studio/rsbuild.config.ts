import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { ModuleFederationPlugin } from '@module-federation/rspack';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

// -- 自动生成 Registry 插件 --
class GenerateRegistryPlugin {
  apply(compiler: any) {
    const publicOutput = path.join(__dirname, 'public/registry.json');
    const scriptPath = path.resolve(__dirname, '../../scripts/generate-registry.js');

    const generate = () => {
      execFileSync(process.execPath, [scriptPath], {
        cwd: path.resolve(__dirname, '../../'),
        stdio: 'ignore',
      });
      const raw = fs.readFileSync(publicOutput, 'utf8');
      return JSON.parse(raw);
    };

    // Write to public/ for dev server
    compiler.hooks.beforeCompile.tap('GenerateRegistryPlugin', () => {
      try {
        const registry = generate();
        console.log(
          `[GenerateRegistryPlugin] Auto-generated registry.json with ${Object.keys(registry.components).length} components`,
        );
      } catch (error) {
        console.warn('[GenerateRegistryPlugin] Failed to generate registry.json', error);
      }
    });

    // Also write to dist/ after build to guarantee it's in the output
    compiler.hooks.afterEmit.tap('GenerateRegistryPlugin', () => {
      const distOutput = path.join(__dirname, 'dist/registry.json');
      if (fs.existsSync(publicOutput) && fs.existsSync(path.dirname(distOutput))) {
        fs.copyFileSync(publicOutput, distOutput);
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
