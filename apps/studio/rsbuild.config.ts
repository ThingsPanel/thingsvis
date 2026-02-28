import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { ModuleFederationPlugin } from '@module-federation/rspack';
import path from 'path';
import fs from 'fs';

// -- 自动生成 Registry 插件 --
class GenerateRegistryPlugin {
  apply(compiler: any) {
    compiler.hooks.beforeCompile.tap('GenerateRegistryPlugin', () => {
      const ROOT = path.resolve(__dirname, '../../');
      const WIDGETS_DIR = path.join(ROOT, 'widgets');
      const OUTPUT = path.join(__dirname, 'public/registry.json');

      const sanitizeMfName = (name: string) => String(name).replace(/[^a-zA-Z0-9_]/g, '_');
      const extractDevPort = (scripts: any) => {
        const match = (scripts?.dev || '').match(/--port\s+(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      };

      if (!fs.existsSync(WIDGETS_DIR)) return;

      const components: Record<string, any> = {};
      const categories = fs.readdirSync(WIDGETS_DIR, { withFileTypes: true }).filter(d => d.isDirectory());

      for (const category of categories) {
        const categoryPath = path.join(WIDGETS_DIR, category.name);
        const widgets = fs.readdirSync(categoryPath, { withFileTypes: true }).filter(d => d.isDirectory());

        for (const widget of widgets) {
          const pkgPath = path.join(categoryPath, widget.name, 'package.json');
          if (!fs.existsSync(pkgPath)) continue;

          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const meta = pkg.thingsvis || {};
            const componentId = `${category.name}/${widget.name}`;
            const devPort = extractDevPort(pkg.scripts);

            components[componentId] = {
              remoteName: sanitizeMfName(pkg.name),
              remoteEntryUrl: devPort ? `http://localhost:${devPort}/remoteEntry.js` : ``,
              staticEntryUrl: `/widgets/${componentId}/dist/remoteEntry.js`,
              debugSource: 'static',
              exposedModule: './Main',
              version: pkg.version || '0.0.1',
              ...(meta.icon && { icon: meta.icon }),
              ...(meta.displayName && { name: meta.displayName }),
              ...(meta.i18n && { i18n: meta.i18n }),
            };
          } catch (e) {
            console.warn(`[GenerateRegistryPlugin] Failed to parse ${pkgPath}`, e);
          }
        }
      }

      const registry = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        components,
      };

      fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
      fs.writeFileSync(OUTPUT, JSON.stringify(registry, null, 2) + '\n', 'utf8');
      console.log(`[GenerateRegistryPlugin] Auto-generated registry.json with ${Object.keys(components).length} components`);
    });
  }
}

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      main: './src/main.tsx'
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
    cleanDistPath: true
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

