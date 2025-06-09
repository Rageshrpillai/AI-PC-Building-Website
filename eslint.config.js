// eslint.config.js
import js from "@eslint/js";
import globals from "globals"; // Ensure this is imported at the top
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },

  // Configuration for your React frontend code (e.g., src directory)
  {
    files: ["src/**/*.{js,jsx}"], // Be more specific: target files in 'src' for browser/React rules
    languageOptions: {
      ecmaVersion: 2022, // Using a more recent ECMAScript version is fine
      globals: {
        ...globals.browser, // Browser globals for React
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ], // Changed 'error' to 'warn' for no-unused-vars for smoother dev
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // --- NEW CONFIGURATION FOR YOUR API (NODE.JS) CODE ---
  {
    files: ["api/**/*.js"], // Specifically targets JavaScript files in the 'api' directory
    languageOptions: {
      ecmaVersion: 2022, // Or your preferred modern version for Node.js
      sourceType: "module", // Because your api/buildbot.js uses import/export
      globals: {
        ...globals.node, // This adds all standard Node.js globals like 'process' and 'Buffer'
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Allow unused args prefixed with _
      // You can add other Node.js specific rules or plugins here if needed
      // For example, if you had commonJS modules (require/module.exports), you'd set sourceType: 'commonjs'
    },
  },
  // --- END NEW CONFIGURATION ---
];
