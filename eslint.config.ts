import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**", "bin/**", "codemirror/**",
      "node_modules/**", "app/vocabug/index.ts", "app/nesca/index.ts",
      "app/vocabug/dist/**", "app/nesca/dist/**",
      "app/vocabug/cm6.bundle.js", "app/nesca/cm6.bundle.js",
      "build.**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
]);