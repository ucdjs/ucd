// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  react: {
    tsconfigPath: "./tsconfig.json",
  },
  tailwindcss: false,
});
