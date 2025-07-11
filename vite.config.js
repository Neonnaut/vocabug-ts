// vite.config.ts
/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
    globals: true,
    environment: 'node'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/api_entrypoint'),
      name: 'vocabug',
      formats: ['es', 'cjs'],
      fileName: format => `vocabug.${format}.js`
    },
    rollupOptions: {
      external: [], // Add external dependencies to avoid bundling them
    },
    outDir: 'dist'
  }
});
