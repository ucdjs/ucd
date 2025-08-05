// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  react: true,
  tailwindcss: false,
  pnpm: true,
}).append({
  ignores: [
    "src/routeTree.gen.ts",
    "worker/wrangler-types.d.ts",
  ],
});
