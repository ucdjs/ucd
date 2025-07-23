import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "proxy:unit",
    include: ["test/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
  },
});
