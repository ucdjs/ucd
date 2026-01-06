// @ts-check
import { GLOB_TESTS, luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}).append({
  ignores: [
    "src/bridges/node.ts",
    "playgrounds/**",
    ...GLOB_TESTS,
  ],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        "node:*",
      ],
    }],
  },
});
