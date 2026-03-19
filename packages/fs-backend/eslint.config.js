// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}).append({
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        "node:*",
      ],
    }],
  },
}, {
  files: [
    "src/backends/node.ts",
  ],
  rules: {
    "no-restricted-imports": "off",
  },
});
