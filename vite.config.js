// vite.config.ts
import { defineConfig } from 'vite';

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
  }
});
