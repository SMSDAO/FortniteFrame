import js from "@eslint/js";
import tsEslint from "typescript-eslint";
import globals from "globals";

export default [
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  // Ignore generated dirs
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "artifacts/**",
      "cache/**",
    ],
  },
  // Node.js environment for all JS/TS files
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
    },
  },
  // Test files: mocha globals
  {
    files: ["test/**/*.{js,ts,mjs}"],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];
