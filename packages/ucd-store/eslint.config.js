// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}).append({
  ignores: ["playgrounds/node-playground.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        "node:*",
      ],
    }],
  },
});
