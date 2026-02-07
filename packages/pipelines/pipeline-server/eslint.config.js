// @ts-check
import { luxass } from "@luxass/eslint-config";
import pkg from "./package.json" with { type: "json" };

const clientOnlyImports = Object.keys(pkg.imports).filter((key) => !key.startsWith("#server/"));
const serverOnlyImports = Object.keys(pkg.imports).filter((key) => key.startsWith("#server/"));

export default luxass({
  type: "app",
  pnpm: true,
  react: true,
}).append({
  files: [
    "./src/server/**/*.ts",
  ],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        ...clientOnlyImports,
      ],
    }],
  },
}).append({
  files: [
    "./src/client/**/*.ts",
    "./src/client/**/*.tsx",
  ],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        ...serverOnlyImports,
      ],
    }],
  },
});
