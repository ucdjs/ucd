// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}, {
  ignores: ["**/*.md"],
}, {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        "node:*",
      ],
    }],
  },
});
