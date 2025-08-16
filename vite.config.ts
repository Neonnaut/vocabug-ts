// vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'vocabug',
      formats: ['es', 'cjs'],
      fileName: format => `vocabug.${format}.js`
    },
    outDir: 'dist',
    rollupOptions: {
      external: [] // Add any external packages here
    }
  }
});

