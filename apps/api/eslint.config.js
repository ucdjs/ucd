// @ts-check
import { luxass } from "@luxass/eslint-config";
import ucdjsPlugin from "@ucdjs-tooling/eslint-plugin";

export default luxass({
  type: "app",
  formatters: true,
  pnpm: true,
})
  .append({
    ignores: [
      "wrangler-types.d.ts",
    ],
  })
  .append({
    plugins: {
      ucdjs: ucdjsPlugin,
    },
    files: [
      "**/*.openapi.ts",
    ],
    rules: {
      "ucdjs/no-hardcoded-openapi-tags": "error",
    },
  });
