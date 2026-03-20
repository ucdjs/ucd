import type { TestProjectConfiguration } from "vitest/config";
import { defineProject } from "vitest/config";

const browserSetupFile = "./packages/pipelines/pipeline-server/test/browser/setup.ts";

const projects = [
  {
    test: {
      name: "pipeline-server",
      include: ["server/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    test: {
      name: "pipeline-server-browser",
      include: ["browser/**/*.test.ts?(x)"],
      environment: "jsdom",
      setupFiles: [browserSetupFile],
    },
  },
] satisfies TestProjectConfiguration[];

export default defineProject({
  test: {
    projects,
  },
});
