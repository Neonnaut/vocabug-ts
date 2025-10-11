// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/shell.ts', // app entrypoint

      output: {
        //manualChunks: {
        //  examples: ['./src/examples.ts'] // 👈 Keep this file separate
        //},
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }

    }
  }
});
