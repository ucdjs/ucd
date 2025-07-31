// @ts-check
import { GLOB_TESTS, luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}).append({
  ignores: ["playgrounds/node-playground.ts", ...GLOB_TESTS],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        "node:*",
      ],
    }],
  },
});
