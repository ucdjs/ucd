import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "shared-ui",
    include: ["**/*.test.ts?(x)"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./packages/shared-ui/test/browser/setup.ts"],
  }
});
