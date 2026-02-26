const path = require('path');
const fs = require('fs');
const { defineConfig } = require('@rspack/cli');
const { ModuleFederationPlugin } = require('@module-federation/rspack');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function sanitizeMfName(name) {
  // MF remote name eventually becomes a global variable in some runtimes.
  // Keep it as a safe identifier-ish string.
  return String(name).replace(/[^a-zA-Z0-9_]/g, '_');
}

function findEntry(pluginDir) {
  const candidates = ['src/index.ts', 'src/index.tsx', 'src/index.js', 'src/index.jsx'];
  for (const rel of candidates) {
    const p = path.join(pluginDir, rel);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`[thingsvis][widget-config] Cannot find widget entry in ${pluginDir}. Expected one of: ${candidates.join(', ')}`);
}

/**
 * Create a standardized Rspack+MF2 config for ThingsVis widgets.
 *
 * - MF remote name derived from package.json "name"
 * - Exposes { './Main': './src/index' }
 * - Shared singletons: react/react-dom/leafer-ui/@thingsvis/*
 *
 * NOTE: For MVP offline caching via Blob/ObjectURL, plugins should avoid code-splitting.
 */
function createWidgetConfig(pluginDir, opts = {}) {
  const pkg = readJson(path.join(pluginDir, 'package.json'));
  const pkgName = (pkg && pkg.name) || path.basename(pluginDir);
  const mfName = sanitizeMfName(pkgName);
  const entryAbs = findEntry(pluginDir);

  const port = opts.port ?? 3100;
  const defaultMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

  return defineConfig({
    mode: opts.mode ?? defaultMode,
    context: pluginDir,
    entry: {
      main: entryAbs
    },
    target: ['web', 'es2020'],
    devServer: {
      port,
      static: [
        // Serve the scaffolded index.html for quick manual checks.
        {
          directory: path.join(pluginDir, 'public'),
          watch: true
        },
        // Fallback to plugin root so other static assets are reachable.
        {
          directory: pluginDir,
          watch: true
        }
      ],
      headers: {
        // MF remotes are commonly requested cross-origin in dev
        'Access-Control-Allow-Origin': '*'
      }
    },
    output: {
      path: path.resolve(pluginDir, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].js',
      clean: true,
      uniqueName: mfName,
      publicPath: 'auto'
    },
    performance: {
      hints: false // 关闭打包含体积过大的警告
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true
                  },
                  transform: {
                    react: {
                      runtime: 'automatic'
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    },
    experiments: {
      css: true
    },
    optimization: {
      // 重要：为了支持离线/Blob加载 remoteEntry.js，MVP 阶段禁止组件拆分 chunk。
      splitChunks: false
    },
    plugins: [
      new ModuleFederationPlugin({
        name: mfName,
        filename: 'remoteEntry.js',
        dts: false,
        dev: {
          dts: false
        },
        exposes: {
          './Main': './src/index'
        },
        shared: {
          react: { singleton: true, requiredVersion: false, import: false },
          'react-dom': { singleton: true, requiredVersion: false, import: false },
          'leafer-ui': { singleton: true, requiredVersion: false, import: false },
          '@thingsvis/schema': { singleton: true, requiredVersion: false, import: false },
          '@thingsvis/utils': { singleton: true, requiredVersion: false, import: false },
          '@thingsvis/kernel': { singleton: true, requiredVersion: false, import: false },
          '@thingsvis/ui': { singleton: true, requiredVersion: false, import: false }
        }
      })
    ]
  });
}

module.exports = {
  createWidgetConfig
};


