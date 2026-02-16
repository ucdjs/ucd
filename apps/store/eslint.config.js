// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "app",
  formatters: true,
  pnpm: true,
})
  .append({
    ignores: [
      "wrangler-types.d.ts",
    ],
  });
