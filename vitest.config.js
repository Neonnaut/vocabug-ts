import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    watch: false,
    isolate: false,
    threads: false,
    passWithNoTests: true // avoids failure if no tests are found
  }
});
