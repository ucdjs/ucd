import { defineProject } from "vitest/config";
import { aliases } from "../../../vitest.aliases.ts";

const testDir = "./packages/pipelines/pipeline-server/test";
const browserSetupFile = "./packages/pipelines/pipeline-server/test/browser/setup.ts";

export default defineProject({
  test: {
    projects: [
      defineProject({
        extends: true,
        resolve: {
          alias: aliases,
        },
        test: {
          name: "pipeline-server",
          dir: testDir,
          include: ["server/**/*.test.ts"],
          environment: "node",
        },
      }),
      defineProject({
        extends: true,
        resolve: {
          alias: aliases,
        },
        test: {
          name: "pipeline-server-browser",
          dir: testDir,
          include: ["browser/**/*.test.ts?(x)"],
          environment: "jsdom",
          setupFiles: [browserSetupFile],
        },
      }),
    ],
  },
});
