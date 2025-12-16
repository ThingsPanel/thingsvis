const path = require('path');
const { defineConfig } = require('@rspack/cli');

module.exports = defineConfig({
  mode: 'development',
  entry: {
    main: './src/main.tsx'
  },
  target: ['web', 'es2020'],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@thingsvis/kernel': path.resolve(__dirname, '../../packages/thingsvis-kernel/src'),
      '@thingsvis/ui': path.resolve(__dirname, '../../packages/thingsvis-ui/src'),
      '@thingsvis/schema': path.resolve(__dirname, '../../packages/thingsvis-schema/src')
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
      }
    ]
  }
});


