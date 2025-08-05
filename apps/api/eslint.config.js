// @ts-check
import { luxass } from "@luxass/eslint-config";
import ucdjsPlugin from "@ucdjs/eslint-plugin";

export default luxass({
  formatters: true,
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
