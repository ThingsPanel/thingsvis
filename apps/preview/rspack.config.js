const path = require('path');
const { defineConfig } = require('@rspack/cli');
const { ModuleFederationPlugin } = require('@module-federation/rspack');

module.exports = defineConfig({
  mode: 'development',
  experiments: {
    css: true
  },
  entry: {
    main: './src/main.tsx'
  },
  target: ['web', 'es2020'],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'public'),
      },
      {
        directory: path.resolve(__dirname, '../../plugins'),
        publicPath: '/plugins',
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    uniqueName: 'thingsvis_preview',
    publicPath: 'auto',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@thingsvis/kernel': path.resolve(__dirname, '../../packages/thingsvis-kernel/src'),
      '@thingsvis/ui': path.resolve(__dirname, '../../packages/thingsvis-ui/src'),
      '@thingsvis/schema': path.resolve(__dirname, '../../packages/thingsvis-schema/src'),
      '@thingsvis/utils': path.resolve(__dirname, '../../packages/thingsvis-utils/src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.css$/,
        type: 'css/auto'
      }
    ]
  },
  plugins: [
    // Host share-scope provider for MF2 remotes.
    new ModuleFederationPlugin({
      name: 'thingsvis_preview_host',
      filename: 'remoteEntry.js',
      exposes: {},
      shared: {
        // Host 提供共享依赖，设置 eager:true 防止 loadShareSync 报错。
        react: { singleton: true, eager: true, requiredVersion: false },
        'react-dom': { singleton: true, eager: true, requiredVersion: false },
        'leafer-ui': { singleton: true, eager: true, requiredVersion: false },
        '@thingsvis/schema': { singleton: true, eager: true, requiredVersion: false },
        '@thingsvis/kernel': { singleton: true, eager: true, requiredVersion: false },
        '@thingsvis/ui': { singleton: true, eager: true, requiredVersion: false },
        '@thingsvis/utils': { singleton: true, eager: true, requiredVersion: false }
      }
    })
  ]
});


