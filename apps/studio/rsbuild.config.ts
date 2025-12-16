import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      main: './src/main.tsx'
    }
  },
  server: {
    port: 3000
  },
  output: {
    cleanDistPath: true
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
      }
    }
  }
});

