import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@rspack/cli';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  mode: 'development',
  entry: {
    index: './src/index.ts'
  },
  target: ['web', 'es2020'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'commonjs2'
    },
    clean: true
  },
  externals: {
    // Prevent bundler trying to resolve Node-only modules when building web-targeted bundles.
    worker_threads: 'commonjs2 worker_threads'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript'
                }
              }
            }
          }
        ]
      }
    ]
  }
});


