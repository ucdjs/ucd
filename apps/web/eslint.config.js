// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  react: true,
  tailwindcss: false,
  pnpm: true,
}, {
  ignores: [
    "src/routeTree.gen.ts",
  ],
});
