import { defaultExclude, defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "proxy:unit",
    include: ["test/unit/**"],
    exclude: [
      ...defaultExclude,
      "test/worker/**",
    ],
  },
});
