// vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

import banner from 'vite-plugin-banner'
import pkg from './package.json' with { type: 'json' };

import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
dts({
  outDir: 'dist',

  rollupTypes: true,           // 👈 flattens all types into index.d.ts
  insertTypesEntry: true,      // adds `types` field to package.json
  cleanVueFileName: true,      // optional: strips .vue suffixes if present
  staticImport: false          // 👈 disables `import` statements in .d.ts
}),

    banner(`Program: ${pkg.name} -- version: ${pkg.version} -- license: ${pkg.license} -- author: ${pkg.author}\nRepository: ${pkg.repository.url}`)
  ],
  test: {
    globals: true,
    environment: 'node'
  },
  build: {
  //terserOptions: {
  //  keep_fnames: true
  //},


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


