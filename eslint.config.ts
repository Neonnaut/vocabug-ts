import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    ignores: ["dist/**", "bin/**", "codemirror/**", "node_modules/**", "app/index.ts", "app/dist/**", "app/cm6.bundle.js"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier // Should be last to override other configs
]);