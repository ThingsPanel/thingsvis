import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { ModuleFederationPlugin } from '@module-federation/rspack';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      main: './src/main.tsx'
    },
    alias: {
      '@': './src',
    }
  },
  server: {
    port: 3000,
    publicDir: {
      name: 'public',
      copyOnBuild: true,
    },
  },
  dev: {
    setupMiddlewares: [
      (middlewares, server) => {
        // Serve plugins directory at /plugins path
        const sirv = require('sirv');
        const pluginsDir = path.resolve(__dirname, '../../plugins');
        const pluginsHandler = sirv(pluginsDir, { dev: true, etag: true });
        middlewares.unshift(
          (req: any, res: any, next: any) => {
            if (req.url?.startsWith('/plugins/')) {
              // Strip /plugins prefix for sirv to find the file
              const originalUrl = req.url;
              req.url = req.url.replace('/plugins', '');
              pluginsHandler(req, res, () => {
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
      ]);
    }
  }
});

