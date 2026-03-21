import type { TestProjectConfiguration } from "vitest/config";
import { defineProject } from "vitest/config";

const browserSetupFile = "./packages/shared-ui/test/browser/setup.ts";

const projects = [
  {
    test: {
      name: "shared-ui-browser",
      include: ["browser/**/*.test.ts?(x)"],
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          url: "http://localhost/",
        },
      },
      setupFiles: [browserSetupFile],
    },
  },
] satisfies TestProjectConfiguration[];

export default defineProject({
  test: {
    projects,
  },
});
