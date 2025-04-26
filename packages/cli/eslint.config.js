// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "app",
  pnpm: true,
}, {
  ignores: ["**/*.md"],
});
