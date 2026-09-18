import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/**", "node_modules/**", ".venv/**", "coverage/**"] },
  js.configs.recommended,
  { plugins: { "@next/next": nextPlugin }, rules: { ...nextPlugin.configs.recommended.rules } },
];
