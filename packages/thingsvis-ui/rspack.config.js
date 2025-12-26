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
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@thingsvis/utils': path.resolve(__dirname, '../thingsvis-utils/src')
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


