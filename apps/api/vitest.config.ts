import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "api:unit",
    include: ["test/unit/**"],
    exclude: [
      "**/*.test.ts",
    ],
  },
});
