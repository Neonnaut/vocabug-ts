// vite.config.ts
import { defineConfig } from 'vite';

/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          examples: ['./src/examples.ts'] // 👈 Keep this file separate
        },
        entryFileNames: '[name].js',
        chunkFileNames: 'script/vocabug-lite/[name].js',
        assetFileNames: 'script/vocabug-lite/[name].[ext]'
      }

    }
  },
    test: {
    // ...
  },
});
