// @ts-check
import { luxass } from "@luxass/eslint-config";
import ucdjsPlugin from "@ucdjs/eslint-plugin";

export default luxass({
  formatters: true,
}, {
  ignores: [
    "worker-configuration.d.ts",
  ],
}).append({
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
