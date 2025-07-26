import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/editor.ts',
  output: {
    file: 'dist/cm6.bundle.js',
    format: 'iife',
    name: 'cm6',
    sourcemap: true,
  },
  plugins: [resolve(), typescript()],
};

typescript({
  exclude: ['lezer/**']
})

