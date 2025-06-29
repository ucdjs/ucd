// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  pnpm: true,
}, {
  ignores: ["**/*.md"],
});
