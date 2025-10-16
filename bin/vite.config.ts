import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'bin',
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      formats: ['es'], // ✅ only CommonJS
      fileName: () => 'index.mjs' // ✅ use .cjs to avoid ESM confusion
    },
    rollupOptions: {
      external: [
        'fs', 'path', 'url', 'util', 'assert', 'module',
        'node:fs', 'node:path', 'node:url', 'node:util', 'node:assert', 'node:module',
        'yargs', 'yargs/helpers', 'yargs-parser', 'escalade', 'y18n', 'get-caller-file', 'string-width'
      ]
    }
  },
  resolve: {
    conditions: ['node'],
    alias: {
      'node:fs': 'fs',
      'node:path': 'path',
      'node:url': 'url',
      'node:util': 'util',
      'node:assert': 'assert',
      'node:module': 'module'
    }
  }
});